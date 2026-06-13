import BaseAPI from "@/api/baseAPI";

class StockAPI extends BaseAPI {
    protected readonly serviceName = "BUSINESS" as const;
    protected readonly basePath = "v1/stock";
}

export default new StockAPI();
