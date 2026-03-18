export interface ValidateResult {
    Field: string;
    Message: string;
}

export interface ServiceResponse<T = any> {
    Success: boolean;
    ResponseCode: number;
    Message: string | null;
    SystemMessage: string | null;
    ErrorMessage: unknown | null;
    Data: T;
    ValidateInfo: ValidateResult[] | null;
}