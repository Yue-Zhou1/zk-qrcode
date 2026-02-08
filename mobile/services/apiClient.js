import { Platform } from 'react-native';

const DEFAULT_BASE_URL = Platform.select({
  ios: 'http://127.0.0.1:3000',
  android: 'http://10.0.2.2:3000',
  default: 'http://localhost:3000',
});

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_BASE_URL;

function buildHeaders(headers) {
  return {
    'Content-Type': 'application/json',
    ...(headers || {}),
  };
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(options.headers),
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    const error = new Error(payload?.message || `Request failed: ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

async function postWithFallback(primaryPath, fallbackPath, body) {
  try {
    return await request(primaryPath, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  } catch (error) {
    if (error.status !== 404 || !fallbackPath) {
      throw error;
    }

    return request(fallbackPath, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
}

export function createProof({ id, type }) {
  return postWithFallback('/api/v1/proofs', '/cp', { id, type });
}

export function verifyProof({ id, proof }) {
  return postWithFallback('/api/v1/proofs/verify', '/vp', { id, proof });
}

export function createIdentityQr({ id }) {
  return postWithFallback('/api/v1/identity-qr', '/cmt', { id });
}

export function verifyIdentityQr({ id, root }) {
  return postWithFallback('/api/v1/identity-qr/verify', '/vmt', { id, root });
}

export function detectQrPayloadType(rawData) {
  if (typeof rawData !== 'string' || !rawData.trim()) {
    return { type: 'unknown' };
  }

  const data = rawData.trim();

  if (data.startsWith('{')) {
    try {
      const parsed = JSON.parse(data);
      if (parsed.kind === 'proof-v1') {
        return { type: 'proof', payload: data };
      }
      if (parsed.kind === 'identity-root-v1') {
        return { type: 'identity-root', payload: data };
      }
    } catch {
      return { type: 'unknown' };
    }

    return { type: 'unknown' };
  }

  const legacyParts = data.split('|');
  if (legacyParts.length >= 2 && legacyParts[1] === '1') {
    return { type: 'proof', payload: data };
  }
  if (legacyParts.length >= 2 && legacyParts[1] === '2') {
    return { type: 'identity-root', payload: data };
  }

  return { type: 'unknown' };
}
