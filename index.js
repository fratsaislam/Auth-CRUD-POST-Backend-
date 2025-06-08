const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const mongoose = require('mongoose');
require('dotenv').config();

const authRouter = require('./routers/authRouter');
const postsRouter = require("./routers/postsRouter");

const app = express();



app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended:true}));




app.get('/', (req, res) => {
    res.json({message : "Hello from the server"});
})

app.use('/api/auth', authRouter);
app.use('/api/posts', postsRouter);

const startServer = async () =>{
    try{
        await mongoose.connect(process.env.MONGO_URL);
        console.log("connected successfully to DB");
        app.listen(process.env.PORT, () => {
            console.log("Server Started At PORT : " +process.env.PORT);
        });
    }catch(err){
        console.log(err)
    }
}

startServer();



/* 
mongoose.connect(process.env.MONGO_URL).then(() => {
        console.log('connected to Data Base')
        app.listen(process.env.PORT, ()=>{
            console.log("Server Started at Port : " + process.env.PORT);
        })
    }
).catch((err) => console.log(`error : ${err}`))
 */