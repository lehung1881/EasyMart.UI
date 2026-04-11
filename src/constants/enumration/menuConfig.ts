export interface MenuItem {
    key: string;
    label: string;
    badge?: string;
    badgeType?: "new" | "hot";
    routeName?: string;
}

export interface MenuGroup {
    label: string;
    items: MenuItem[];
}

export const MenuGroup: MenuGroup[] = [
    {
        label: "Tổng quan",
        items: [
            { key: "dashboard", label: "Dashboard của tôi", routeName: "dashboard" },
            { key: "knowledge", label: "Kiến thức hữu ích" },
        ],
    },
    {
        label: "Bán hàng",
        items: [
            { key: "orders", label: "Đơn hàng", routeName: "sales" },
            { key: "customers", label: "Khách hàng", routeName: "customers" },
            { key: "invoices", label: "Hóa đơn", routeName: "invoices" },
            { key: "promotions", label: "Khuyến mãi", badge: "Hot", badgeType: "hot" },
        ],
    },
    {
        label: "Kho",
        items: [
            { key: "inventory", label: "Tồn kho", routeName: "inventory-balance" },
            { key: "stock", label: "Quản lý kho", routeName: "stocks" },
        ],
    },
    {
        label: "Danh mục",
        items: [
            { key: "inventory-item", label: "Hàng hóa", routeName: "inventory-items" },
            { key: "units", label: "Đơn vị tính", routeName: "units" },
            { key: "suppliers", label: "Nhà cung cấp", routeName: "suppliers" },
        ],
    },
    {
        label: "Hệ thống",
        items: [{ key: "system", label: "Quản trị hệ thống" }],
    },
];
