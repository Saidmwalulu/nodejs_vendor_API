import { RequestHandler } from "express";
import { NotFoundError, UnauthorizedError } from "../types/custom-errors";

const authorizeRole = (...allowedRoles: string[]): RequestHandler => {
  return (req, res, next) => {
    const role = req.userRole;

    if (!role) {
      throw new NotFoundError("Role not found");
    }

    if (!allowedRoles.includes(role)) {
      throw new UnauthorizedError(
        "You do not have permission to perform this action"
      );
    }
    next();
  };
};

export default authorizeRole;
