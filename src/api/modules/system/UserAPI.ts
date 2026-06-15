import BaseAPI from "@/api/baseAPI";

class UserAPI extends BaseAPI {
    protected readonly serviceName = "BUSINESS" as const;
    protected readonly basePath = "v1/user";
}

export default new UserAPI();
