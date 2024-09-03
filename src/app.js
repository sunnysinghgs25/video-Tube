import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

/*listing middle ware*/
app.use(cors({
    origin:process.env.CORS_URL
    
}))
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())
/* end of middle ware */

/* middle ware is used here*/
import userRouter from "./routes/user.router.js"

app.use("/user",userRouter) // https://localhost/3000/user


export default app