import BaseAPI from "@/api/baseAPI";

class CustomerAPI extends BaseAPI {
    protected readonly serviceName = "DI" as const;
    protected readonly basePath = "v1/customer";
}

const customerApi = new CustomerAPI();

export default customerApi;
