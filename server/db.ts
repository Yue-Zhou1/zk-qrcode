import SHA256 from 'crypto-js/sha256';
import { Collection, MongoClient, ServerApiVersion } from 'mongodb';
import { MerkleTree } from 'merkletreejs';

import config from './config';
import { AppError } from './http';

const COLLECTIONS = Object.freeze({
  USERS: 'documents',
  MERKLE: 'merkletree',
});

export type ClaimType = 'age' | 'drive' | 'profession';

export interface UserDocument {
  id: string;
  dob?: string;
  drilicence?: string;
  profession?: string;
  [key: string]: unknown;
}

export interface MerkleRecord {
  id: string;
  root: string;
  proof: unknown[];
  [key: string]: unknown;
}

interface ClaimDefinition {
  limit: number;
  merkleProofIndex: number;
  sourceField: keyof UserDocument;
  resolveInput: (user: UserDocument) => number;
}

export const CLAIM_DEFINITIONS: Record<ClaimType, ClaimDefinition> = {
  age: {
    limit: 18,
    merkleProofIndex: 2,
    sourceField: 'dob',
    resolveInput(user) {
      return calculateAgeFromDob(typeof user.dob === 'string' ? user.dob : '');
    },
  },
  drive: {
    limit: 2,
    merkleProofIndex: 6,
    sourceField: 'drilicence',
    resolveInput(user) {
      return Number.parseInt(String(user.drilicence ?? ''), 10);
    },
  },
  profession: {
    limit: 6,
    merkleProofIndex: 7,
    sourceField: 'profession',
    resolveInput(user) {
      return Number.parseInt(String(user.profession ?? ''), 10);
    },
  },
};

const IDENTITY_PROOF_INDEX = 1;

let mongoClient: MongoClient | null = null;
let connectionPromise: Promise<MongoClient> | null = null;

function createClient(): MongoClient {
  return new MongoClient(config.mongoUri, {
    serverApi: ServerApiVersion.v1,
  });
}

function getClient(): MongoClient {
  if (!mongoClient) {
    mongoClient = createClient();
  }
  return mongoClient;
}

export async function connectToDatabase(): Promise<MongoClient> {
  if (!connectionPromise) {
    const client = getClient();
    connectionPromise = client.connect().catch((error: unknown) => {
      connectionPromise = null;
      throw error;
    });
  }

  await connectionPromise;
  return getClient();
}

export async function getCollections(): Promise<{
  users: Collection<UserDocument>;
  merkleTrees: Collection<MerkleRecord>;
}> {
  const client = await connectToDatabase();
  const database = client.db(config.dbName);

  return {
    users: database.collection<UserDocument>(COLLECTIONS.USERS),
    merkleTrees: database.collection<MerkleRecord>(COLLECTIONS.MERKLE),
  };
}

function assertUserId(userId: string): void {
  if (typeof userId !== 'string' || !userId.trim()) {
    throw new AppError(400, 'id must be a non-empty string');
  }
}

export function getClaimDefinition(claimType: ClaimType): ClaimDefinition {
  const definition = CLAIM_DEFINITIONS[claimType];
  if (!definition) {
    throw new AppError(400, `Unsupported claim type: ${claimType}`);
  }
  return definition;
}

function calculateAgeFromDob(dobValue: string): number {
  if (typeof dobValue !== 'string' || dobValue.length < 10) {
    throw new AppError(422, 'DOB is missing or invalid');
  }

  const day = Number.parseInt(dobValue.slice(0, 2), 10);
  const month = Number.parseInt(dobValue.slice(3, 5), 10);
  const year = Number.parseInt(dobValue.slice(6, 10), 10);

  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
    throw new AppError(422, 'DOB format is invalid. Expected DD/MM/YYYY');
  }

  const birthDate = new Date(year, month - 1, day);
  if (Number.isNaN(birthDate.getTime())) {
    throw new AppError(422, 'DOB could not be parsed');
  }

  const ageDeltaMs = Date.now() - birthDate.getTime();
  const ageDate = new Date(ageDeltaMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

export async function getUserAndMerkleById(
  userId: string
): Promise<{ user: UserDocument; merkleRecord: MerkleRecord }> {
  assertUserId(userId);

  const { users, merkleTrees } = await getCollections();
  const query = { id: userId };

  const [user, merkleRecord] = await Promise.all([users.findOne(query), merkleTrees.findOne(query)]);

  if (!user) {
    throw new AppError(404, `User not found for id=${userId}`);
  }
  if (!merkleRecord) {
    throw new AppError(404, `Merkle record not found for id=${userId}`);
  }

  return {
    user,
    merkleRecord,
  };
}

function getClaimDataFromRecords(
  user: UserDocument,
  merkleRecord: MerkleRecord,
  claimType: ClaimType
): {
  claimType: ClaimType;
  limit: number;
  claimInput: number;
  merkleProof: unknown;
  merkleProofIndex: number;
  leafValue: unknown;
  sourceField: keyof UserDocument;
  root: string;
} {
  const definition = getClaimDefinition(claimType);
  const claimInput = definition.resolveInput(user);

  if (!Number.isInteger(claimInput)) {
    throw new AppError(422, `Claim input is invalid for claimType=${claimType}`);
  }

  if (!Array.isArray(merkleRecord.proof)) {
    throw new AppError(500, 'Stored merkle proof list is invalid');
  }

  const merkleProof = merkleRecord.proof[definition.merkleProofIndex];
  if (!merkleProof) {
    throw new AppError(500, `Merkle proof is missing for claimType=${claimType}`);
  }

  const leafValue = user[definition.sourceField];
  if (leafValue === null || leafValue === undefined) {
    throw new AppError(422, `User field is missing for claimType=${claimType}`);
  }

  return {
    claimType,
    limit: definition.limit,
    claimInput,
    merkleProof,
    merkleProofIndex: definition.merkleProofIndex,
    leafValue,
    sourceField: definition.sourceField,
    root: String(merkleRecord.root),
  };
}

export async function getClaimData(
  userId: string,
  claimType: ClaimType
): Promise<ReturnType<typeof getClaimDataFromRecords>> {
  const { user, merkleRecord } = await getUserAndMerkleById(userId);
  return getClaimDataFromRecords(user, merkleRecord, claimType);
}

export function inferProofIndexFromMerkleProof(
  merkleRecord: MerkleRecord,
  merkleProof: unknown
): number {
  if (!Array.isArray(merkleRecord.proof)) {
    throw new AppError(500, 'Stored merkle proof list is invalid');
  }

  const target = JSON.stringify(merkleProof);
  return merkleRecord.proof.findIndex((proofItem) => JSON.stringify(proofItem) === target);
}

export function getLeafValueByProofIndex(
  user: UserDocument,
  proofIndex: number
): { leafValue: unknown; sourceField: keyof UserDocument } {
  const definition = Object.values(CLAIM_DEFINITIONS).find(
    (claim) => claim.merkleProofIndex === proofIndex
  );

  if (!definition) {
    throw new AppError(400, `Unsupported merkle proof index: ${proofIndex}`);
  }

  const leafValue = user[definition.sourceField];
  if (leafValue === null || leafValue === undefined) {
    throw new AppError(422, `User field is missing for proof index=${proofIndex}`);
  }

  return {
    leafValue,
    sourceField: definition.sourceField,
  };
}

export function getIdentityMerkleProof(merkleRecord: MerkleRecord): unknown {
  if (!Array.isArray(merkleRecord.proof)) {
    throw new AppError(500, 'Stored merkle proof list is invalid');
  }

  const proof = merkleRecord.proof[IDENTITY_PROOF_INDEX];
  if (!proof) {
    throw new AppError(500, 'Identity merkle proof is missing');
  }

  return proof;
}

export function verifyMerkleProof(merkleProof: unknown, leafValue: unknown, root: string): boolean {
  const normalizedLeaf = SHA256(String(leafValue));
  return MerkleTree.verify(
    MerkleTree.unmarshalProof(merkleProof as any),
    normalizedLeaf as any,
    root as any
  );
}
