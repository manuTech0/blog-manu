import { z } from "zod";
import { Role } from "./generated/prisma";
import { unique } from "next/dist/build/utils";

export interface Post {
  postId: number,
  title: string,
  content: string,
  slug: string,
  user: { userId: number, username: string, role: "USER" | "ADMIN" }
}
export interface User {
     userId: number;
    username: string;
    email: string;
    uniqueId: string | null;
    password: string;
    otp: string | null;
    role: Role;
    createdAt: Date;
    updateAt: Date;
    isDeleted: boolean;
    isVerified: boolean;
    otpExp: Date | null;
}

export type TriggerDialogForm = {
    mode: "edit" | "add",
    dataType: "post" | "user",
    dialog: boolean,
    data: User | Post | null
}

export type AdminState = {
    formMode: TriggerDialogForm,
    setFormMode: React.Dispatch<React.SetStateAction<TriggerDialogForm>>
}
export interface ApiPost {
  message: string,
  data?: Post[],
  error: boolean
}
export interface ApiUsers {
  message: string,
  data?: User[],
  error: boolean
}

export const postSchema = z.object({
    postId: z.number().optional(),
    userId: z.number().min(1).optional(),
    title: z.string().min(10).max(120),
    content: z.string().min(30)
})
export const usersSchema = z.object({
    userId: z.number().optional(),
    username: z.string().min(3).max(110),
    email: z.string().min(4).max(80),
    password: z.string().min(8),
    role: z.enum(["USER", "ADMIN"]),
    isVerified: z.boolean()
})

const formSchemaMap = {
  user: usersSchema,
  post: postSchema
} as const

type DataType = keyof typeof formSchemaMap
export function getFormSchema<T extends DataType>(dataType: T): typeof formSchemaMap[T] {
  return formSchemaMap[dataType]
}