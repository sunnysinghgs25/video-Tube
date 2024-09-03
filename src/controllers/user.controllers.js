import {
    asyncHandler
} from "../utils/AsyncHandlers.js"
import {
    ApiError
} from "../utils/apierrorres.js"
import {
    User
} from "../models/user.model.js"
import {
    uploadOnCloudinary
} from "../utils/cloudinary.js"
import {
    ApiResponse
} from "../utils/apires.js"

import jwt from "jsonwebtoken";
const generateAccessTokenAndRefreshToken = async(userId)=>{
    try{
    const  user = await User.findById(userId)
    console.log("1 29");
    const accessToken = user.accessTokenGenerator();
    console.log("2");
    const refreshToken = user.refreshTokenGenerator();
    console.log("3");
    user.refreshToken = refreshToken;
    await user.save({validateBeforeSave:false})
    console.log("4");
    return {
        accessToken,
        refreshToken,
    };
    } catch (error){
        throw new ApiError(500,"fault from server side, something went wrong")
    }

}

const registerUser = asyncHandler(async (req, res) => {
    let {
        username,
        email,
        fullname,
        password
    } = req.body;
    console.log("email", email)
    if ([username, email, fullname, password].some((field) => field.trim() === "")) {
        throw new ApiError(400, "all fields are required");
    }
    const existedUser = await User.findOne({
        $or: [{
            username
        }, {
            email
        }]
    })
    if (existedUser) {
        throw new ApiError(409, "existed user and email");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    console.log(avatarLocalPath)
    //const coverLocalPath = req.files?.cover[0]?.path;
    let coverLocalPath;

    if (req.files && Array.isArray(req.files.cover) && req.files.cover.length > 0) {
        coverLocalPath = req.files.cover[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar is needed")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const cover = await uploadOnCloudinary(coverLocalPath);
    console.log(avatar)
    if (!avatar) {
        throw new ApiError(400, "all fields are required")
    }
    const user = await User.create({
        username: username.toLowerCase(),
        email: email,
        fullname: fullname,
        password: password,
        avatar: avatar.url,
        cover: cover?.url || "",

    })
    const userCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!userCreated) {
        throw new ApiError(500, "somethig went wrong")
    }

    return res.status(201).json(
        new ApiResponse(200, userCreated, "user has been created")
    )
})
const loginUser =  asyncHandler(async(req,res)=>{
// to steps
/*
1) ask crentials,
2) verify them
3) generate the jwt token

 */
    let { username, email , password } = req.body;
    if(!username && !email ){
        throw new ApiError(400,"Enter the username and email")
    }
    
    const user = await User.findOne({$or:[{email},{username}]});
  
    if(!user){
        throw new ApiError(404, "User doesnt exist ")
    }
    
    const isPasswordCorrect = await user.isPasswordCorrect(password) 
    if(!isPasswordCorrect){
        throw new ApiError(404, "Please enter the valid Password")
    }
    

    const {accessToken,refreshToken} = await generateAccessTokenAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    const option = {
        httpOnly :true,
        secure:true
    }
    res
    .status(200)
    .cookie("accessToken",accessToken,option)
    .cookie("refreshToken",refreshToken,option)
    .json(
        new ApiResponse(200,
            {
                user:loggedInUser,
                refreshToken,
                accessToken,
            },
            "user loggedIn successfully"
        )
    )

})
const logoutUser = asyncHandler(async(req,res)=>{
 await User.findByIdAndUpdate(req.user._id ,{
    $unset:{
        refreshToken:1,
    }
 },{new:true})

  const options = {
    httpOnly :true,
    secure:true
  }
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    console.log(incomingRefreshToken)
    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessTokenAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})
const changePassword= asyncHandler(async(req,res)=>{
    let {oldpassword , newPassword} = req.body;
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = user.isPasswordCorrect(oldpassword);

    if(!isPasswordCorrect){
        throw new ApiError(401,"Invalid Password")
    }

    user.password = newPassword;
    user.save({validateBeforeSave:false});

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))


})

const getUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})
const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true}
        
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
});
const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    //TODO: delete old image - assignment

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})
const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    //TODO: delete old image - assignment


    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getUser,
    updateUserAvatar,
    updateUserCoverImage
};