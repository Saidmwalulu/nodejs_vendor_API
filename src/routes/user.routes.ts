import { Router } from "express";
import {
  changeNameController,
  changePasswordController,
  createUserController,
  getUserController,
  loginUserController,
  logoutController,
  refreshController,
  resendVerificationEmailController,
  resetPasswordController,
  sendPasswordResetController,
  verifyEmailController,
} from "../controllers/user.controller";
import authenticate from "../middlewares/authenticate";
import passport from "passport";
import { setAuthCookies } from "../utils/cookies";
import { APP_ORIGIN } from "../utils/env";

const userRoutes = Router();

//prefix: /auth

userRoutes.post("/register", createUserController);
userRoutes.post("/login", loginUserController);
userRoutes.get("/me", authenticate, getUserController);
userRoutes.post("/changename", authenticate, changeNameController);
userRoutes.post("/changepassword", authenticate, changePasswordController);
userRoutes.get("/logout", authenticate, logoutController);
userRoutes.get("/refresh", refreshController);
userRoutes.get("/email/verify/:code", verifyEmailController);
userRoutes.get(
  "/resend/email",
  authenticate,
  resendVerificationEmailController
);
userRoutes.post("/password/forgot", sendPasswordResetController);
userRoutes.post("/password/reset", resetPasswordController);

//google oauth routes
userRoutes.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

userRoutes.get(
  "/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    const { accessToken, refreshToken } = req.authTokens ?? {};
    if (accessToken && refreshToken) {
      setAuthCookies({ res, accessToken, refreshToken });
    }
    return res.redirect(APP_ORIGIN);
  }
);

export default userRoutes;
