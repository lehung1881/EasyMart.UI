import BaseAPI from "@/api/baseAPI";

class RoleAPI extends BaseAPI {
    protected readonly serviceName = "BUSINESS" as const;
    protected readonly basePath = "v1/role";
}

export default new RoleAPI();
