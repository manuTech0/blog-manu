import argon2 from 'argon2';
import { faker } from "@faker-js/faker"
import slugify from "slugify"
import { generateUniqueId } from './generateId';
import prisma from './prisma';
import { Role, User } from './generated/prisma';

async function fakerGeneratorUser(count: number = 5) {
    const noHashPasword = faker.internet.password()
    const password = await argon2.hash(noHashPasword)
    const random11Digit = faker.number.int({ min: 1_000_000_000, max: 9_999_999_999 })
    return Array.from({ length: count }, () => ({
        username: faker.internet.username() + "_" + faker.string.uuid().slice(0, 6),
        email: faker.string.uuid().slice(0, 6) + faker.internet.email({ allowSpecialCharacters: false }),
        password: password,
        role: Role.USER,
        isVerified: true,
        uniqueId: "UID-" + String(Date.now()).slice(2)
    }))
}

async function fakerGeneratorPost(userId: number, count: number = 2) {
    const title = faker.lorem.sentence({min: 10, max: 120})
    return Array.from({ length: count * 2 }, () => ({
        title: title + "_" + faker.string.uuid().slice(0, 6),
        slug: slugify(title, {
            lower: true,
            strict: true,
            locale:  "id",
            trim: true,
        }),
        content: faker.lorem.paragraphs(6),
        userId: userId
    }))
}

export default async function genearteFaker() {
    const userData = await fakerGeneratorUser()

    const responses = await prisma.user.createManyAndReturn({
        data: userData
    })
    let postData: Awaited<ReturnType<typeof fakerGeneratorPost>> = Array(10)
    for (const res of responses) {
        postData = await fakerGeneratorPost(res.userId) 
    }
    const res = await prisma.post.createManyAndReturn({
        data: postData,
        include: {
            user: true
        }
    })
    return {
        user: responses,
        post: res
    }
}

if(process.env.NODE_ENV == "development") {
    const res = await genearteFaker()
    console.log((res))
}