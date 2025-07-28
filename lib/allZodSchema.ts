import { z } from "zod";
import prisma from "./prisma"; // hanya digunakan oleh server-side schema
import xss from "xss";
import slugify from "slugify";
import { slugifyOptions } from "./utils";
import { logger } from "./logger";


// =====================
// ✅ POST
// =====================
export class ZodPost {
  public createSchema = z.object({
    userId: z.number().min(1),
    title: z.string().min(10).max(120).superRefine(async (value, ctx) => {
      const find = await prisma.post.findFirst({ where: { title: { contains: value } } });
      logger.debug(value, find);
      if (find) {
        ctx.addIssue({ code: "custom", message: "Title already exists", path: ["title"] });
      }
    }).transform(val => xss(val)),
    content: z.string().min(30).transform(val => xss(val)),
    postId: z.number(),
  });

  public updateSchema = z.object({
    title: z.string().min(10).max(120).transform(val => xss(val)).optional().superRefine(async (value, ctx) => {
      if (!value) return;
      const slug = slugify(value, slugifyOptions);
      const find = await prisma.post.findFirst({ where: { slug } });
      if (!find) {
        ctx.addIssue({ code: "custom", message: "Title already exists", path: ["title"] });
      }
    }),
    content: z.string().min(30).transform(val => xss(val)).optional(),
    slug: z.string().min(1).transform(val => xss(val)),
  });
}

export class ClientZodPost {
  public createSchema = z.object({
    userId: z.number().min(1),
    title: z.string().min(10).max(120).transform(val => xss(val)),
    content: z.string().min(30).transform(val => xss(val)),
    postId: z.number(),
  });

  public updateSchema = z.object({
    title: z.string().min(10).max(120).transform(val => xss(val)).optional(),
    content: z.string().min(30).transform(val => xss(val)).optional(),
    slug: z.string().min(1).transform(val => xss(val)),
  });
}


// =====================
// ✅ AUTH
// =====================
export class ZodAuth {
  public loginSchema = z.object({
    email: z.string().email().max(80).superRefine(async (value, ctx) => {
      const user = await prisma.user.count({ where: { email: value } });
      if (user <= 0) {
        ctx.addIssue({ code: "custom", message: "Email not found", path: ["email"] });
      }
    }).transform(val => xss(val)),
    password: z.string().min(8)
      .regex(/[A-Z]/, { message: "Must contain uppercase" })
      .regex(/[0-9]/, { message: "Must contain number" }).transform(val => xss(val))
  });

  public regisSchema = z.object({
    username: z.string().min(4).max(110).superRefine(async (value, ctx) => {
      const exists = await prisma.user.count({ where: { username: value } });
      if (exists > 0) {
        ctx.addIssue({ code: "custom", message: "Username already taken", path: ["username"] });
      }
    }).transform(val => xss(val)),
    email: z.string().email().max(80).superRefine(async (value, ctx) => {
      const exists = await prisma.user.count({ where: { email: value } });
      if (exists > 0) {
        ctx.addIssue({ code: "custom", message: "Email already taken", path: ["email"] });
      }
    }).transform(val => xss(val)),
    password: z.string().min(8)
      .regex(/[A-Z]/)
      .regex(/[0-9]/).transform(val => xss(val))
  });

  public otpValidateSchema = z.object({
    otp: z.string().min(1).max(6).regex(/[A-Z0-9]/, { message: "Invalid OTP" })
  });
}

export class ClientZodAuth {
  public loginSchema = z.object({
    email: z.string().email().max(80).transform(val => xss(val)),
    password: z.string().min(8)
      .regex(/[A-Z]/)
      .regex(/[0-9]/).transform(val => xss(val))
  });

  public regisSchema = z.object({
    username: z.string().min(4).max(110).transform(val => xss(val)),
    email: z.string().email().max(80).transform(val => xss(val)),
    password: z.string().min(8)
      .regex(/[A-Z]/)
      .regex(/[0-9]/).transform(val => xss(val))
  });

  public otpValidateSchema = z.object({
    otp: z.string().min(1).max(6).regex(/[A-Z0-9]/)
  });
}


// =====================
// ✅ USER
// =====================
export class ZodUser {
  public resetPasswordSchema = z.object({
    password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
    newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
    newRetryPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  }).superRefine((data, ctx) => {
    if (data.newPassword !== data.newRetryPassword) {
      ctx.addIssue({ code: "custom", message: "Passwords do not match", path: ["newPassword"] });
    }
  });

  public createUserSchema = z.object({
    username: z.string().min(4).max(110).superRefine(async (value, ctx) => {
      const exists = await prisma.user.count({ where: { username: value } });
      if (exists > 0) {
        ctx.addIssue({ code: "custom", message: "Username already taken", path: ["username"] });
      }
    }).transform(val => xss(val)),
    email: z.string().email().max(80).superRefine(async (value, ctx) => {
      const exists = await prisma.user.count({ where: { email: value } });
      if (exists > 0) {
        ctx.addIssue({ code: "custom", message: "Email already taken", path: ["email"] });
      }
    }).transform(val => xss(val)),
    password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).transform(val => xss(val)),
    role: z.enum(["USER", "ADMIN"]),
    isVerified: z.boolean(),
    userId: z.number()
  });

  public updateUserSchema = z.object({
    username: z.string().min(4).max(110).superRefine(async (value, ctx) => {
      const exists = await prisma.user.count({ where: { username: value } });
      if (exists > 0) {
        ctx.addIssue({ code: "custom", message: "Username already taken", path: ["username"] });
      }
    }).transform(val => xss(val)),
    email: z.string().email().max(80).superRefine(async (value, ctx) => {
      const exists = await prisma.user.count({ where: { email: value } });
      if (exists > 0) {
        ctx.addIssue({ code: "custom", message: "Email already taken", path: ["email"] });
      }
    }).transform(val => xss(val)),
    password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).transform(val => xss(val)),
    role: z.enum(["USER", "ADMIN"])
  });
}

export class ClientZodUser {
  public resetPasswordSchema = z.object({
    password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
    newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
    newRetryPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/)
  });

  public createUserSchema = z.object({
    username: z.string().min(4).max(110),
    email: z.string().email().max(80),
    password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
    role: z.enum(["USER", "ADMIN"]),
    isVerified: z.boolean(),
    userId: z.number()
  });

  public updateUserSchema = z.object({
    username: z.string().min(4).max(110),
    email: z.string().email().max(80),
    password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
    role: z.enum(["USER", "ADMIN"])
  });
}
