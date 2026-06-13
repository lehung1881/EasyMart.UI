import BaseAPI from "@/api/baseAPI";

class UnitAPI extends BaseAPI {
    protected readonly serviceName = "BUSINESS" as const;
    protected readonly basePath = "v1/unit";
}

export default new UnitAPI();
