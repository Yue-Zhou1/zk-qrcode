import path from 'path';

import dotenv from 'dotenv';

dotenv.config();

function toNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeList(value: string | undefined): string[] {
  if (!value) return ['*'];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export interface AppConfig {
  nodeEnv: string;
  port: number;
  corsOrigins: string[];
  mongoUri: string;
  dbName: string;
  zk: {
    circuitWasmPath: string;
    circuitZkeyPath: string;
    verificationKeyPath: string;
    successPublicSignal: string;
  };
}

const config: AppConfig = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toNumber(process.env.PORT, 3000),
  corsOrigins: normalizeList(process.env.CORS_ORIGIN),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017',
  dbName: process.env.DB_NAME || 'user',
  zk: {
    circuitWasmPath:
      process.env.CIRCUIT_WASM_PATH || path.join(process.cwd(), 'controllers/circuit.wasm'),
    circuitZkeyPath:
      process.env.CIRCUIT_ZKEY_PATH ||
      path.join(process.cwd(), 'controllers/circuit_final.zkey'),
    verificationKeyPath:
      process.env.VERIFICATION_KEY_PATH ||
      path.join(process.cwd(), 'controllers/verification_key.json'),
    successPublicSignal: process.env.ZK_SUCCESS_PUBLIC_SIGNAL || '1',
  },
});

export default config;
