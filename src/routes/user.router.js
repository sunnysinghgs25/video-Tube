import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser, changePassword, getUser } from "../controllers/user.controllers.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"cover",
            maxCount:1
        }
    ]),
    registerUser)

router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refreshToken").post(refreshAccessToken);
router.route("/changepassword").post(verifyJWT,changePassword)
router.route("/getuser").get(verifyJWT,getUser);

// https://localhost/3000/user/register 
export default router