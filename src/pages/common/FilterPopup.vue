<template>
    <BasePopup width="760px" :show-icon-close="true" :params="params" title="Lọc nâng cao" @beforeOpen="beforeOpen">
        <template #content>
            <div class="filter-popup">
                <div v-for="(row, index) in filterRows" :key="row.id" class="filter-popup__row">
                    <BaseInput v-if="index === 0" model-value="LỌC THEO" readonly class="filter-popup__label" />
                    <BaseCombobox
                        v-else
                        v-model="row.connector"
                        :store="connectorStore"
                        :searchable="false"
                        class="filter-popup__connector"
                    />

                    <BaseCombobox
                        v-model="row.field"
                        :store="fieldStore"
                        :searchable="false"
                        class="filter-popup__field"
                        @selected="applyFieldDefault(row)"
                        @change="applyFieldDefault(row)"
                    />

                    <BaseCombobox
                        v-model="row.operator"
                        :store="operatorStore"
                        :searchable="false"
                        class="filter-popup__operator"
                    />

                    <BaseInput
                        v-if="isTextField(row)"
                        v-model="row.value"
                        class="filter-popup__value"
                        placeholder="Nhập giá trị"
                    />
                    <BaseInputNumber
                        v-else-if="isNumberField(row)"
                        v-model="row.value"
                        class="filter-popup__value"
                        placeholder="Nhập giá trị"
                    />
                    <BaseDatepicker v-else-if="isDateField(row)" v-model="row.value" class="filter-popup__value" />
                    <BaseInput v-else v-model="row.value" class="filter-popup__value" placeholder="Nhập giá trị" />

                    <div class="filter-popup__actions">
                        <BaseButton
                            size="sm"
                            variant="normal"
                            class="filter-popup__action-button filter-popup__action-button--remove"
                            :disabled="filterRows.length === 1"
                            @click="removeRow(index)"
                        >
                            -
                        </BaseButton>
                        <BaseButton
                            size="sm"
                            variant="normal"
                            class="filter-popup__action-button filter-popup__action-button--add"
                            @click="addRow(index)"
                        >
                            +
                        </BaseButton>
                    </div>
                </div>
            </div>
        </template>

        <template #footer="{ close }">
            <div class="filter-popup__footer">
                <BaseButton size="md" @click="handleReset">Bỏ lọc</BaseButton>
                <BaseButton size="md" variant="primary" @click="handleApply(close)">Áp dụng</BaseButton>
            </div>
        </template>
    </BasePopup>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import BasePopup from "@/components/popup/BasePopup.vue";
import { useComboboxStore } from "@/composables/controls/useComboboxStore";
import { ColumnType, FilterOperator } from "@/constants";
import type { ColumnDefinition } from "@/models/common/columnDefinition";

type FilterConnector = "AND" | "OR";
type FilterFieldType = "string" | "number" | "date";

interface FilterRow {
    id: string;
    connector: FilterConnector | "";
    field: string | number | null;
    operator: string | number | null;
    value: string | number | Date | null;
}

interface FilterFieldOption {
    Text: string;
    Value: string;
    Type: FilterFieldType;
}

interface FilterPopupParams {
    columns?: ColumnDefinition[];
    rows?: FilterRow[];
    onApply?: (payload: { rows: FilterRow[] }) => void;
    onReset?: () => void;
    onClose?: () => void;
}

interface Props {
    params?: FilterPopupParams;
}

const props = withDefaults(defineProps<Props>(), {
    params: () => ({}),
});

const emit = defineEmits<{
    (event: "beforeOpen", payload: any): void;
}>();

const columns = computed(() => props.params?.columns ?? []);

const filterRows = ref<FilterRow[]>();
const fieldTypes = ref<Map<string, FilterFieldType>>(new Map());

const fieldStore = useComboboxStore("filter_popup_fields", {
    queryMode: "local",
    data: columns.value,
    displayField: "title",
    valueField: "dataField",
    searchField: ["title"],
});

const operatorStore = useComboboxStore("filter_popup_operators", {
    queryMode: "local",
    data: [
        { Text: "Chứa", Value: FilterOperator.Contains },
        { Text: "Bằng", Value: FilterOperator.Equal },
        { Text: "Khác", Value: FilterOperator.NotEqual },
        { Text: "Lớn hơn", Value: FilterOperator.GreaterThan },
        { Text: "Lớn hơn hoặc bằng", Value: FilterOperator.GreaterThanOrEqual },
        { Text: "Nhỏ hơn", Value: FilterOperator.LessThan },
        { Text: "Nhỏ hơn hoặc bằng", Value: FilterOperator.LessThanOrEqual },
    ],
    displayField: "Text",
    valueField: "Value",
    searchField: ["Text"],
});

const connectorStore = useComboboxStore("filter_popup_connectors", {
    queryMode: "local",
    data: [
        { Text: "Và", Value: "AND" },
        { Text: "Hoặc", Value: "OR" },
    ],
    displayField: "Text",
    valueField: "Value",
    searchField: ["Text"],
});

/**
 * Tạo danh sách dòng lọc mặc định.
 * @returns Mảng dòng lọc khởi tạo.
 */
const createDefaultRows = (): FilterRow[] => [createEmptyRow(false)];

/**
 * Tạo một dòng lọc rỗng.
 * @param withConnector Cho biết dòng có connector hay không.
 * @returns Một dòng filter mới.
 */
const createEmptyRow = (withConnector: boolean): FilterRow => ({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    connector: withConnector ? "AND" : "",
    field: null,
    operator: null,
    value: null,
});

/**
 * Suy luận kiểu dữ liệu từ cấu hình cột.
 * @param column Cấu hình cột.
 * @returns Kiểu dữ liệu phục vụ render control.
 */
const resolveColumnType = (column: ColumnDefinition): FilterFieldType => {
    if (column.columnType === ColumnType.InputNumber || column.formatType != null) {
        return "number";
    }

    if (column.columnType === ColumnType.DatePicker) {
        return "date";
    }

    const typeName = `${column.type ?? ""}`.toLowerCase();
    if (typeName.includes("date")) return "date";
    if (
        typeName.includes("number") ||
        typeName.includes("int") ||
        typeName.includes("decimal") ||
        typeName.includes("float")
    ) {
        return "number";
    }

    return "string";
};

/**
 * Lấy kiểu dữ liệu của field hiện tại.
 * @param row Dòng filter cần kiểm tra.
 * @returns Kiểu field suy luận từ cột.
 */
const getRowType = (row: FilterRow): FilterFieldType => fieldTypes.value.get(`${row.field ?? ""}`) ?? "string";

/**
 * Kiểm tra dòng filter có phải text hay không.
 * @param row Dòng filter cần kiểm tra.
 * @returns `true` nếu là text.
 */
const isTextField = (row: FilterRow): boolean => getRowType(row) === "string";

/**
 * Kiểm tra dòng filter có phải số hay không.
 * @param row Dòng filter cần kiểm tra.
 * @returns `true` nếu là số.
 */
const isNumberField = (row: FilterRow): boolean => getRowType(row) === "number";

/**
 * Kiểm tra dòng filter có phải ngày hay không.
 * @param row Dòng filter cần kiểm tra.
 * @returns `true` nếu là ngày.
 */
const isDateField = (row: FilterRow): boolean => getRowType(row) === "date";

/**
 * Gán toán tử và xóa giá trị khi field thay đổi.
 * @param row Dòng filter cần đồng bộ.
 * @returns Không trả về giá trị.
 */
const applyFieldDefault = (row: FilterRow): void => {
    const fieldType = getRowType(row);
    row.operator = fieldType === "string" ? FilterOperator.Contains : FilterOperator.Equal;
    row.value = null;
};

/**
 * Thêm dòng mới ngay sau dòng hiện tại.
 * @param index Vị trí dòng hiện tại.
 * @returns Không trả về giá trị.
 */
const addRow = (index: number): void => {
    filterRows.value.splice(index + 1, 0, createEmptyRow(true));
};

/**
 * Xóa một dòng khỏi danh sách.
 * @param index Vị trí dòng cần xóa.
 * @returns Không trả về giá trị.
 */
const removeRow = (index: number): void => {
    if (filterRows.value.length === 1) {
        filterRows.value[0] = createEmptyRow(false);
        return;
    }

    filterRows.value.splice(index, 1);
    if (filterRows.value.length > 0) {
        filterRows.value[0].connector = "";
    }
};

/**
 * Đồng bộ dữ liệu khởi tạo từ params.
 * @param payload Dữ liệu nhận từ popup service.
 * @returns Không trả về giá trị.
 */
const syncFromParams = (payload: FilterPopupParams | undefined): void => {
    const rows = payload?.rows?.length ? payload.rows : createDefaultRows();
    filterRows.value = rows.map((row, index) => ({
        id: row.id || `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
        connector: index === 0 ? "" : row.connector || "AND",
        field: row.field ?? null,
        operator: row.operator ?? null,
        value: row.value ?? null,
    }));
};

/**
 * Khởi tạo popup trước khi hiển thị.
 * @param payload Dữ liệu hook từ BasePopup.
 * @returns Không trả về giá trị.
 */
const beforeOpen = (payload: any): void => {
    syncFromParams(payload?.params as FilterPopupParams);
    emit("beforeOpen", payload);
};

/**
 * Reset toàn bộ filter.
 * @returns Không trả về giá trị.
 */
const handleReset = (): void => {
    filterRows.value = createDefaultRows();
    props.params?.onReset?.();
};

/**
 * Chuẩn hóa giá trị để trả ra ngoài.
 * @param value Giá trị trong row.
 * @returns Giá trị đã chuẩn hóa.
 */
const normalizeValue = (value: string | number | Date | null): string | number | null => {
    if (value instanceof Date) {
        const year = value.getFullYear();
        const month = `${value.getMonth() + 1}`.padStart(2, "0");
        const day = `${value.getDate()}`.padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    return value;
};

/**
 * Áp dụng bộ lọc và đóng popup.
 * @param close Hàm đóng popup từ BasePopup.
 * @returns Không trả về giá trị.
 */
const handleApply = (close: () => void): void => {
    const rows = filterRows.value
        .filter((row) => row.field !== null && row.operator !== null && row.value !== null && row.value !== "")
        .map((row) => ({
            ...row,
            value: normalizeValue(row.value),
        }));

    props.params?.onApply?.({ rows });
    close();
};

watch(
    () => props.params,
    (value) => {
        syncFromParams(value);
    },
    { immediate: true, deep: true },
);
</script>

<style scoped lang="scss">
@use "@/assets/styles/variable" as *;

.filter-popup {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.filter-popup__row {
    display: grid;
    grid-template-columns: 100px minmax(180px, 1.25fr) minmax(140px, 0.9fr) minmax(180px, 1.2fr) 64px;
    gap: 12px;
    align-items: end;
}

.filter-popup__label,
.filter-popup__connector,
.filter-popup__field,
.filter-popup__operator,
.filter-popup__value {
    width: 100%;
}

.filter-popup__actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}

.filter-popup__action-button {
    min-width: 28px;
    padding: 0;
}

.filter-popup__action-button--remove {
    color: #dc2626;
}

.filter-popup__action-button--add {
    color: #16a34a;
}

.filter-popup__footer {
    display: flex;
    justify-content: space-between;
    gap: 8px;
}

@media (max-width: 900px) {
    .filter-popup__row {
        grid-template-columns: 1fr;
    }

    .filter-popup__actions {
        justify-content: flex-start;
    }
}
</style>
