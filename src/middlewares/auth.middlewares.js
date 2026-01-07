import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import jwt from 'jsonwebtoken'

export const verifyJWT = asyncHandler(async  (req, res, next) => {
    const Token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", '')

    if(!Token){
        throw new ApiError(401, 'Unauthorized')
    }

    try {
        const decodedToken = jwt.verify(Token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select(
          "-password -refreshToken -emailVerificationToken -emailVerificationExpiry -forgotPasswordToken -forgotPasswordExpiry",
        );

        if(!user){
            throw new ApiError(401, 'Invalid access Token')
        }

        req.user = user
        next()

    } catch (error) {
        throw new ApiError(401, "Invalid access Token");
    }
}); 