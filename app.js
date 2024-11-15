const express = require('express')
const router = require('./routes/routes.js')
const database = require('./server/db.js')

const app = express();
const port = 3000;

app.use(express.urlencoded({extended: true}));
app.use(express.json());

async function main(){
    // 1. start server
    startServer();

    // 2. connect to the database
    // database.connectToDatabase();
}

function startServer(){
    app.use((_, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        next();
    });
    
    app.use(router);
    
    app.listen(port, ()=>{
        console.log(`app listening on port ${port}`);
    });
}

main() 
  .then(console.log)
  .catch(console.error)




