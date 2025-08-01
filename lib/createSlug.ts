import slugify from "slugify";

export function createSlug(text: string): string {
    return slugify(text, {
        lower: true,
        strict: true,
        locale:  "id",
        trim: true,
    })
}