export const ModelState = {
    Insert: 0,
    Update: 1,
    Delete: 2,
} as const;

export type ModelState = (typeof ModelState)[keyof typeof ModelState];
