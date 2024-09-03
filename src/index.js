// require('dotenv').config({path:"./env"})
import dotenv from "dotenv";
dotenv.config({path:"./env"})
import mongoose from "mongoose";
import connectionDB from "./db/index.js";
import app from "./app.js"


const port = process.env.PORT||8000;
connectionDB()
.then((res)=>{
   app.listen(port,()=>{
    console.log(`port ${port} is running`)
   })

})
.catch((err)=>{
    console.log(`error occur`,err)
});










/*
;(async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("not able to talk db",error)
            throw error
        })
        app.listen(process.env.PORT,()=>{
            console.log(`connected to the port ${process.env.PORT}`);
        })
    } catch (error) {
        console.error("error",error)
        throw error
    }
})()*/