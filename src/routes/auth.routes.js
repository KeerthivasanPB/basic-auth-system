import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  verifyEmail,
  refreshAccessToken,
  forgotPasswordRequest,
  resetForgotPassword,
  getCurrentUser,
  changePassword,
  resendVerificationEmail,
} from "../controllers/auth.controllers.js";
import {
  userRegisterValidator,
  userLoginValidator,
  userForgotPasswordValidator,
  userResetForgotPasswordValidator,  
  userChangePassowordValidator} from "../validators/index.js";
import { validate } from "../middlewares/validator.middlewares.js"; 
import { verifyJWT } from "../middlewares/auth.middlewares.js"

const router = Router();
//unsecured
router.route("/register").post(userRegisterValidator(),validate ,registerUser);

router.route("/login").post(userLoginValidator(),validate ,loginUser);

router.route("/verify-email/:verificationToken").get(verifyEmail)

router.route("/refresh-token").post(refreshAccessToken);

router.route("/forgot-password").post(userForgotPasswordValidator(),validate ,forgotPasswordRequest);

router
  .route("/reset-password/:resetToken")
  .post(userResetForgotPasswordValidator(), validate, resetForgotPassword);   


//secure routes
router.route("/logout").post(verifyJWT,logoutUser);

router.route("/curent-user").get(verifyJWT, getCurrentUser);

router.route("/change-password").post(verifyJWT, userChangePassowordValidator(), validate, changePassword);

router.route("/resend-email-verification").post(verifyJWT, resendVerificationEmail);


export default router;