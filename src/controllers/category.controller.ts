import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { CategorySchema } from "./schemas";
import {
  createCategory,
  createCategoryParams,
  deleteCategory,
  getCategories,
  getCategory,
  updateCategory,
} from "../services/category.service";
import logger from "../utils/logger";

export const createCategoryController = asyncHandler(
  async (req: Request, res: Response) => {
    const request = CategorySchema.parse(req.body);
    const payload = { ...request, image: request.image[0]?.url || "" };

    const { category } = await createCategory(payload);

    logger.info(`Category created: ${category.name} (ID: ${category.id})`);

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  }
);

export const getCategoriesController = asyncHandler(
  async (req: Request, res: Response) => {
    const { categories } = await getCategories();

    logger.info(`Fetched ${categories.length} categories`);

    res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      categories: categories,
    });
  }
);

export const getCategoryController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id;

    const { category } = await getCategory(id!);

    logger.info(`Fetched 1 category: ${category?.name} (ID: ${category?.id})`);

    res.status(200).json({
      success: true,
      message: "Category fetched successfully",
      data: category,
    });
  }
);

export const updateCategoryController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const data = CategorySchema.partial().parse(req.body);
    const payload: Partial<createCategoryParams> = {
      ...data,
      image:
        (data.image as { url: string }[] | undefined)?.[0]?.url ?? undefined,
    };
    const { updatedCategory } = await updateCategory(id!, payload);

    logger.info(
      `Category updated: ${updatedCategory.name} (ID: ${updatedCategory.id})`
    );
    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  }
);

export const deleteCategoryController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id;

    await deleteCategory(id!);

    logger.info(`Category deleted (ID: ${id})`);
    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      data: null,
    });
  }
);
