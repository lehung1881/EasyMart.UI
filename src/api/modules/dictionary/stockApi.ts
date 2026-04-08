import BaseAPI from "@/api/baseAPI";

class StockAPI extends BaseAPI {
    protected readonly serviceName = "DI" as const;
    protected readonly basePath = "v1/stock";
}

const stockApi = new StockAPI();

export default stockApi;
