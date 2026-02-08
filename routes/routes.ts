import express from 'express';

import {
  createMerkleTree,
  createProof,
  verifyMerkleTree,
  verifyProof,
} from '../controllers/qrcZk';
import { asyncHandler } from '../server/http';

const router = express.Router();

router.get('/api/v1/health', (_req, res) => {
  res.status(200).json({ message: 'ok' });
});

router.post('/api/v1/proofs', asyncHandler(createProof));
router.post('/api/v1/proofs/verify', asyncHandler(verifyProof));
router.post('/api/v1/identity-qr', asyncHandler(createMerkleTree));
router.post('/api/v1/identity-qr/verify', asyncHandler(verifyMerkleTree));

// Legacy routes for backward compatibility with existing clients.
router.post('/cp', asyncHandler(createProof));
router.post('/vp', asyncHandler(verifyProof));
router.post('/cmt', asyncHandler(createMerkleTree));
router.post('/vmt', asyncHandler(verifyMerkleTree));

export default router;
