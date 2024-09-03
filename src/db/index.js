import mongoose from "mongoose";
import {DB_NAME} from "../constants.js"



const connectionDB = async()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\nmongodb connected \n${connectionInstance.connection.host}`)
     } catch (error) {
         console.error("error",error)
         throw error
     }
}

export default connectionDB