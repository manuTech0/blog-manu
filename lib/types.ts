import { ClientZodPost, ClientZodUser } from "./allZodSchema";
import { Role } from "./generated/prisma";
;

export interface GenerateTokenType { 
    access_token: string;
    expires_in: string;
    token_type: string;
}

export interface Post<T = void> {
  title: string;
  content: string;
  slug: string;
  userId: number;
  postId: number;
  createdAt: Date;
  updateAt: Date;
  isDeleted: boolean;
  user?: T
}
export interface User<T = void>{
  userId: number;
  createdAt: Date;
  updateAt: Date;
  isDeleted: boolean;
  username: string;
  email: string;
  uniqueId: string | null;
  password: string;
  otp: string | null;
  role: Role;
  isVerified: boolean;
  isBanned: boolean;
  otpExp: Date | null;
  post?: T
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

export interface ApiResponse<T = void> {
  message: string;
  data?: T | unknown;
  error: boolean;
}

const zodUser = new ClientZodUser()
const zodPost = new ClientZodPost()

const [usersSchema, postSchema] = [zodUser.createUserSchema, zodPost.createSchema]


const formSchemaMap = {
  user: usersSchema,
  post: postSchema,
} as const

type DataType = keyof typeof formSchemaMap
export function getFormSchema<K extends DataType>(type: K): (typeof formSchemaMap)[K] {
  return formSchemaMap[type]
}


export type TableMode = "trash" | "data"

export interface ErrorZod {
  path: string,
  message: string
}

export interface GetBody {
    page: number;
    title: string;
    content: string;
    userId: number;
    action: string;
}
export interface EmailSendResponse {
    message: string;
    error: boolean;
    id?: string;
    data?: object;
    otp?: string;
}

export interface MyUserResponse {
  message: string,
  error: boolean,
  data: {
    username: string;
    email: string;
    uniqueId: string | null;
    createdAt: Date;
  }
}
export interface SlugifyOptions {
    replacement?: string;
    remove?: RegExp;
    lower?: boolean;
    strict?: boolean;
    locale?: string;
    trim?: boolean;
}

export interface ApiWithPaginating<T = void> {
  data: T | unknown;
  totalPage: number;
}