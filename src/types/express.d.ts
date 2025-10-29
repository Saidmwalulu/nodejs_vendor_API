import type { User as PrismaUser, Role } from "@prisma/client";
declare global {
  namespace Express {
    interface Request {
      userId?: string; 
      sessionId?: string; 
      userRole?: Role;
      authTokens?: {
        accessToken: string;
        refreshToken: string;
      };
    }
    interface User extends PrismaUser {}
  }
}

export {};
