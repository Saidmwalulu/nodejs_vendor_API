import {
  BadRequestError,
  ConflictError,
  InternalServerError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
} from "../types/custom-errors";
import { compareValue, hashValue } from "../utils/bcrypt";
import {
  fifteenMinutesAgo,
  ONE_DAY_IN_MS,
  oneHourFromNow,
  oneYearFromNow,
  thirtyDaysFromNow,
} from "../utils/date";
import {
  getPasswordResetTemplate,
  getVerifyEmailTemplate,
} from "../utils/emailTemplates";
import { APP_ORIGIN } from "../utils/env";
import {
  RefreshTokenPayload,
  refreshTokenSignOptions,
  signToken,
  verifyToken,
} from "../utils/jwt";
import prisma from "../utils/prisma";
import { sendMail } from "../utils/sendMail";
import verificationCodeType from "../utils/verificationCodeTypes";

type createUserParams = {
  name: string;
  email: string;
  password: string;
  userAgent?: string;
};

export const createUser = async (data: createUserParams) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new ConflictError("Email already exists");
  } else {
    const hashedPassword = await hashValue(data.password);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        verified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    //create verification code
    const verificationCode = await prisma.verificationCode.create({
      data: {
        userId: user.id,
        type: verificationCodeType.EmailVerification,
        expiresAt: oneYearFromNow(),
      },
    });

    //send verification email
    const url = `${APP_ORIGIN}/auth/email/verify/${verificationCode.id}`;
    const { error } = await sendMail({
      to: user.email,
      ...getVerifyEmailTemplate(url),
    });

    if (error) {
      console.error("Error sending verification email:", error);
    }

    //create session
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        userAgent: data.userAgent ?? null,
        expiresAt: thirtyDaysFromNow(),
      },
    });

    //sign access token and refresh token
    const refreshToken = signToken(
      { sessionId: session.id },
      refreshTokenSignOptions
    );

    const accessToken = signToken({ userId: user.id, sessionId: session.id });

    //return user and tokens
    return { user, refreshToken, accessToken };
  }
};

type loginParams = {
  email: string;
  password: string;
  userAgent?: string;
};

export const loginUser = async ({
  email,
  password,
  userAgent,
}: loginParams) => {
  //get the user by email
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      stores: {
        select: {
          id: true,
          name: true,
          url: true,
        },
      },
    },
  });
  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  if (!user.password) {
    throw new UnauthorizedError("Invalid email or password");
  }

  //validate password from the request
  const isValidPassword = await compareValue(password, user.password);
  if (!isValidPassword) {
    throw new UnauthorizedError("Invalid email or password");
  }

  // Remove password before returning
  const { password: _, ...safeUser } = user;

  //create a session
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      userAgent: userAgent ?? null,
      expiresAt: thirtyDaysFromNow(),
    },
  });

  //sign access token and refresh token
  const refreshToken = signToken(
    { sessionId: session.id },
    refreshTokenSignOptions
  );

  const accessToken = signToken({
    userId: user.id,
    name: user.name!,
    email: user.email,
    role: user.role,
    verified: user.verified,
    sessionId: session.id,
  });

  //return user and tokens
  return { user: safeUser, refreshToken, accessToken };
};

type changeNameParams = {
  userId: string;
  newName: string;
};
export const changeName = async ({ userId, newName }: changeNameParams) => {
  if (!newName.trim()) {
    throw new BadRequestError("Name cannot be empty");
  }

  // Update the user's name
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { name: newName },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      verified: true,
      updatedAt: true,
    },
  });

  if (!updatedUser) {
    throw new NotFoundError("User not found");
  }

  return { updatedUser };
};

type ChangePasswordParams = {
  userId: string;
  oldpassword: string;
  newpassword: string;
};

export const changePassword = async ({
  userId,
  oldpassword,
  newpassword,
}: ChangePasswordParams) => {
  // 1️⃣ Fetch the user
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (!user.password) {
    throw new BadRequestError("This account does not have a password set");
  }

  // 2️⃣ Verify the current password
  const isValidPassword = await compareValue(oldpassword, user.password);
  if (!isValidPassword) {
    throw new UnauthorizedError("Incorrect current password");
  }

  // 3️⃣ Ensure the new password is not the same as the old one
  const isSamePassword = await compareValue(newpassword, user.password);
  if (isSamePassword) {
    throw new BadRequestError(
      "New password cannot be the same as the old password"
    );
  }

  // 4️⃣ Hash and update password
  const hashedPassword = await hashValue(newpassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    }),
    // Invalidate all sessions (force re-login)
    prisma.session.deleteMany({
      where: { userId },
    }),
  ]);
};

export const refreshUserAccessToken = async (refreshToken: string) => {
  const { payload } = verifyToken<RefreshTokenPayload>(refreshToken, {
    secret: refreshTokenSignOptions.secret,
  });
  if (!payload) {
    throw new UnauthorizedError("Invalid refresh token");
  }

  const session = await prisma.session.findUnique({
    where: { id: payload.sessionId },
  });

  const now = Date.now();

  if (!session || session.expiresAt.getTime() <= now) {
    throw new UnauthorizedError("Session expired or invalid");
  }

  //refresh the session if it expires in the next 24 hours
  const sessionNeedsRefresh =
    session.expiresAt.getTime() - now <= ONE_DAY_IN_MS;

  if (sessionNeedsRefresh) {
    session.expiresAt = thirtyDaysFromNow();
    await prisma.session.update({
      where: { id: session.id },
      data: { expiresAt: session.expiresAt },
    });
  }
  //sign token
  const newRefreshToken = sessionNeedsRefresh
    ? signToken({ sessionId: session.id }, refreshTokenSignOptions)
    : undefined;
  const accessToken = signToken({
    userId: session.userId,
    sessionId: session.id,
  });

  return { accessToken, newRefreshToken };
};

export const verifyEmail = async (code: string) => {
  //get verification code
  const validCode = await prisma.verificationCode.findFirst({
    where: {
      id: code,
      type: verificationCodeType.EmailVerification,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!validCode) {
    throw new UnauthorizedError(
      "The verification code has expired or is invalid"
    );
  }

  //update user by setting verified to true
  const updatedUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: validCode.userId },
      data: { verified: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        verified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await tx.verificationCode.delete({
      where: { id: validCode.id },
    });

    return user;
  });

  if (!updatedUser) {
    throw new UnauthorizedError("Email verification failed");
  }

  //return user
  return { updatedUser };
};

export const resendVerificationEmail = async (userId: string) => {
  // 1. find user
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError("user not found");
  }

  if (user.verified) {
    throw new BadRequestError("User already verified");
  }

  // 2. delete old verification codes
  await prisma.verificationCode.deleteMany({
    where: { userId: user.id, type: verificationCodeType.EmailVerification },
  });

  // 3. create new verification code (valid for 24 hours)
  const verificationCode = await prisma.verificationCode.create({
    data: {
      userId: user.id,
      type: verificationCodeType.EmailVerification,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    },
  });

  // 4. send verification email
  const url = `${APP_ORIGIN}/auth/email/verify/${verificationCode.id}`;
  const { error } = await sendMail({
    to: user.email,
    ...getVerifyEmailTemplate(url),
  });
  if (error) {
    console.error("Error sending verification email:", error);
    throw new BadRequestError("Failed to send verification email");
  }

  // 5. return success
  return { message: "Verification email resent, please check your email" };
};

export const sendPasswordResetEmail = async (email: string) => {
  //1. get the user by email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new NotFoundError("User not found");
  }

  //2. check email rate limit
  const fifteenMinAgo = fifteenMinutesAgo();

  const count = await prisma.verificationCode.count({
    where: {
      userId: user.id,
      type: verificationCodeType.PasswordReset,
      createdAt: {
        gt: fifteenMinAgo,
      },
    },
  });

  if (count >= 3) {
    throw new TooManyRequestsError(
      "Password reset limit reached. Try again in 15 minutes."
    );
  }

  //create verification code
  const expiresAt = oneHourFromNow();

  const verificationCode = await prisma.verificationCode.create({
    data: {
      userId: user.id,
      type: verificationCodeType.PasswordReset,
      expiresAt,
    },
  });
  //send password reset email
  const url = `${APP_ORIGIN}/auth/password/reset?code=${
    verificationCode.id
  }&exp=${expiresAt.getTime()}`;

  const { data, error } = await sendMail({
    to: user.email,
    ...getPasswordResetTemplate(url),
  });

  if (!data?.id) {
    const errorMessage = error
      ? `${error.name ?? "MailError"} - ${error.message ?? "Unknown error"}`
      : "Failed to send password reset email";

    throw new InternalServerError(errorMessage);
  }

  //return success message
  return { url, emailId: data.id };
};

type ResetPasswordParams = {
  password: string;
  verificationCode: string;
};

export const resetPassword = async ({
  password,
  verificationCode,
}: ResetPasswordParams) => {
  //get the verification code
  const validCode = await prisma.verificationCode.findFirst({
    where: {
      id: verificationCode,
      type: verificationCodeType.PasswordReset,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!validCode) {
    throw new ConflictError("Invalid or expired verification code");
  }

  //update users password
  const hashedPassword = await hashValue(password);

  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: validCode.userId },
      data: { password: hashedPassword },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        verified: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    //delete the verification code
    prisma.verificationCode.delete({
      where: { id: validCode.id },
    }),
    //delete all sessions
    prisma.session.deleteMany({
      where: { userId: validCode.userId },
    }),
  ]);

  if (!updatedUser) {
    throw new ConflictError("Failed to reset password");
  }

  //return success message
  return { user: updatedUser };
};
