import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const packageSchema = z.object({
  name: z.string().min(1, "Package name is required").max(100),
  description: z.string().max(500).optional().nullable(),
  icon: z.string().default("Folder"),
  color: z.string().default("#3b82f6"),
  isFavorite: z.boolean().default(false),
  parentId: z.string().nullable().optional(),
});

export const sectionSchema = z.object({
  packageId: z.string().min(1, "Package ID is required"),
  name: z.string().min(1, "Section name is required").max(100),
  description: z.string().max(500).optional().nullable(),
  icon: z.string().default("FolderOpen").optional().nullable(),
});

export const urlSchema = z.object({
  packageId: z.string().min(1, "Package is required"),
  sectionId: z.string().optional().nullable(),
  url: z
    .string()
    .min(1, "URL is required")
    .refine(
      (val) => {
        try {
          const parsed = new URL(val.trim());
          return parsed.protocol === "http:" || parsed.protocol === "https:";
        } catch {
          return false;
        }
      },
      { message: "Must be a valid web URL starting with http:// or https://" }
    ),
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(1000).optional().nullable(),
  faviconUrl: z.string().max(1000).optional().nullable(),
  isFavorite: z.boolean().default(false),
  tags: z.array(z.string().min(1).max(30)).default([]),
});

export const batchUrlActionSchema = z.object({
  action: z.enum(["delete", "move", "favorite", "unfavorite", "addTag"]),
  urlIds: z.array(z.string()).min(1, "Select at least one URL"),
  targetPackageId: z.string().optional(),
  targetSectionId: z.string().optional().nullable(),
  tagName: z.string().optional(),
});

export const reorderSectionsSchema = z.object({
  packageId: z.string().min(1),
  sectionIds: z.array(z.string()).min(1),
});

export const reorderPackagesSchema = z.object({
  packageIds: z.array(z.string()).min(1),
});

export const packageMoveOrReorderSchema = z.object({
  packageId: z.string().min(1),
  targetParentId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirmation do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });


