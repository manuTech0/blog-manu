import argon2 from 'argon2';
let password = "Admin123456^&^8"

const secret = process.env.ARGON2_SECRET
console.log(secret)
console.log((await argon2.hash(password, {
    secret: Buffer.from(secret || "secret")
})))

console.log((await argon2.verify("$argon2id$v=19$m=65536,t=3,p=4$MGqkqIJxhPDrTOoBbswYjg$dP/EA+jvx8JHS8YsjCyDywZGjsYrnNtfb7zC4lm+99Y", password, {
    secret: Buffer.from("secret")
})))