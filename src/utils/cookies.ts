import { path } from 'path';
import { CookieOptions, Response } from "express";
import { fifteenMinutesFromNow, thirtyDaysFromNow } from "./date";
import { NODE_ENV } from "./env";

//const secure = process.env.NODE_ENV !== "development";
const isProduction = NODE_ENV === "production";

export const REFRESH_PATH = "/auth/refresh";

const defaults: CookieOptions = {
  sameSite: isProduction ? "none" : "lax",
  httpOnly: true,
  secure: isProduction,
};

export const getAccessTokenCookieOptions = () => ({
  ...defaults,
  expires: fifteenMinutesFromNow(),
  path: "/",
});

export const getRefreshTokenCookieOptions = () => ({
  ...defaults,
  expires: thirtyDaysFromNow(),
  path: REFRESH_PATH,
});

type Params = {
  res: Response;
  accessToken: string;
  refreshToken: string;
};

export const setAuthCookies = ({ res, accessToken, refreshToken }: Params) =>
  res
    .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
    .cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());

export const clearAuthCookies = (res: Response) =>
  res.clearCookie("accessToken").clearCookie("refreshToken", {
    path: REFRESH_PATH,
  });
