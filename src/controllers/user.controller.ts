import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import {
  changeNameSchema,
  changePassSchema,
  emailSchema,
  loginShema,
  registerSchema,
  resetPasswordSchema,
  verificationCodeShema,
} from "./schemas";
import {
  changeName,
  changePassword,
  createUser,
  loginUser,
  refreshUserAccessToken,
  resendVerificationEmail,
  resetPassword,
  sendPasswordResetEmail,
  verifyEmail,
} from "../services/auth.service";
import logger from "../utils/logger";
import {
  clearAuthCookies,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  setAuthCookies,
} from "../utils/cookies";
import { verifyToken } from "../utils/jwt";
import prisma from "../utils/prisma";
import { NotFoundError, UnauthorizedError } from "../types/custom-errors";

export const createUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const request = registerSchema.parse({
      ...req.body,
      userAgent: req.headers["user-agent"],
    });

    const { user, refreshToken, accessToken } = await createUser(request);

    logger.info(`${user.name} account created @ ${user.createdAt}`);

    res.status(201).json({
      success: true,
      message: "login successfully",
      user,
      accessToken,
      refreshToken,
    });
  }
);

export const loginUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const request = loginShema.parse(req.body);

    const { user, accessToken, refreshToken } = await loginUser(request);

    logger.info(`${user.name} logged in successful with ${user.email}`);

    res.status(201).json({
      success: true,
      message: "login successfully",
      user,
      accessToken,
      refreshToken,
    });
  }
);


export const changeNameController = asyncHandler(
  async (req: Request, res: Response) => {
    const request = changeNameSchema.parse(req.body);
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedError("user unauthorized");
    }

    const { updatedUser } = await changeName({ userId, ...request });

    logger.info(`${updatedUser.name} is a new name`);

    res
      .status(200)
      .json({ success: true, message: "name updated successfully" });
  }
);

export const changePasswordController = asyncHandler(
  async (req: Request, res: Response) => {
    const request = changePassSchema.parse(req.body);

    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedError("user unauthorized");
    }

    await changePassword({ userId, ...request });

    logger.info("password updated");

    res.status(200).json({ success: true, message: "password updated" });
  }
);

export const logoutController = asyncHandler(
  async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;

    // Check for bearer token
    const accessToken = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (accessToken) {
      try {
        const { payload } = verifyToken(accessToken);
        if (payload?.sessionId) {
          await prisma.session.delete({
            where: { id: payload.sessionId },
          });
        }
      } catch (err) {
        console.error("Invalid token during logout:", err);
      }
    }

    logger.info(`Logout successful`);

    res.status(200).json({
      success: true,
      message: "Logout successfully",
    });
  }
);

export const refreshController = asyncHandler(
  async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken as string | undefined;

    if (!refreshToken) {
      throw new UnauthorizedError("Refresh token is missing");
    }

    //call service
    const { accessToken, newRefreshToken } = await refreshUserAccessToken(
      refreshToken
    );

    //return response
    if (newRefreshToken) {
      res.cookie(
        "refreshToken",
        newRefreshToken,
        getRefreshTokenCookieOptions()
      );
    }

    logger.info(`access token refreshed`);

    res
      .status(200)
      .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
      .json({ success: true, message: "Access token refreshed" });
  }
);

export const verifyEmailController = asyncHandler(
  async (req: Request, res: Response) => {
    //validation request
    const verificationCode = verificationCodeShema.parse(req.params.code);

    //call service
    const { updatedUser } = await verifyEmail(verificationCode);

    //return response
    logger.info(`${updatedUser.name} verified his email`);

    res.status(200).json({
      success: true,
      message: "Email verified successfully!",
      user: updatedUser,
    });
  }
);

export const resendVerificationEmailController = asyncHandler(
  async (req: Request, res: Response) => {
    // ✅ get userId from auth middleware (e.g., req.user)
    const userId = req.userId;

    // ✅ call service
    const result = await resendVerificationEmail(userId!);

    // ✅ return response
    logger.info(result.message);

    res.status(200).json({ success: true, message: result.message });
  }
);

export const sendPasswordResetController = asyncHandler(
  async (req: Request, res: Response) => {
    //validation request
    const email = emailSchema.parse(req.body.email);

    //call service
    await sendPasswordResetEmail(email);

    //return response
    logger.info("check your email for password reset instructions");

    res.status(200).json({
      success: true,
      message: "Please check your email for password reset instructions",
    });
  }
);

export const resetPasswordController = asyncHandler(
  async (req: Request, res: Response) => {
    //validation request
    const request = resetPasswordSchema.parse(req.body);

    //call service
    await resetPassword(request);

    logger.info("password reset success");

    clearAuthCookies(res)
      .status(200)
      .json({ success: true, message: "Password reset successful" });
  }
);

export const getUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
      where: {
        id: req.userId!,
      },
      select: {
        id: true,
        name: true,
        email: true,
        photo: true,
        role: true,
        verified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      throw new NotFoundError('user not found');
    }
    logger.info(`i am here ${user?.name}`)
    res.status(200).json({user: user});
  }
);
