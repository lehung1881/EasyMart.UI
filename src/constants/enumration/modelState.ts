export const ModelState = {
    Insert: 0,
    Update: 1,
    Delete: 2,
} as const;

export const FormState = {
    Add: 0,
    Edit: 1,
} as const;

export type ModelState = (typeof ModelState)[keyof typeof ModelState];
export type FormState = (typeof FormState)[keyof typeof FormState];
