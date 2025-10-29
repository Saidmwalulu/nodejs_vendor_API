import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../types/custom-errors";
import prisma from "../utils/prisma";

export type createSubCategoryParams = {
  name: string;
  image: string;
  url: string;
  featured?: boolean;
  categoryId: string;
};

export const createSubCategory = async (data: createSubCategoryParams) => {
  const existingSubCategory = await prisma.subCategory.findFirst({
    where: {
      OR: [{ name: data.name }, { url: data.url }],
    },
  });
  if (existingSubCategory) {
    if (existingSubCategory.name === data.name) {
      throw new ConflictError("sub-category with the same name already exists");
    }
    if (existingSubCategory.url === data.url) {
      throw new ConflictError("sub-category with the same URL already exists");
    }
  }
  const subCategory = await prisma.subCategory.create({
    data: {
      name: data.name,
      image: data.image,
      url: data.url,
      featured: data.featured || false,
      categoryId: data.categoryId,
    },
  });
  return { subCategory };
};

export const getSubCategories = async () => {
  const subCategories = await prisma.subCategory.findMany({
    include: {
      category: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return { subCategories };
};

export const getSubCategory = async (id: string) => {
  if (!id || typeof id !== "string") {
    throw new BadRequestError("Invalid sub-category ID");
  }

  const existingSubCategory = await prisma.subCategory.findUnique({
    where: { id },
  });

  if (!existingSubCategory) {
    throw new NotFoundError("sub-category not found");
  }

  const subCategory = await prisma.subCategory.findUnique({
    where: { id },
  });
  return { subCategory };
};

export const updateSubCategory = async (
  id: string,
  data: Partial<createSubCategoryParams>
) => {
  if (!id || typeof id !== "string") {
    throw new BadRequestError("Invalid sub-category ID");
  }

  const existingSubCategory = await prisma.subCategory.findUnique({
    where: { id },
  });

  if (!existingSubCategory) {
    throw new NotFoundError("sub-category not found");
  }

  const updatedSubCategory = await prisma.subCategory.update({
    where: { id },
    data: { ...data },
  });
  return { updatedSubCategory };
};

export const deleteSubCategory = async (id: string) => {
  if (!id || typeof id !== "string") {
    throw new BadRequestError("Invalid sub-category ID");
  }

  const existingSubCategory = await prisma.subCategory.findUnique({
    where: { id },
  });

  if (!existingSubCategory) {
    throw new NotFoundError("sub-category not found");
  }
  await prisma.subCategory.delete({
    where: { id },
  });
};
