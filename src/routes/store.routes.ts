import { Router } from "express";
import authenticate from "../middlewares/authenticate";
import authorizeRole from "../middlewares/roleAuthenticate";
import { createStoreController, deleteStoreController, getStoreController, getStoresController } from "../controllers/store.controller";

const storeRoutes = Router();

//prefix: /store

storeRoutes.post(
  "/create",
  authenticate,
  authorizeRole("SELLER"),
  createStoreController
);

storeRoutes.get(
  "/",
  authenticate,
  authorizeRole("SELLER"),
  getStoresController
);

storeRoutes.get(
  "/:url",
  authenticate,
  authorizeRole("SELLER"),
  getStoreController
);

storeRoutes.delete(
  "/:id",
  authenticate,
  authorizeRole("SELLER"),
  deleteStoreController
);

export default storeRoutes;
