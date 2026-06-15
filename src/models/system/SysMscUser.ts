// models/system/SysMscUser.ts

import BaseModel, { type BaseFieldConfig } from "@/models/common/baseModel";

/**
 * Model quản lý người dùng.
 */
export class SysMscUser extends BaseModel {
    /** Khóa chính, tương ứng user_id bên AMIS. */
    declare UserID: string;

    /** Trạng thái hoạt động. 1: Ngừng hoạt động, 0: Hoạt động. */
    declare Status: number;

    declare Gender: number;

    /** Tên đầy đủ người dùng. */
    declare FullName: string | null;

    /** Email người dùng. */
    declare Email: string | null;

    /** Số điện thoại người dùng. */
    declare MobilePhone: string | null;

    /** ID vai trò. */
    declare RoleID: string | null;

    /** Mã vai trò. */
    declare RoleCode: string | null;

    /** Tên vai trò. */
    declare RoleName: string | null;

    declare IsSystem: boolean;

    /** Người tạo. */
    declare CreatedBy: string | null;

    /** Ngày tạo. */
    declare CreatedDate: string | null;

    /** Người sửa đổi. */
    declare ModifiedBy: string | null;

    /** Ngày thay đổi. */
    declare ModifiedDate: string | null;

    constructor(data?: Partial<SysMscUser>, options: unknown = null) {
        super(data as Record<string, unknown> | undefined, options);
    }
}

SysMscUser.prototype._fields = [
    { name: "UserID", dataType: "string", defaultValue: null, isPrimaryKey: true },
    { name: "Status", dataType: "number", defaultValue: 0 },
    { name: "Gender", dataType: "number", defaultValue: 0 },
    { name: "FullName", dataType: "string", defaultValue: null },
    { name: "Email", dataType: "string", defaultValue: null },
    { name: "MobilePhone", dataType: "string", defaultValue: null },
    { name: "RoleID", dataType: "string", defaultValue: null },
    { name: "RoleCode", dataType: "string" },
    { name: "RoleName", dataType: "string" },
    { name: "IsSystem", dataType: "bool", defaultValue: 0 },
    { name: "CreatedBy", dataType: "string", defaultValue: null },
    { name: "CreatedDate", dataType: "string", defaultValue: null },
    { name: "ModifiedBy", dataType: "string", defaultValue: null },
    { name: "ModifiedDate", dataType: "string", defaultValue: null },
] as BaseFieldConfig[];

export default SysMscUser;
