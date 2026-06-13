import BaseAPI from "@/api/baseAPI";

class InventoryItemAPI extends BaseAPI {
    protected readonly serviceName = "BUSINESS" as const;
    protected readonly basePath = "v1/inventory_item";
}

const inventoryItemApi = new InventoryItemAPI();

export default inventoryItemApi;
