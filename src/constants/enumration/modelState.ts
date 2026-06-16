export const ModelState = {
    None: 0,
    Insert: 1,
    Update: 2,
    Delete: 3,
} as const;

export const FormState = {
    Add: 0,
    Edit: 1,
} as const;

export type ModelState = (typeof ModelState)[keyof typeof ModelState];
export type FormState = (typeof FormState)[keyof typeof FormState];
