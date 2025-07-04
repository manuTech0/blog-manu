import { User } from "./generated/prisma"

export function generateUniqueId(users: User[], userId: number): string {
    const now: Date = new Date()

    const start: Date = new Date(now.getFullYear(), 0, 0)
    const dayOfYear: number = Math.floor((+now - +start) / (1000 * 60 * 60 * 24))
    const ddd: string = dayOfYear.toString().padStart(3, '0')

    const index: number = users.findIndex(item => item.userId === userId) || userId

    const nnnnn: string = index.toString().padStart(3, '1')

    const ttt: string = ((Number(now.getFullYear()) * 58) % 1000).toString()

    return `UID-${ddd}${ttt}${nnnnn}`
}