// models/system/SysMscRolePermissionMapping.ts

import BaseModel, { type BaseFieldConfig } from "@/models/common/baseModel";

/**
 * Model mapping giữa vai trò và quyền.
 */
export class SysMscRolePermissionMapping extends BaseModel {
    /** Khóa chính của bảng. */
    declare ID: string;

    /** Khóa ngoại liên kết bảng sys_msc_role. */
    declare RoleID: string;

    /** Mã màn hình. */
    declare SubSystemCode: string | null;

    /** Danh sách các quyền ở màn hình này. */
    declare ListPermission: string | null;

    /** Danh sách các quyền đã được parse (computed property từ server). */
    declare ListPermissionObject: Record<string, boolean>;

    /** Người tạo. */
    declare CreatedBy: string | null;

    /** Ngày tạo. */
    declare CreatedDate: string | null;

    /** Người sửa đổi. */
    declare ModifiedBy: string | null;

    /** Ngày thay đổi. */
    declare ModifiedDate: string | null;

    constructor(data?: Partial<SysMscRolePermissionMapping>, options: unknown = null) {
        super(data as Record<string, unknown> | undefined, options);
    }
}

SysMscRolePermissionMapping.prototype._fields = [
    { name: "ID", dataType: "string", defaultValue: null, isPrimaryKey: true },
    { name: "RoleID", dataType: "string", defaultValue: null, validateRules: [{ type: "NotNull" }] },
    { name: "SubSystemCode", dataType: "string", defaultValue: null },
    { name: "ListPermission", dataType: "string", defaultValue: null },
    { name: "ListPermissionObject", dataType: "object", defaultValue: null },
    { name: "CreatedBy", dataType: "string", defaultValue: null },
    { name: "CreatedDate", dataType: "string", defaultValue: null },
    { name: "ModifiedBy", dataType: "string", defaultValue: null },
    { name: "ModifiedDate", dataType: "string", defaultValue: null },
] as BaseFieldConfig[];

export default SysMscRolePermissionMapping;
