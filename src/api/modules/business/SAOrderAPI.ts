import BaseAPI from "@/api/baseAPI";

class SAOrderAPI extends BaseAPI {
    protected readonly serviceName = "BUSINESS" as const;
    protected readonly basePath = "v1/order";
}

export default new SAOrderAPI();
