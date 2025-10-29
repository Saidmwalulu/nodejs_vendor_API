import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { StoreFormSchema } from "./schemas";
import { UnauthorizedError } from "../types/custom-errors";
import logger from "../utils/logger";
import { createStore, deleteStore, getStore, getStores } from "../services/store.service";

export const createStoreController = asyncHandler(
  async (req: Request, res: Response) => {
    const request = StoreFormSchema.parse(req.body);

    const userId = (req as any).userId;

    if (!userId) {
      throw new UnauthorizedError("Unauthorized: User ID missing");
    }

    const payload = {
      ...request,
      logo: request.logo[0]?.url || "",
      cover: request.cover[0]?.url || "",
      userId,
      id: request.id ?? undefined, 
    };

    const isUpdate = !!payload.id;
    const { store } = await createStore(payload);

    const message = isUpdate
      ? "Store updated successfully"
      : "Store created successfully";

    logger.info(`${isUpdate ? "Updated" : "Created"} store: ${store.name} (ID: ${store.id})`);

    res.status(isUpdate ? 200 : 201).json({
      success: true,
      message,
      data: store,
    });
 
  }
);

export const getStoresController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id

    const { stores } = await getStores(userId!);

    logger.info(`${stores.length} fetched`);

    res.status(200).json({
      success: true,
      message: "stores fetched",
      data: stores
    })
  }
)

export const getStoreController = asyncHandler(
  async (req: Request, res: Response) => {
    const url = req.params.url;
    const userId = req.user?.id;

    const { store } = await getStore(url!, userId!);

    logger.info(`${store.name} fetched`);

    res.status(200).json({
      success: true,
      message: "store fetched",
      data: store
    })
  }
)

export const deleteStoreController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const userId = req.user?.id;

    await deleteStore(id!, userId!);

    logger.info(`store deleted`);

    res.status(200).json({
      success: true,
      message: "store deleted",
      data: null
    })
  }
)
