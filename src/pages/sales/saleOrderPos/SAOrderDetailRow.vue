<template>
    <tr
        :class="{ 'is-active': isSelected }"
        class="main-selected-table__row"
        @click="emit('select', orderDetail.RefDetailID)"
    >
        <td
            v-for="column in tableColumns"
            :key="column.key"
            :class="[`col-${column.key}`, `is-${column.align}`]"
            :style="{ width: column.width }"
            class="main-selected-table__col"
        >
            <!-- Serial Column -->
            <template v-if="column.key === 'serial'">
                <div class="flex items-center justify-center font-bold">
                    {{ orderDetail.SortOrder }}
                </div>
            </template>

            <!-- Product Info Column -->
            <template v-if="column.key === 'product'">
                <div class="cell-product">
                    <div class="cell-product__name">
                        {{ orderDetail.InventoryItemName }}
                    </div>
                    <div class="cell-product__code">
                        {{ orderDetail.InventoryItemCode }}
                    </div>
                </div>
            </template>

            <!-- Unit Column -->
            <template v-else-if="column.key === 'unit'">
                <BaseCombobox
                    v-model="orderDetail.UnitID"
                    :store="unitStore"
                    :autoLoad="false"
                    clearIcon
                    :initText="orderDetail.UnitName"
                    @selected="(selectedItem: any) => emit('changeColumn', column.key, orderDetail, selectedItem)"
                    @change="(selectedItem: any) => emit('changeColumn', column.key, orderDetail, selectedItem)"
                    :data-row="orderDetail"
                />
            </template>

            <!-- Quantity Column -->
            <template v-else-if="column.key === 'quantity'">
                <div class="flex justify-end">
                    <BaseInputNumber
                        v-model="orderDetail.Quantity"
                        :min="0"
                        :max-decimals="0"
                        :format-type="FormatType.Quantity"
                        @change="() => emit('changeColumn', column.key, orderDetail)"
                        class="quantity-input"
                    >
                        <template #left-icon>
                            <div class="quantity-icon icon-decrease" @click.stop="stepQuantity(orderDetail, -1)"></div>
                        </template>
                        <template #right-icon>
                            <div class="quantity-icon icon-plus" @click.stop="stepQuantity(orderDetail, 1)"></div>
                        </template>
                    </BaseInputNumber>
                </div>
            </template>

            <!-- Unit Price Column -->
            <template v-else-if="column.key === 'unit-price'">
                <BaseInputNumber
                    v-model="orderDetail.UnitPrice"
                    :min="0"
                    :format-type="FormatType.Currency"
                    @change="() => emit('changeColumn', column.key, orderDetail)"
                />
            </template>

            <!-- Amount Column -->
            <template v-else-if="column.key === 'amount'">
                <BaseInputNumber
                    v-model="orderDetail.Amount"
                    :min="0"
                    :format-type="FormatType.Currency"
                    @change="() => emit('changeColumn', column.key, orderDetail)"
                    class="input-amount"
                />
            </template>

            <!-- Actions Column -->
            <template v-else-if="column.key === 'action'">
                <div class="flex justify-end">
                    <div class="icon-trash-24" @click.stop="emit('remove', orderDetail.RefDetailID)"></div>
                </div>
            </template>
        </td>
    </tr>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import { FormatType } from "@/constants";
import type SAOrderDetail from "@/models/sales/SAOrderDetail";

export interface TableColumn {
    key: string;
    label: string;
    align: string;
    width?: string;
}

export default defineComponent({
    name: "SAOrderDetailRow",

    props: {
        /**
         * lvhung - 06.07.2026
         * Dữ liệu của một dòng sản phẩm trong đơn hàng.
         */
        orderDetail: {
            type: Object as PropType<SAOrderDetail>,
            required: true,
        },

        /**
         * lvhung - 06.07.2026
         * Cấu hình danh sách cột hiển thị trong bảng.
         */
        tableColumns: {
            type: Array as PropType<TableColumn[]>,
            required: true,
        },

        /**
         * lvhung - 06.07.2026
         * Trạng thái dòng đang được chọn hay không.
         */
        isSelected: {
            type: Boolean,
            default: false,
        },

        /**
         * lvhung - 06.07.2026
         * Store dùng cho combobox đơn vị tính.
         */
        unitStore: {
            type: Object,
            required: true,
        },
    },

    emits: {
        /**
         * lvhung - 06.07.2026
         * Emit khi người dùng click vào dòng để chọn.
         */
        select: (refDetailID: string) => true,

        /**
         * lvhung - 06.07.2026
         * Emit khi người dùng nhấn icon xóa dòng sản phẩm.
         */
        remove: (refDetailID: string) => true,

        /**
         * lvhung - 06.07.2026
         * Emit khi giá trị của một cột thay đổi (unit, quantity, unit-price, amount).
         * @param columnKey Key của cột bị thay đổi.
         * @param orderDetail Dữ liệu dòng hiện tại.
         * @param selectedItem Item được chọn từ combobox (chỉ có với cột 'unit').
         */
        changeColumn: (columnKey: string, orderDetail: SAOrderDetail, selectedItem?: any) => true,
    },

    setup(props, { emit }) {
        /**
         * lvhung - 06.07.2026
         * Tăng hoặc giảm số lượng trực tiếp lên model, sau đó emit changeColumn
         * để cha tính lại Amount. step = 1 (tăng) hoặc -1 (giảm).
         */
        function stepQuantity(orderDetail: SAOrderDetail, step: 1 | -1): void {
            const currentQty = orderDetail.Quantity ?? 0;
            const nextQty = currentQty + step;
            if (nextQty == 0) {
                emit("remove", orderDetail.RefDetailID);
            } else {
                orderDetail.Quantity = nextQty;
                emit("changeColumn", "quantity", orderDetail);
            }
        }

        return {
            emit,
            FormatType,
            stepQuantity,
        };
    },
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variable" as *;

// #region ROW & CELL
.main-selected-table__row {
    cursor: pointer;
    transition: background-color 0.15s ease;

    &:last-child td {
        border-bottom: none;
    }

    &.is-active,
    &:hover {
        background-color: #eff4fe;
    }

    :deep .base-input-number {
        border: unset;
    }
}

.main-selected-table__col {
    padding: 12px;
    border-bottom: 1px solid #eef2f7;
    vertical-align: top;

    &.is-left {
        text-align: left;
    }

    &.is-right {
        text-align: right;
    }
}
// #endregion

// #region CELL — PRODUCT
.cell-product__name {
    font-size: 14px;
    font-weight: 600;
    color: #111827;
    line-height: 1.4;
}

.cell-product__code {
    margin-top: 4px;
    font-size: 12px;
    color: #6b7280;
}
// #endregion

// #region CELL — UNIT
.col-unit {
    white-space: nowrap;
    color: #374151;
    font-size: 13px;
}
// #endregion

// #region CELL — QUANTITY
.quantity-input {
    width: 100px;

    :deep .base-input-number {
        text-align: center;
    }

    .quantity-icon {
        background-color: #e5e7eb;
        border-radius: 50%;
    }
}
// #endregion

// #region CELL — AMOUNT
.input-amount {
    :deep .base-input-number {
        font-weight: 800;
        font-size: 14px;
    }
}
// #endregion
</style>
