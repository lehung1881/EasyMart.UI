import BaseAPI from "@/api/baseAPI";

class SupplierAPI extends BaseAPI {
    protected readonly serviceName = "DI" as const;
    protected readonly basePath = "v1/supplier";
}

const supplierApi = new SupplierAPI();

export default supplierApi;
