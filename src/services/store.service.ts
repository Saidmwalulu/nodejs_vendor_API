import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../types/custom-errors";
import prisma from "../utils/prisma";
import { StoreStatus } from "@prisma/client";

export type CreateStoreParams = {
  id?: string;
  name: string;
  description: string;
  email: string;
  phone: string;
  url: string;
  logo: string;
  cover: string;
  status?: StoreStatus;
  averageRating?: number;
  featured?: boolean;
  returnPolicy?: string | null;
  defaultShippingService?: string | null;
  defaultShippingFees?: string | null;
  defaultDeliveryTimeMin?: number | null;
  defaultDeliveryTimeMax?: number | null;
  userId: string;
};

export const createStore = async (data: CreateStoreParams) => {
  const existingStore = await prisma.store.findFirst({
    where: {
      AND: [
        {
          OR: [
            { name: data.name },
            { email: data.email },
            { phone: data.phone },
            { url: data.url },
          ],
        },
        {
          NOT: {
            id: data.id,
          },
        },
      ],
    },
  });
  if (existingStore) {
    if (existingStore.name === data.name) {
      throw new ConflictError("store with the same name already exists");
    } else if (existingStore.email === data.email) {
      throw new ConflictError("store with the same email already exists");
    } else if (existingStore.phone === data.phone) {
      throw new ConflictError("store with the same phone already exists");
    } else if (existingStore.url === data.url) {
      throw new ConflictError("store with the same URL already exists");
    }
  }
  const store = await prisma.store.upsert({
    where: { id: data.id ?? "" }, // Empty string prevents undefined error
    update: {
      ...data,
      updatedAt: new Date(),
    },
    create: {
      name: data.name,
      description: data.description,
      email: data.email,
      phone: data.phone,
      url: data.url,
      logo: data.logo,
      cover: data.cover,
      status: data.status ?? StoreStatus.PENDING,
      averageRating: data.averageRating ?? 0,
      featured: data.featured ?? false,
      returnPolicy: data.returnPolicy ?? null,
      defaultShippingService: data.defaultShippingService ?? null,
      defaultShippingFees: data.defaultShippingFees ?? null,
      defaultDeliveryTimeMin: data.defaultDeliveryTimeMin ?? null,
      defaultDeliveryTimeMax: data.defaultDeliveryTimeMax ?? null,
      userId: data.userId, // ✅ use foreign key directly
    },
  });
  return { store };
};

export const getStores = async (userId: string) => {
  const stores = await prisma.store.findMany({
    where: { userId },
    include: {
      user: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return { stores };
};

export const getStore = async (url: string, userId: string) => {

  const store = await prisma.store.findFirst({
    where: { url, userId },
  });

  if (!store) {
    throw new NotFoundError("store not found or not authorized");
  }
  return { store };
};

export const deleteStore = async (id: string, userId: string) => {
  if (!id || typeof id !== "string") {
    throw new BadRequestError("Invalid store ID");
  }

  const existingStore = await prisma.store.findFirst({
    where: { id, userId },
  });

  if (!existingStore) {
    throw new NotFoundError("store not found");
  }
  await prisma.store.delete({
    where: { id },
  });
};
