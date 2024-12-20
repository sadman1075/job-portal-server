const express = require("express")
const cors = require("cors")
const jwt=require("jsonwebtoken")
const cookieParser=require("cookie-parser")
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;


//job-portal
//CfqB8DfRCorUBfdW

// middleware

app.use(cors({
    origin:[
        "http://localhost:5173",
        "https://job-portal-72362.web.app",
        "https://job-portal-72362.firebaseapp.com"

    ],
    credentials:true,
}))
app.use(express.json())
app.use(cookieParser())

const verifyToken=(req,res,next)=>{
    const token=req.cookies?.token;
    if(!token){
        return res.status(401).send({message:"UnAuthorize access"})
    }

    jwt.verify(token,process.env.ACCESS_TOKEN,(err,decoded)=>{
        if(err){
            return res.status(401).send({message:"Unauthorized access"})
        }
        req.user=decoded;
        next()
    })

}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.62b40ek.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        // await client.connect();
        const database = client.db("job_portal")
        const jobcollection = database.collection("jobs")
        const jobapplycollection = database.collection("job_application")

        // create token
        app.post('/jwt',async(req,res)=>{
            const user=req.body;
            const token=await jwt.sign(user,process.env.ACCESS_TOKEN,{expiresIn:"1h"})
           // set token in to the cookie
            res.cookie("token",token,{
                httpOnly:true,
                secure:process.env.NODE_ENV ==='production'

            })
            .send({success:true})
        });

        app.post("/logout",(req,res)=>{
            res.clearCookie("token",{
                httpOnly:true,
                secure:process.env.NODE_ENV ==='production'
            })
            .send({success:true})
        })


        app.get("/", (req, res) => {
            res.send("portal server is on...")
        });

        app.get("/jobs", async (req, res) => {
            const cursor = jobcollection.find().limit(6)
            const result = await cursor.toArray()
            res.send(result)
        });


        app.post("/jobs", async (req, res) => {
            const addjobs = req.body;
            const result = await jobcollection.insertOne(addjobs)
            res.send(result)
        });

        app.get("/jobs/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await jobcollection.findOne(query)
            res.send(result)

        });



        app.get("/all-jobs", async (req, res) => {
            const email = req.query.email;
            let query = {}
            if (email) {
                query = { hr_email: email }
            }
            const result = await jobcollection.find(query).toArray()
            res.send(result)
        })

        app.post('/job-application', async (req, res) => {
            const application = req.body;
            const result = await jobapplycollection.insertOne(application)
            res.send(result)
        });

        app.get("/job-application", async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const result = await jobapplycollection.find(query).toArray()
            res.send(result)
        });

        app.get("/job-application/jobs/:job_id", async (req, res) => {
            const jobId = req.params.job_id;
            const query = { job_id: jobId }
            const result = await jobapplycollection.find(query).toArray()
            res.send(result)
        });

        app.patch('/job-application/:id', async (req, res) => {
            const id = req.params.id;
            const data = req.body;
            const query = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    status: data.status
                }
            }
            const result = await jobapplycollection.updateOne(query, updatedDoc)
            res.send(result)
        })



        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);





app.listen(port)

