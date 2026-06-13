export interface MscSubSystem {
    SortOrder: number;
    SubSystemCode: string;
    ListPermission: Record<string, boolean>; // map of permission actions
}

export const defaultSubSystem: MscSubSystem[] = [
    {
        SortOrder: 1,
        SubSystemCode: "SAOrder",
        ListPermission: {
            View: false,
            Add: false,
            Edit: false,
            Delete: false,
        },
    },
    {
        SortOrder: 2,
        SubSystemCode: "DIInventoryItem",
        ListPermission: {
            View: false,
            Add: false,
            Edit: false,
            Delete: false,
            Export: false,
        },
    },
    {
        SortOrder: 3,
        SubSystemCode: "DICustomer",
        ListPermission: {
            View: false,
            Add: false,
            Edit: false,
            Delete: false,
            Export: false,
        },
    },
    {
        SortOrder: 3,
        SubSystemCode: "DIVendor",
        ListPermission: {
            View: false,
            Add: false,
            Edit: false,
            Delete: false,
            Export: false,
        },
    },
    {
        SortOrder: 3,
        SubSystemCode: "DIStock",
        ListPermission: {
            View: false,
            Add: false,
            Edit: false,
            Delete: false,
            Export: false,
        },
    },
];
