import { BadRequestError, ConflictError, NotFoundError } from "../types/custom-errors";
import prisma from "../utils/prisma";

export type createCategoryParams = {
  name: string;
  image: string;
  url: string;
  featured?: boolean;
};

export const createCategory = async (data: createCategoryParams) => {
  const existingCategory = await prisma.category.findFirst({
    where: {
      OR: [{ name: data.name }, { url: data.url }],
    },
  });
  if (existingCategory) {
    if (existingCategory.name === data.name) {
      throw new ConflictError("Category with the same name already exists");
    }
    if (existingCategory.url === data.url) {
      throw new ConflictError("Category with the same URL already exists");
    }
  }
  const category = await prisma.category.create({
    data: {
      name: data.name,
      image: data.image,
      url: data.url,
      featured: data.featured || false,
    },
  });
  return { category };
};

export const getCategories = async () => {
    const categories = await prisma.category.findMany({
        orderBy: { createdAt: 'desc' }
    });

    return { categories };
}

export const getCategory = async (id: string) => {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid category ID");
    }

    const existingCategory = await prisma.category.findUnique({
        where: { id }
    });
    
    if (!existingCategory) {
        throw new NotFoundError("Category not found");
    }

    const category = await prisma.category.findUnique({
        where: { id }
    });
    return { category };
}

export const updateCategory = async (id: string, data: Partial<createCategoryParams>) => {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid category ID");
    }

    const existingCategory = await prisma.category.findUnique({
        where: { id }
    });
    
    if (!existingCategory) {
        throw new NotFoundError("Category not found");
    }

    const updatedCategory = await prisma.category.update({
        where: { id },
        data: { ...data }
    });
    return { updatedCategory };
}

export const deleteCategory = async (id: string) => {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid category ID");
    }

    const existingCategory = await prisma.category.findUnique({
        where: { id }
    });

    if (!existingCategory) {
        throw new NotFoundError("Category not found");
    }
    await prisma.category.delete({
        where: { id }
    });
}
