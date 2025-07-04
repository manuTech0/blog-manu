import { Secret } from "jsonwebtoken";

declare namespace NodeJS {
    interface ProcessEnv {
        NODE_ENV: "development" | "production" | "test";
        DATABASE_URL: string;
        AEGON2_SECRET: string;
        PRIVATE_KEY_FILE: string;
        PUBLIC_KEY_FILE: string;
        API_URL: string;
    }
}