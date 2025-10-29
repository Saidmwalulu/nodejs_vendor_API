import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { SubCategorySchema } from "./schemas";
import {
  createSubCategory,
  createSubCategoryParams,
  deleteSubCategory,
  getSubCategories,
  getSubCategory,
  updateSubCategory,
} from "../services/sub_category.service";
import logger from "../utils/logger";

export const createSubCategoryController = asyncHandler(
  async (req: Request, res: Response) => {
    const request = SubCategorySchema.parse(req.body);
    const payload = { ...request, image: request.image[0]?.url || "" };

    const { subCategory } = await createSubCategory(payload);

    logger.info(`Category created: ${subCategory.name} (ID: ${subCategory.id})`);

    res.status(201).json({
      success: true,
      message: "sub-category created successfully",
      data: subCategory,
    });
  }
);

export const getSubCategoriesController = asyncHandler(
  async (req: Request, res: Response) => {
    const { subCategories } = await getSubCategories();

    logger.info(`Fetched ${subCategories.length} sub-categories`);

    res.status(200).json({
      success: true,
      message: "sub-categories fetched successfully",
      data: subCategories,
    });
  }
);

export const getSubCategoryController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id;

    const { subCategory } = await getSubCategory(id!);

    logger.info(`Fetched 1 sub-category: ${subCategory?.name} (ID: ${subCategory?.id})`);

    res.status(200).json({
      success: true,
      message: "sub-category fetched successfully",
      data: subCategory,
    });
  }
);

export const updateSubCategoryController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const data = SubCategorySchema.partial().parse(req.body);
    const payload: Partial<createSubCategoryParams> = {
      ...data,
      image:
        (data.image as { url: string }[] | undefined)?.[0]?.url ?? undefined,
    };
    const { updatedSubCategory } = await updateSubCategory(id!, payload);

    logger.info(
      `Category updated: ${updatedSubCategory.name} (ID: ${updatedSubCategory.id})`
    );
    res.status(200).json({
      success: true,
      message: "sub-category updated successfully",
      data: updatedSubCategory,
    });
  }
);

export const deleteSubCategoryController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id;

    await deleteSubCategory(id!);

    logger.info(`sub-category deleted (ID: ${id})`);
    res.status(200).json({
      success: true,
      message: "sub-category deleted successfully",
      data: null,
    });
  }
);
