const express = require('express')
const app = express()
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors())
app.use(express.json())

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization
    if (!token) {
        return res.status(401).send({ error: true })
    }
    jwt.verify(token, process.env.CAR_SECRET, (error, decoded) => {
        if (error) {
            return res.status(403).send({ error: true })
        }
        else if (decoded.email != req.query.email) {
            return res.status(403).send({ error: true })
        }
        req.decoded = decoded
        next()
    })

}

const uri = `mongodb+srv://${process.env.CAR_DB_USER}:${process.env.CAR_DB_PASS}@cluster0.bitxn0d.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const database = client.db("serviceDB").collection("service");
        const bookmark = client.db("bookmarkDB").collection("bookmark");

        app.get('/service', async (req, res) => {
            const cursor = database.find();
            const dataToarray = await cursor.toArray()
            res.send(dataToarray)
        })
        app.post('/jwt', (req, res) => {
            const body = req.body
            const token = jwt.sign(body, process.env.CAR_SECRET, { expiresIn: '1h' })
            res.send({ token })
        })
        app.post('/bookmark', async (req, res) => {
            const body = req.body
            const result = await bookmark.insertOne(body);
            res.send(result)
        })
        app.get('/bookmark', verifyToken, async (req, res) => {
            const email = req.query.email
            const cursor = bookmark.find({ serviceEmail: { $eq: email } });
            const dataToarray = await cursor.toArray()
            res.send(dataToarray)

        })
        app.delete('/bookmark/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const result = await bookmark.deleteOne(filter)
            res.send(result)

        })
        app.get('/service/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) };
            const data = await database.findOne(query);
            res.send(data)
        })
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('server is running')
})

app.listen(port)

// service
// 9XJjDsUswLuyOkhl