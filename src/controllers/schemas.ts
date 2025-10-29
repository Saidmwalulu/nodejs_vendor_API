import { z } from "zod";
import { StoreStatus } from "@prisma/client";

export const emailSchema = z.email().min(1).max(255);
const passwordSchema = z
  .string()
  .min(6, "password must be at least 6 characters")
  .max(255);

export const loginShema = z.object({
  email: emailSchema,
  password: passwordSchema,
  userAgent: z
    .string()
    .optional()
    .transform((val) => val ?? ""),
});

export const registerSchema = loginShema
  .extend({
    name: z.string().min(1, "name is required").max(255),
    confirmPassword: z
      .string()
      .min(6, "password must be at least 6 characters")
      .max(255),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const changeNameSchema = z.object({
  newName: z.string().min(1, "name is required").max(255),
});

export const changePassSchema = z.object({
  oldpassword: z.string().min(1, "old password is required").max(255),
  newpassword: z
    .string()
    .min(6, "password must be at least 6 characters")
    .max(255),
});

export const verificationCodeShema = z.string().min(1).max(50);

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(6).max(255),
    verificationCode: verificationCodeShema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const CategorySchema = z.object({
  name: z
    .string()
    .min(2, "Category name must be at least 2 characters")
    .max(50, "Category name must be at most 50 characters"),

  image: z
    .object({
      url: z.string(),
    })
    .array()
    .length(1, "choose a category image"),

  url: z
    .string()
    .min(3, "URL must be at least 3 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "URL must only contain lowercase letters, numbers, and hyphens"
    ),

  featured: z.boolean().default(false),
});

export const SubCategorySchema = z.object({
  name: z
    .string()
    .min(2, "sub category name must be at least 2 characters")
    .max(50, "sub category name must be at most 50 characters"),

  image: z
    .object({
      url: z.string(),
    })
    .array()
    .length(1, "choose a sub category image"),

  url: z
    .string()
    .min(3, "URL must be at least 3 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "URL must only contain lowercase letters, numbers, and hyphens"
    ),

  featured: z.boolean().default(false),
  categoryId: z.string().uuid(),
});

export const StoreFormSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .min(2, "Store name must be at least 2 characters long.")
    .max(50, "Store name cannot exceed 50 characters.")
    .regex(/^(?!.*(?:[-_ ]){2,})[a-zA-Z0-9_ -]+$/, {
      message:
        "Only letters, numbers, space, hyphen, and underscore are allowed in the store name, and consecutive occurrences of hyphens, underscores, or spaces are not permitted.",
    }),
  description: z
    .string()
    .min(30, "Store description must be at least 30 characters long.")
    .max(500, "Store description cannot exceed 500 characters."),
  email: z.email("Invalid email format."),
  phone: z.string().regex(/^\+?\d+$/, "Invalid phone number format."),
  logo: z.object({ url: z.string() }).array().length(1, "Choose a logo image."),
  cover: z
    .object({ url: z.string() })
    .array()
    .length(1, "Choose a cover image."),
  url: z
    .string()
    .min(2, "Store url must be at least 2 characters long.")
    .max(50, "Store url cannot exceed 50 characters.")
    .regex(
      /^(?!.*(?:[-_ ]){2,})[a-zA-Z0-9_-]+$/,
      "Only letters, numbers, hyphen, and underscore are allowed in the store url, and consecutive occurrences of hyphens, underscores, or spaces are not permitted."
    ),
  featured: z.boolean().default(false).optional(),
  status: z.nativeEnum(StoreStatus).default(StoreStatus.PENDING).optional(),
});
