import {User} from '../models/user.models.js'
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { sendMail, emailVerificationContent, forgotPasswordContent} from '../utils/mail.js';
import jwt from 'jsonwebtoken'
import crypto from "crypto";

const generateAllTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accesstoken = user.generateAccessToken();
    const refreshtoken = user.generateRefreshToken();

    user.refreshToken = refreshtoken;
    await user.save({ validateBeforeSave: false });

    return { accesstoken, refreshtoken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
    const {email, username, password, role} = req.body

    const didUserExist = await User.findOne({
        $or: [{username}, {email}]
    })

    if(didUserExist){
        throw new ApiError(409, 'User with the same Username or Email already exist',[])
    }

    const user = await User.create({
        email,
        password,
        username,
        isEmailVerified: false,

    })



    const { unhashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;

    await user.save({validateBeforeSave: false});

    console.log("b4 sending mail");
    

    await sendMail({
        email: user?.email,
        subject: 'Email Verification',
        mailgenContent: emailVerificationContent(user.username, `${req.protocol}://${req.get('host')}/api/v1/users/verify-email/${unhashedToken}`)
    })

    console.log("aftr sending mail");


    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken -emailVerificationToken -emailVerificationExpiry -forgotPasswordToken -forgotPasswordExpiry",
    );

    if(!createdUser){
        throw new ApiError(500, 'User registration failed', [])
    }

    return res.status(201).json(new ApiResponse(200,{user: createdUser}, "User registered successfully and verification email has been sent"));

})

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  if(!email){
    throw new ApiError(400, 'Email is required', [])
  }

  const user = await User.findOne({email: email})
  if(!user)
  {
    throw new ApiError(404, 'User not found', [])
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password)

  if(!isPasswordCorrect)
  {
    throw new ApiError(401, 'Password is incorrect', [])
  }
  else{
    const { accesstoken, refreshtoken } = await generateAllTokens(user._id)

    const loggedinUser = await User.findById(user._id).select(
      "-password -refreshToken -emailVerificationToken -emailVerificationExpiry -forgotPasswordToken -forgotPasswordExpiry",
    );

    const options = {
      httpOnly: true,
      secure: true,
    }

    return res.status(200).cookie('refreshToken', refreshtoken, options).cookie('accessToken', accesstoken, options).json(new ApiResponse(200,{user: loggedinUser, accessToken: accesstoken}, "User logged in successfully"));  
  }

});

const logoutUser = asyncHandler(async (req,res) => {
  const user = await User.findByIdAndUpdate(req.user._id, 
  {
    $set : {
      refreshToken : ''
    },
  },
  {
    new : true
  },
  )

  const options = {
    httpOnly: true,
    secure: true,
  }
  return res.status(200).clearCookie('refreshToken', options).clearCookie('accessToken', options).json(new ApiResponse(200,{message: "User logged out successfully"}, "User logged out successfully"));
})

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200,{user: req.user}, "Current User fetched successfully"));
})

const verifyEmail = asyncHandler(async (req, res) => {
  const {verificationToken} = req.params

  if(!verificationToken){
    throw new ApiError(400, 'Email verification token is missing', [])
  }

  console.log("RAW PARAM TOKEN:", req.params.verificationToken);
  console.log("RAW PARAM TOKEN LENGTH:", req.params.verificationToken?.length);


  let hashedToken = crypto.createHash("sha256").update(verificationToken).digest('hex');

  console.log("HASHED TOKEN FROM URL:", hashedToken);

  const debugUser = await User.findOne({});
  console.log("TOKEN IN DB:", debugUser?.emailVerificationToken);
  console.log("EXPIRY IN DB:", debugUser?.emailVerificationExpiry);
  console.log("NOW:", Date.now());


  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: {$gt: Date.now()}
  })

  if(!user){
    throw new ApiError(404, 'Tokenis invalid or expired', [])
  }

  user.isEmailVerified = true
  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined
  await user.save({validateBeforeSave: false})


  return res.status(200).json(new ApiResponse(200,{message: "Email verified successfully"}, "Email verified successfully"));
});

const resendVerificationEmail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id)

  if(!user){
    throw new ApiError(404, 'User not found')
  }

  if(user.isEmailVerified){
    throw new ApiError(409, 'Email is already verified')
  }

  const { unhashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationTokenExpiry = tokenExpiry;

  await user.save({ validateBeforeSave: false });

  await sendMail({
    email: user?.email,
    subject: "Email Verification",
    mailgenContent: emailVerificationContent(
      user.username,
      `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unhashedToken}`,
    ),
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        "verification email has been sent",
      ),
    );




});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incRefreshToken = req.cookies?.refreshToken || req.body.refreshToken

  if(!incRefreshToken){
    throw new ApiError(401, 'Unauthorized')
  }

  try {
    const decodedToken = jwt.verify(incRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    const user = await User.findById(decodedToken?._id)

    if(!user){
      throw new ApiError(401, 'Invalid refresh Token')
    }

    if(incRefreshToken !== user.refreshToken){
      throw new ApiError(401, "Invalid refresh Token");
    }

    const options = {
      httpOnly: true,
      secure: true,
    }

    const {accesstoken, refreshtoken} = await generateAllTokens(user._id)

    user.refreshToken = refreshtoken
    await user.save()

    return res.status(200).cookie("accessToken", accesstoken, options).cookie("refreshToken", refreshtoken, options).json(new ApiResponse(200,{refreshToken: refreshtoken, accessToken: accesstoken}, "User logged in successfully"));
  } catch (error) {
    throw new ApiError(401, "Invalid refresh Token");
  }

});

const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const {email} = req.body
  const user = await User.findOne({email})

  if(!user){
    throw new ApiError(404, 'User not found')
  }

  const{unhashedToken, hashedToken, tokenExpiry} = user.generateTemporaryToken()

  user.forgotPasswordToken = hashedToken
  user.forgotPasswordExpiry = tokenExpiry

  await user.save({validateBeforeSave: false})

  await sendMail({
    email: user?.email,
    subject: "Password Reset",
    mailgenContent: forgotPasswordContent(
      user.username,
      `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unhashedToken}`,
    ),
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        "Password reset email has been sent",
      ),
    );
});

const resetForgotPassword = asyncHandler(async (req, res) => {
  const {resetToken} = req.params
  const {newPassword} = req.body

  const hashedToken = crypto.createHash("sha256").update(resetToken).digest('hex');

  const user = await User.findOne({
    forgotPasswordToken: hashedToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  if(!user){
    throw new ApiError(410, 'Tokenis invalid or expired', [])
  }

  user.password = newPassword;
  user.forgotPasswordToken = undefined
  user.forgotPasswordExpiry = undefined

  await user.save({validateBeforeSave: false})

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Password reset successfully",
      ),
    );


});

const changePassword = asyncHandler(async (req, res) => {
  const{oldPassword, newPassword} = req.body

  const user = await User.findById(req.user._id)

  if(!user){
    throw new ApiError(404, 'User not found')
  }

  if(!await user.isPasswordCorrect(oldPassword)){
    throw new ApiError(401, 'Old password is incorrect')
  }

  user.password = newPassword
  await user.save({validateBeforeSave: false})

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Password changed successfully",
      ),
    );
});
//const getCurrentUser = asyncHandler(async (req, res) => {});


export {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  verifyEmail,
  resendVerificationEmail,
  refreshAccessToken,
  forgotPasswordRequest,
  resetForgotPassword,
  changePassword,
};

