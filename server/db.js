const { MongoClient, ServerApiVersion } = require('mongodb');
const { MerkleTree } = require('merkletreejs');
const SHA256 = require('crypto-js/sha256');

const uri = "mongodb+srv://yue:a455761544@cluster0.21asf.mongodb.net/?retryWrites=true&w=majority";
const dbName = "user";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function connectToDatabase(){
    await client.connect();
    console.log('Connected successfully to database server');

    // initial database if first time to access.

    // initialOriginDatabase();

    // initialMerkleTreeDatabase();
    return client;
}

async function initialOriginDatabase(){
    try{
        const db = client.db(dbName);
        const userDocuments = db.collection('documents');
        const estimate = await userDocuments.estimatedDocumentCount();
        if (estimate !== 0){
            return;
        }
        // create some random users
        const userInfo = [
            {name: "Mary", id: "123", dob: "01/01/1985", country: "China", bioinfo: "1223456789", gender: "female", drilicence: "2", profession:"1"},
            {name: "Mike", id: "456", dob: "02/02/1990", country: "Australia", bioinfo: "987654321", gender: "male", drilicence: "1", profession:"2"},
            {name: "Lucy", id: "789", dob: "03/03/2010", country: "Japan", bioinfo: "1122334455", gender: "female", drilicence: "0",profession:"6"}
        ]
        const options = {ordered: true};
        const result = await userDocuments.insertMany(userInfo, options);
    
        console.log(`${result.insertedCount} documents were inserted`);
    }finally{
        await client.close();
    }
}

async function initialMerkleTreeDatabase(){
    try{
        const db = client.db(dbName);
        const userDocuments = db.collection('merkletree');

        const merkleTreeInfo = createMerkleTree();

        const options = {ordered: true};
        const result = await userDocuments.insertMany(merkleTreeInfo, options);
    
        console.log(`${result.insertedCount} documents were inserted`);
    }finally{
        await client.close();
    }
}

function createMerkleTree(){
    const merkleTreeInfo = [];
    const userInfo = [
        ["Mary", "123", "01/01/1985", "China", "1223456789", "female", "2", "1"],
        ["Mike", "456", "02/02/1990", "Australia", "987654321", "male", "1", "2"],
        ["Lucy", "789", "03/03/2010", "Japan", "1122334455", "female", "0", "6"],
    ]

    for (var i = 0; i < userInfo.length; i++){
        const leaves = userInfo[i].map(x => SHA256(x));
        const tree = new MerkleTree(leaves, SHA256);
        const root = tree.getRoot().toString('hex');

        var pair = {};
        var proofs = [];
        for (let i = 0; i < leaves.length; i++){
            let leaf = leaves[i];
            let proof = MerkleTree.marshalProof(tree.getProof(leaf));
            proofs.push(proof);
        };

        pair["id"] = userInfo[i][1];
        pair["root"] = root;
        pair["proof"] = proofs;

        merkleTreeInfo.push(pair);
    }

    return merkleTreeInfo
}

async function findAge(userId){
    await client.connect();
    try{
      const database = client.db(dbName);
      const userInfo = database.collection("documents");
      const merkleTreeInfo = database.collection("merkletree");

      const query = { id: userId};
      const _user = await userInfo.findOne(query);
      const _userMerkletree = await merkleTreeInfo.findOne(query);

      const ageMerkletree = _userMerkletree.proof[2];

      const _dob = _user.dob;
      const dob = new Date(_dob.substring(6,10),
      _dob.substring(3,5)-1,                   
      _dob.substring(0,2)                  
      );
      const ageDiff = Date.now() - dob;
      const ageDate = new Date(ageDiff);
      const _userAge = Math.abs(ageDate.getUTCFullYear() - 1970);

      return [_userAge, ageMerkletree];

    }catch(e){
      console.log(e);
      return(null);
    }
}

async function findDrive(userId){
    await client.connect();

    try{
      const database = client.db(dbName);
      const userInfo = database.collection("documents");
      const merkleTreeInfo = database.collection("merkletree");

      const query = { id: userId};
      const _user = await userInfo.findOne(query);
      const _userMerkletree = await merkleTreeInfo.findOne(query);

      const driveMerkletree = _userMerkletree.proof[6];

      const _drive = _user.drilicence;
      return [_drive, driveMerkletree];

    }catch(e){
      console.log(e);
      return(null);
    }
}

async function findProfession(userId){
    await client.connect();

    try{
      const database = client.db(dbName);
      const userInfo = database.collection("documents");
      const merkleTreeInfo = database.collection("merkletree");
      const query = { id: userId};
      const _user = await userInfo.findOne(query);
      const _userMerkletree = await merkleTreeInfo.findOne(query);

      const professionMerkletree = _userMerkletree.proof[7];

      const _profession = _user.profession;
      return [_profession, professionMerkletree];

    }catch(e){
      console.log(e);
      return(null);
    }
}



// export {connectToDatabase};
module.exports = {connectToDatabase, findAge, findDrive, findProfession}; 