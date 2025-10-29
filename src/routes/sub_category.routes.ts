import { Router } from "express";
import {
  createSubCategoryController,
  deleteSubCategoryController,
  getSubCategoriesController,
  getSubCategoryController,
  updateSubCategoryController,
} from "../controllers/sub_category.controller";
import authenticate from "../middlewares/authenticate";
import authorizeRole from "../middlewares/roleAuthenticate";

const subCategoryRoutes = Router();

//prefix: /sub-category

subCategoryRoutes.post(
  "/create",
  authenticate,
  authorizeRole("ADMIN"),
  createSubCategoryController
);
subCategoryRoutes.get(
  "/",
  authenticate,
  authorizeRole("ADMIN"),
  getSubCategoriesController
);
subCategoryRoutes.get(
  "/:id",
  authenticate,
  authorizeRole("ADMIN"),
  getSubCategoryController
);
subCategoryRoutes.put(
  "/:id",
  authenticate,
  authorizeRole("ADMIN"),
  updateSubCategoryController
);
subCategoryRoutes.delete(
  "/:id",
  authenticate,
  authorizeRole("ADMIN"),
  deleteSubCategoryController
);

export default subCategoryRoutes;
