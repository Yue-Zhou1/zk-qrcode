const QRCode = require('qrcode');
const snarkjs = require('snarkjs');
const fs = require("fs");
const db = require('../server/db.js');

const { MerkleTree } = require('merkletreejs');
const SHA256 = require('crypto-js/sha256');

const dbName = "user";

const createProof = async (req, res, next) => {
  const _userId = req.body.id;
  var LIMIT = null;
  var userInput = null;
  var merkletreeProof = null;

  switch(req.body.type){
    case 'age':
      const _resAge = await db.findAge(_userId);
      const _age = _resAge[0];
      merkletreeProof = _resAge[1];
      if (_age === null){
          res.status(201).json({message: "No age provided!"});
      };
      LIMIT = 18;
      userInput = parseInt(_age);
      break;
    case 'drive':
      const _resDrive = await db.findDrive(_userId);
      const _drive = _resDrive[0];
      merkletreeProof = _resDrive[1];

      if (_drive === null){
          res.status(201).json({message: "No Driver license provided!"});
      };
      // 0: no licence, 1: licence & expired, 2: licence &  valid
      LIMIT = 2;
      userInput = parseInt(_drive);
      break;
    case 'profession':
      const _resProfession = await db.findProfession(_userId);
      const _profession = _resProfession[0];
      merkletreeProof = _resProfession[1];
      if (_profession === null){
          res.status(201).json({message: "No Profession provided!"});
      };
      // 0-5: any professions, 6: student
      LIMIT = 6;
      userInput = parseInt(_profession);
      break;
  }

  console.log("proof creation starts: ");
  console.time(); 
  var { proof, publicSignals } =
    await snarkjs.plonk.fullProve( {in1:userInput, in2:LIMIT}, "./controllers/circuit.wasm", "./controllers/circuit_final.zkey");

  publicSignals = ['1'];

  // console.log(merkletreeProof);

  const content = JSON.stringify(proof) + '|' + '1' + '|' + JSON.stringify(merkletreeProof);
  const content1 = JSON.stringify(proof) + '|' + '1';
  console.log(proof);
  console.log(publicSignals);
  
  QRCode.toDataURL(content, {errorCorrectionLevel: 'L'}).then(async url =>{
    if(url !== ''){
        res.status(200).json({message: "Proof Created Success!", qrcUrl: url, proof: content});
    }else{
        res.status(201).json({message: "Proof Created Failed!"})
    }
  });
  console.timeEnd();
  console.log("proof creation ends: ");
}

const verifyProof = async (req, res, next) => {
    const vkey = JSON.parse(fs.readFileSync("./controllers/verification_key.json"));
    const publicSignals = ['1'];
    const proof = JSON.parse(req.body.proof.split('|')[0]);
    console.log("proof verification starts: ");
    console.time(); 
    const resp = await snarkjs.plonk.verify(vkey, publicSignals, proof);

    console.timeEnd();
    console.log("proof verification ends: ");

    const client = await db.connectToDatabase();
    const database = client.db(dbName);
    const merkletreeInfo = database.collection("merkletree");
    const userInfo = database.collection("documents");

    const query = { id: req.body.id};
    const _userMerkletree = await merkletreeInfo.findOne(query);
    const _user = await userInfo.findOne(query);

    const _root = _userMerkletree.root;
    const _proof = JSON.parse(req.body.proof.split('|')[2]);
    
    const _proofIndex = _userMerkletree.proof.indexOf(_proof)+1;

    const _leaf = SHA256(_user[Object.keys(_user)[_proofIndex]]);

    const result = MerkleTree.verify(MerkleTree.unmarshalProof(_proof), _leaf, _root);

    console.log(resp);
    console.log(result);
    if (resp === true && result === true){
        res.status(200).json({message: "Verify Success!"});
    }else{
        res.status(201).json({message: "Verify Failed!"});
    }
}

const verifyMerkleTree = async (req, res, next) => {
    try{
      console.log("start verifying merkle tree")
      const client = await db.connectToDatabase();

      const database = client.db(dbName);
      const userInfo = database.collection("merkletree");

      const _root = req.body.root.split("|")[0];

      const query = { id: req.body.id, root: _root};

      const _user = await userInfo.findOne(query);
      
      const proofs = MerkleTree.unmarshalProof(_user.proof[1]);
      const _leaf = SHA256(req.body.id);

      const result = MerkleTree.verify(proofs, _leaf, _root);
      console.log(result);

      if (result === true){
        res.status(200).json({message: "User identity verified!"});
      }else{
        res.status(201).json({message: "User identity unknown!"})
      }
      
    }catch(e){
      console.log(e)
    }
}

const createMerkleTree = async (req, res, next) => {
    if (req.body.id === ''){
        res.status(200).json({message: "User not found!"});
    }
    const client = await db.connectToDatabase();

    try{
      const database = client.db(dbName);
      const userInfo = database.collection("merkletree");

      const query = { id: req.body.id};

      const _user = await userInfo.findOne(query);

      const _root = _user.root + '|' + '2';

      
      QRCode.toDataURL(_root, {errorCorrectionLevel: 'L'}).then(async url =>{
        if(url !== ''){
            res.status(200).json({message: "QR Code Created Success!", qrcUrl: url});

        }else{
            res.status(201).json({message: "QR Code Created Failed!"})
        }
      });

    }catch(e){
      console.log(e)
    }

}

// export {createProof, verifyProof, createMerkleTree};
module.exports = {createProof, verifyProof, verifyMerkleTree, createMerkleTree}; 