const {createProof, verifyProof, verifyMerkleTree, createMerkleTree} = require('../controllers/qrcZk.js');
const express = require('express');

const router = express.Router();

router.post('/cp', createProof);

router.post('/vp', verifyProof);

router.post('/cmt', createMerkleTree);

router.post('/vmt', verifyMerkleTree);

router.get('/1', (req, res, next)=>{
    res.status(200).json({message: "11111"});
})

// export default router;
module.exports = router;