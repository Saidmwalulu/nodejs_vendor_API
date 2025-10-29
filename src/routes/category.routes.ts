import { Router } from "express";
import {
  createCategoryController,
  deleteCategoryController,
  getCategoriesController,
  getCategoryController,
  updateCategoryController,
} from "../controllers/category.controller";
import authenticate from "../middlewares/authenticate";
import authorizeRole from "../middlewares/roleAuthenticate";

const categoryRoutes = Router();

//prefix: /category

categoryRoutes.post(
  "/create",
  authenticate,
  authorizeRole("ADMIN"),
  createCategoryController
);
categoryRoutes.get(
  "/",
  authenticate,
  authorizeRole("ADMIN"),
  getCategoriesController
);
categoryRoutes.get(
  "/:id",
  authenticate,
  authorizeRole("ADMIN"),
  getCategoryController
);
categoryRoutes.put(
  "/:id",
  authenticate,
  authorizeRole("ADMIN"),
  updateCategoryController
);
categoryRoutes.delete(
  "/:id",
  authenticate,
  authorizeRole("ADMIN"),
  deleteCategoryController
);

export default categoryRoutes;
