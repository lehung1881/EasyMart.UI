// models/system/SysMscUserRole.ts

import BaseModel, { type BaseFieldConfig } from "@/models/common/baseModel";

/**
 * Model mapping giữa người dùng và vai trò.
 */
export class SysMscUserRole extends BaseModel {
    /** Khóa chính của bảng. */
    declare UserRoleID: string;

    /** Khóa ngoại liên kết bảng sys_msc_user. */
    declare UserID: string;

    /** Khóa ngoại liên kết bảng sys_msc_role. */
    declare RoleID: string;

    constructor(data?: Partial<SysMscUserRole>, options: unknown = null) {
        super(data as Record<string, unknown> | undefined, options);
    }
}

SysMscUserRole.prototype._fields = [
    { name: "UserRoleID", dataType: "string", defaultValue: null, isPrimaryKey: true },
    { name: "UserID", dataType: "string", defaultValue: null, validateRules: [{ type: "NotNull" }] },
    { name: "RoleID", dataType: "string", defaultValue: null, validateRules: [{ type: "NotNull" }] },
] as BaseFieldConfig[];

export default SysMscUserRole;
