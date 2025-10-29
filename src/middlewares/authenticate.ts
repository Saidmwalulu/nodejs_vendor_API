import { RequestHandler } from "express";
import { UnauthorizedError } from "../types/custom-errors";
import { verifyToken } from "../utils/jwt";

const authenticate: RequestHandler = (req, res, next) => {
  const accessToken = req.cookies.accessToken as string | undefined;

  if (!accessToken) {
    throw new UnauthorizedError("Not authorized");
  }

  const { error, payload } = verifyToken(accessToken);

  if (!payload) {
    throw new UnauthorizedError(
      error === "jwt expired" ? "Token expired" : "Invalid token"
    );
  }

  req.userId = payload.userId;
  req.sessionId = payload.sessionId;
  (req as any).userRole = payload.role;
  next();
};

export default authenticate;
