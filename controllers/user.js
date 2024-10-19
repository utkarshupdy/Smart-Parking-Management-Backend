import jwt from "jsonwebtoken"
import mongoose from "mongoose";
import { User } from "../models/userSchema.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefeshToken()
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresha nd access tokens")

    }

}
// register
const registerUser = asyncHandler(async (req, res) => {
    const { username, name, email, password, type } = req.body
    if (
        [username, name, email, password, type].some((feild) => feild?.trim() === "")
    ) {
        throw new ApiError(400, "all feild are compulsory")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "user with email nd username already exist")
    }

    const user = await User.create({
        // username: username.toLowerCase(),
        username,
        name,
        email,
        password,
        type
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }
    return res.status(201).json( 
        new ApiResponse(200, createdUser, "User Registered Successfully")
    )

})

//get all users from db
const userList = asyncHandler(async (req, res)=>{

    const users = await User.find({});
    if(!users){
        throw new ApiError(500 , "Currently no user is in database")
    }

    return res.status(200).json(
        new ApiResponse(200 , users , "All user data fetched successfully")
    )

})

// login
const login = asyncHandler(async(req , res)=>{

    const { email, username, password } = req.body

    if (!(username || email)) {
        throw new ApiError(400, "username or email is required")
    }
    const user = await User.findOne({           
        $or: [{ username }, { email }]            
    })

    if (!user) {
        throw new ApiError(404, "User doesn't exist")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(404, "Invalid User Crediantials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {    
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken 
            },
            "user loggedIn successfully"
        )
    )
})

//log out
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {       
                refreshToken: 1 
            }       

        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"))
})

//refresh access token
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incommingRefreshToken) {
        throw new ApiError(401, "Unauthorized Request")
    }
    try {
      
        const decodedToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token")
        }

        if (incommingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401 , error?.message || "Invalid Refresh Token")
    }

})

//reset password
const changeCurrentPassword = asyncHandler(async(req , res)=>{
    const {oldPassword , newPassword , confPassword} = req.feild

    if(newPassword != confPassword){
       throw new ApiError(400 , "New Password and Confirm Password must be same")
    }
 

   const user =  await User.findById(req.user?._id)
   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

   if(!isPasswordCorrect){
       throw new ApiError(400 , "Invalid Old Password")
   }

   user.password = newPassword
   await user.save({validateBeforeSave : false}) 

   return res
   .status(200)
   .json(new ApiResponse(200 , {} , "Password Changed Successfully"))
})

// get current user or get profile details
const getCurrentUser = asyncHandler(async(req , res)=>{
    return res
    .status(200)
    .json(
        new ApiResponse(200 , req.user , "Current user fetched successfully")
    ) 
})

// update account details
const updateAccountDetails = asyncHandler(async(req , res)=>{

    const {name , email , type} = req.body
    if(!name || !email || !type){
        throw new ApiError(400 , "All Feilds are required")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                name : name,
                email : email,
                type : type
            }
        },
        {new:true} 
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200 , user , "Account details updated successfully"))
})






export{
    registerUser,
    userList ,
    login,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    
}

