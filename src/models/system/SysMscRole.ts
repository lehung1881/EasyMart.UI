// models/system/SysMscRole.ts

import BaseModel, { type BaseFieldConfig } from "@/models/common/baseModel";
import SysMscRolePermissionMapping from "@/models/system/SysMscRolePermissionMapping.ts";

/**
 * Model vai trò trong hệ thống.
 */
export class SysMscRole extends BaseModel {
    /** Khóa chính của bảng. */
    declare RoleID: string;

    /** Mã vai trò. */
    declare RoleCode: string | null;

    /** Tên vai trò. */
    declare RoleName: string | null;

    /** Diễn giải vai trò. */
    declare Description: string | null;

    /** Loại vai trò. 1: Vai trò hệ thống, 0: Vai trò tự tạo. */
    declare IsSystem: boolean;

    /** Người tạo. */
    declare CreatedBy: string | null;

    /** Ngày tạo. */
    declare CreatedDate: string | null;

    /** Người sửa đổi. */
    declare ModifiedBy: string | null;

    /** Ngày thay đổi. */
    declare ModifiedDate: string | null;

    /** Danh sách chi tiết các quyền. */
    declare SysMscRolePermissionMapping: SysMscRolePermissionMapping[];

    constructor(data?: Partial<SysMscRole>, options: unknown = null) {
        super(data as Record<string, unknown> | undefined, options);
    }
}

SysMscRole.prototype._fields = [
    { name: "RoleID", dataType: "string", defaultValue: null, isPrimaryKey: true },
    { name: "RoleCode", dataType: "string", validateRules: [{ type: "NotNull" }] },
    { name: "RoleName", dataType: "string", validateRules: [{ type: "NotNull" }] },
    { name: "Description", dataType: "string", defaultValue: null },
    { name: "IsSystem", dataType: "bool", defaultValue: 0, validateRules: [{ type: "NotNull" }] },
    { name: "CreatedBy", dataType: "string", defaultValue: null, ignoreCheckChange: true },
    { name: "CreatedDate", dataType: "date", defaultValue: null, ignoreCheckChange: true },
    { name: "ModifiedBy", dataType: "string", defaultValue: null, ignoreCheckChange: true },
    { name: "ModifiedDate", dataType: "date", defaultValue: null, ignoreCheckChange: true },
    {
        name: "SysMscRolePermissionMapping",
        dataType: "array",
        defaultValue: [],
        isDetail: true,
        detailModel: SysMscRolePermissionMapping,
    },
] as BaseFieldConfig[];

export default SysMscRole;
