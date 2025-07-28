import { generateToken } from "./lib/jwt";

const jwt = await generateToken({
    email: "admin@admin.com",
    role: "ADMIN"
}, "10 year")
console.log(jwt)