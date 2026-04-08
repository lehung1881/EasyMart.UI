import BaseAPI from "@/api/baseAPI";

class UnitAPI extends BaseAPI {
    protected readonly serviceName = "DI" as const;
    protected readonly basePath = "v1/unit";
}

const unitApi = new UnitAPI();

export default unitApi;
