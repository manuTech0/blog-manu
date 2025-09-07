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
      const slug = slugify(value, slugifyOptions)
      const find = await prisma.post.findFirst({ where: { AND: [ { slug: slug }, { title: value }] }});
      logger.debug(value, find);
      if (find && find.title == value) {
        ctx.addIssue({ code: "custom", message: "Title already exists", path: ["title"] });
      }
    }).transform(val => xss(val)),
    content: z.string().min(30).transform(val => xss(val)),
    postId: z.number().optional(),
  });

  public updateSchema = z.object({
    title: z.string().max(120).transform(val => xss(val)).optional().nullable().superRefine(async (value, ctx) => {
      if (!value) return;
      const slug = slugify(value, slugifyOptions);
      const find = await prisma.post.findFirst({ where: { slug: slug } });
      if (find && find.title == value) {
        ctx.addIssue({ code: "custom", message: "Title already exists", path: ["title"] });
      }
    }).refine(val => !val || val.length >= 10, {
      message: "Title minimum 10 character",
    }),
    content: z.string().min(30).transform(val => xss(val)).optional(),
    slug: z.string().min(1).transform(val => xss(val)).optional(),
  });
}

export class ClientZodPost {
  public createSchema = z.object({
    userId: z.number().min(1),
    title: z.string().min(10).max(120).transform(val => xss(val)),
    content: z.string().min(30).transform(val => xss(val)),
    postId: z.number().optional(),
  });

  public updateSchema = z.object({
    title: z.string().min(10).max(120).transform(val => xss(val)).optional(),
    content: z.string().min(30).transform(val => xss(val)).optional(),
    slug: z.string().min(1).transform(val => xss(val)),
    postId: z.number()
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
    newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
    newRetryPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
    otp: z.string().max(6).min(6)
  }).superRefine((data, ctx) => {
    if (data.newPassword !== data.newRetryPassword && !/^[0-9A-Z]+$/.test(data.otp) ) {
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
    userId: z.number().optional()
  });

  public updateUserSchema = z.object({
    username: z.string().min(4).max(110).transform(val => xss(val)),
    email: z.string().email().max(80).transform(val => xss(val)),
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
    userId: z.number().optional()
  });

  public updateUserSchema = z.object({
    username: z.string().min(4).max(110),
    email: z.string().email().max(80),
    password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
    role: z.enum(["USER", "ADMIN"])
  });
}
