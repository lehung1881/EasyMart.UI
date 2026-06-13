export interface MscSubSystem {
    SubSystemCode: string;
    ListPermission: Record<string, boolean>;
}

export const defaultSubSystem: Record<string, MscSubSystem> = {
    SAOrder: {
        SubSystemCode: "SAOrder",
        ListPermission: {
            View: false,
            Add: false,
            Edit: false,
            Delete: false,
        },
    },
    DIInventoryItem: {
        SubSystemCode: "DIInventoryItem",
        ListPermission: {
            View: false,
            Add: false,
            Edit: false,
            Delete: false,
            Export: false,
        },
    },
    DIStock: {
        SubSystemCode: "DIStock",
        ListPermission: {
            View: false,
            Add: false,
            Edit: false,
            Delete: false,
            Export: false,
        },
    },
    DICustomer: {
        SubSystemCode: "DICustomer",
        ListPermission: {
            View: false,
            Add: false,
            Edit: false,
            Delete: false,
            Export: false,
        },
    },
    DISupplier: {
        SubSystemCode: "DISupplier",
        ListPermission: {
            View: true,
            Add: false,
            Edit: false,
            Delete: false,
            Export: false,
        },
    },
};
