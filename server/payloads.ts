import { AppError } from './http';

export const PROOF_KIND = 'proof-v1';
export const ROOT_KIND = 'identity-root-v1';
const LEGACY_PROOF_MARKER = '1';
const LEGACY_ROOT_MARKER = '2';

function ensureNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(400, `${fieldName} must be a non-empty string`);
  }

  return value.trim();
}

export interface SerializedProofPayloadInput {
  proof: Record<string, unknown>;
  publicSignals: string[];
  merkleProof: unknown;
  claimType: string;
}

export interface ParsedProofPayload {
  kind: string;
  proof: Record<string, unknown>;
  publicSignals: string[];
  merkleProof: unknown;
  claimType: string | null;
}

export function serializeProofPayload(payload: SerializedProofPayloadInput): string {
  return JSON.stringify({
    kind: PROOF_KIND,
    protocol: 'plonk',
    claimType: payload.claimType,
    proof: payload.proof,
    publicSignals: payload.publicSignals,
    merkleProof: payload.merkleProof,
  });
}

export function parseProofPayload(rawPayload: unknown): ParsedProofPayload {
  const payload = ensureNonEmptyString(rawPayload, 'proof');

  if (payload.startsWith('{')) {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(payload);
    } catch {
      throw new AppError(400, 'proof payload is not valid JSON');
    }

    if (!parsed.proof || typeof parsed.proof !== 'object') {
      throw new AppError(400, 'proof payload is missing a valid proof object');
    }

    return {
      kind: typeof parsed.kind === 'string' ? parsed.kind : PROOF_KIND,
      proof: parsed.proof as Record<string, unknown>,
      publicSignals:
        Array.isArray(parsed.publicSignals) && parsed.publicSignals.length > 0
          ? parsed.publicSignals.map((item) => String(item))
          : ['1'],
      merkleProof: parsed.merkleProof ?? null,
      claimType: typeof parsed.claimType === 'string' ? parsed.claimType : null,
    };
  }

  const parts = payload.split('|');
  if (parts.length < 2 || parts[1] !== LEGACY_PROOF_MARKER) {
    throw new AppError(400, 'proof payload format is invalid');
  }

  let proof: Record<string, unknown>;
  try {
    proof = JSON.parse(parts[0]);
  } catch {
    throw new AppError(400, 'legacy proof payload contains invalid proof JSON');
  }

  let merkleProof: unknown = null;
  if (parts[2]) {
    try {
      merkleProof = JSON.parse(parts[2]);
    } catch {
      throw new AppError(400, 'legacy proof payload contains invalid merkle proof JSON');
    }
  }

  return {
    kind: 'legacy-proof-v0',
    proof,
    publicSignals: ['1'],
    merkleProof,
    claimType: null,
  };
}

export function serializeRootPayload(root: string): string {
  return JSON.stringify({
    kind: ROOT_KIND,
    root,
  });
}

export function parseRootPayload(rawPayload: unknown): { kind: string; root: string } {
  const payload = ensureNonEmptyString(rawPayload, 'root');

  if (payload.startsWith('{')) {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(payload);
    } catch {
      throw new AppError(400, 'root payload is not valid JSON');
    }

    if (typeof parsed.root !== 'string' || !parsed.root) {
      throw new AppError(400, 'root payload is missing root');
    }

    return {
      kind: typeof parsed.kind === 'string' ? parsed.kind : ROOT_KIND,
      root: parsed.root,
    };
  }

  const parts = payload.split('|');
  if (parts.length < 2 || parts[1] !== LEGACY_ROOT_MARKER) {
    throw new AppError(400, 'root payload format is invalid');
  }

  return {
    kind: 'legacy-root-v0',
    root: parts[0],
  };
}
