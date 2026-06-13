import BaseAPI from "@/api/baseAPI";

class SalesAPI extends BaseAPI {
    protected readonly serviceName = "DI" as const;
    protected readonly basePath = "v1/order";
}

const salesApi = new SalesAPI();

export default salesApi;
