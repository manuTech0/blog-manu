// Auto-generated equivalent from Prisma schema (Todos excluded)

export enum PostStatus {
    public = "public",
    private = "private",
    deleted = "deleted",
    draft = "draft",
}

export enum UserStatus {
    deleted = "deleted",
    banded = "banded",
}

export enum UsersRoles {
    user = "user",
    admin = "admin",
    superuser = "superuser",
}

export interface Users {
    userId: string;
    username?: string | null;
    fullname: string;
    email: string;
    password?: string | null;
    verified: boolean;
    role: UsersRoles | null;
    profilePicture?: string | null;
    status?: UserStatus | null;
    createdAt: Date;
    updateAt: Date;
    provider?: string | null;
    providerId?: string | null;
    uniqueId: string;
    posts?: Posts[];
}

export interface Posts {
    postId: string;
    title: string;
    content: string;
    userId: string;
    status: PostStatus;
    createdAt: Date;
    updateAt: Date;
    slug: string;
    user?: Users;
}

