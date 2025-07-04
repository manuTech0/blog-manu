import { createSlug } from "@/lib/createSlug";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { faker } from "@faker-js/faker";
import argon2 from "argon2";
import { nanoid } from "nanoid";
import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

async function main() {
  try {
    // Create Admin Account (upsert untuk mencegah error)
    const passwordAdmin = await argon2.hash("admin12345678");
    const admin = await prisma.user.upsert({
      where: { username: "admin" },
      update: {},
      create: {
        username: "admin",
        email: "admin@admin.com",
        uniqueId: nanoid(6),
        password: passwordAdmin,
        role: "ADMIN",
        isVerified: true,
      },
    });

    logger.info("✅ Admin created:", {
      username: "admin",
      email: "admin@admin.com",
      password: "admin12345678",
    });

    // Seed users
    for (let i = 0; i < 5; ) {
      const username = faker.internet.userName() + "_" + nanoid(5);
      const email = faker.internet.email().split("@")[0] + "+" + nanoid(5) + "@example.com";
      const password = await argon2.hash(username + "1234");

      try {
        const user = await prisma.user.create({
          data: {
            username,
            email,
            uniqueId: nanoid(8),
            password,
            role: "USER",
            isVerified: true,
          },
        });

        // Seed 2 posts per user
        for (let j = 0; j < 2; j++) {
          const title = faker.lorem.sentence()
          const slug = createSlug(title);
    logger.info(title)
          await prisma.post.create({
            data: {
              title,
              content: faker.lorem.paragraph(),
              userId: user.userId,
              slug,
            },
          });
        }

        i++; // only increment if success
      } catch (err) {
        if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") {
          logger.warn("⚠️ Username/email duplicate, retrying...");
        } else {
          logger.error("❌ Error while creating user or posts", err);
          throw err;
        }
      }
    }

    logger.info("🎉 Seeding success!");
  } catch (error) {
    logger.error("❌ Seeding failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
