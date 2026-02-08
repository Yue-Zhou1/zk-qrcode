import fs from 'fs';

import type { Request, Response } from 'express';
import QRCode from 'qrcode';

import config from '../server/config';
import * as db from '../server/db';
import { AppError } from '../server/http';
import {
  parseProofPayload,
  parseRootPayload,
  ParsedProofPayload,
  serializeProofPayload,
  serializeRootPayload,
} from '../server/payloads';

const snarkjs = require('snarkjs') as any;

let cachedVerificationKey: Record<string, unknown> | null = null;

function assertString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(400, `${fieldName} must be a non-empty string`);
  }

  return value.trim();
}

function normalizeClaimType(claimType: unknown): db.ClaimType {
  const normalizedClaimType = assertString(claimType, 'type').toLowerCase() as db.ClaimType;
  db.getClaimDefinition(normalizedClaimType);
  return normalizedClaimType;
}

function getVerificationKey(): Record<string, unknown> {
  if (!cachedVerificationKey) {
    try {
      cachedVerificationKey = JSON.parse(fs.readFileSync(config.zk.verificationKeyPath, 'utf-8'));
    } catch (error) {
      throw new AppError(500, 'Failed to load verification key', {
        path: config.zk.verificationKeyPath,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return cachedVerificationKey;
}

function resolveMerkleProofIndex(
  parsedProofPayload: ParsedProofPayload,
  merkleRecord: db.MerkleRecord
): number {
  if (parsedProofPayload.claimType) {
    return db.getClaimDefinition(parsedProofPayload.claimType as db.ClaimType).merkleProofIndex;
  }

  if (!parsedProofPayload.merkleProof) {
    throw new AppError(400, 'Proof payload is missing merkleProof');
  }

  const inferredIndex = db.inferProofIndexFromMerkleProof(
    merkleRecord,
    parsedProofPayload.merkleProof
  );

  if (inferredIndex < 0) {
    throw new AppError(400, 'Merkle proof does not match stored claim proofs');
  }

  return inferredIndex;
}

export async function createProof(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, unknown>;
  const userId = assertString(body.id, 'id');
  const claimType = normalizeClaimType(body.type);

  const claimData = await db.getClaimData(userId, claimType);

  const proveInput = {
    in1: claimData.claimInput,
    in2: claimData.limit,
  };

  const { proof } = await snarkjs.plonk.fullProve(
    proveInput,
    config.zk.circuitWasmPath,
    config.zk.circuitZkeyPath
  );

  const publicSignals = [config.zk.successPublicSignal];
  const proofPayload = serializeProofPayload({
    proof,
    publicSignals,
    merkleProof: claimData.merkleProof,
    claimType,
  });

  const qrcUrl = await QRCode.toDataURL(proofPayload, {
    errorCorrectionLevel: 'L',
  });

  res.status(200).json({
    message: 'Proof created successfully',
    claimType,
    qrcUrl,
    proof: proofPayload,
  });
}

export async function verifyProof(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, unknown>;
  const userId = assertString(body.id, 'id');
  const parsedProofPayload = parseProofPayload(body.proof);

  if (!parsedProofPayload.merkleProof) {
    throw new AppError(400, 'Proof payload must include merkleProof');
  }

  const verificationKey = getVerificationKey();
  const publicSignals =
    Array.isArray(parsedProofPayload.publicSignals) && parsedProofPayload.publicSignals.length > 0
      ? parsedProofPayload.publicSignals
      : [config.zk.successPublicSignal];

  const isSnarkValid = await snarkjs.plonk.verify(
    verificationKey,
    publicSignals,
    parsedProofPayload.proof
  );

  const { user, merkleRecord } = await db.getUserAndMerkleById(userId);
  const merkleProofIndex = resolveMerkleProofIndex(parsedProofPayload, merkleRecord);
  const { leafValue } = db.getLeafValueByProofIndex(user, merkleProofIndex);

  const isMerkleValid = db.verifyMerkleProof(
    parsedProofPayload.merkleProof,
    leafValue,
    merkleRecord.root
  );

  if (!isSnarkValid || !isMerkleValid) {
    res.status(401).json({
      message: 'Verify failed',
      checks: {
        snark: isSnarkValid,
        merkle: isMerkleValid,
      },
    });
    return;
  }

  res.status(200).json({
    message: 'Verify success',
  });
}

export async function verifyMerkleTree(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, unknown>;
  const userId = assertString(body.id, 'id');
  const rootPayload = parseRootPayload(body.root);

  const { merkleRecord } = await db.getUserAndMerkleById(userId);

  if (rootPayload.root !== merkleRecord.root) {
    res.status(401).json({ message: 'User identity unknown' });
    return;
  }

  const identityProof = db.getIdentityMerkleProof(merkleRecord);
  const isIdentityValid = db.verifyMerkleProof(identityProof, userId, rootPayload.root);

  if (!isIdentityValid) {
    res.status(401).json({ message: 'User identity unknown' });
    return;
  }

  res.status(200).json({ message: 'User identity verified' });
}

export async function createMerkleTree(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, unknown>;
  const userId = assertString(body.id, 'id');
  const { merkleRecord } = await db.getUserAndMerkleById(userId);

  const rootPayload = serializeRootPayload(merkleRecord.root);
  const qrcUrl = await QRCode.toDataURL(rootPayload, {
    errorCorrectionLevel: 'L',
  });

  res.status(200).json({
    message: 'QR code created successfully',
    qrcUrl,
    root: rootPayload,
  });
}
