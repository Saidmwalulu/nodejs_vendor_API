import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import cookieParser from "cookie-parser";
import categoryRoutes from "./routes/category.routes";
import { errorHandler } from "./middlewares/errorHandler";
import userRoutes from "./routes/user.routes";
import { APP_ORIGIN } from "./utils/env";
import passportConfig from "./config/passport";
import subCategoryRoutes from "./routes/sub_category.routes";
import storeRoutes from "./routes/store.routes";

const app = express();

const PORT: number = parseInt(process.env.PORT!) || 8085;

//middlewares
app.use(
  cors({
    origin: APP_ORIGIN,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(helmet());


// User-aware limiter (each authenticated user has their own limit)
const userAwareLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // per user (or IP)
  message: "Too many requests, please try again later.",
  keyGenerator: (req) => {
    const user = (req as any).user;
    if (user && user.id) return user.id; // logged-in users use their ID
    return ipKeyGenerator(req as any); // fallback safely for IPv6 users
  },
});

app.use(userAwareLimiter);

passportConfig(app);

// Auth routes — tighter limiter (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // only 10 login attempts in 15 mins
  message: "Too many login attempts, please try again later.",
});

//routes
app.use("/auth", authLimiter,  userRoutes);
app.use("/category", categoryRoutes);
app.use("/sub-category", subCategoryRoutes);
app.use("/store", storeRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use(errorHandler);

//app initialization
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
