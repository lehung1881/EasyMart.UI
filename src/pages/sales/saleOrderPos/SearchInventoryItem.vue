<template>
    <div class="pos-item-search-container">
        <div class="search-input-wrapper">
            <div class="icon-search"></div>
            <input
                class="search-input"
                ref="searchInputRef"
                v-model="searchQuery"
                type="text"
                placeholder="Nhập mã hàng, tên hàng hoặc quét mã vạch (F4)"
                @input="handleInput"
                @keydown.down.prevent="moveDown"
                @keydown.up.prevent="moveUp"
                @keydown.enter.prevent="selectCurrentItem"
                @keydown.escape="clearSearch"
            />
            <div class="icon-scan"></div>
            <div v-if="isLoading" class="spinner"></div>
        </div>

        <div v-if="isOpenDropdown" class="search-dropdown">
            <div v-if="searchResults.length === 0 && !isLoading" class="search-dropdown__empty">
                Không tìm thấy sản phẩm phù hợp
            </div>

            <ul v-else-if="searchResults.length > 0" class="search-dropdown__list" @scroll="handleDropdownScroll">
                <li
                    v-for="(item, index) in searchResults"
                    :key="item.InventoryItemID"
                    class="search-dropdown__item"
                    :class="{ 'is-active': index === activeIndex }"
                    :ref="(element) => setItemRef(element, index)"
                    @click="selectItem(item)"
                    @mouseenter="activeIndex = index"
                >
                    <div class="search-dropdown__thumb">
                        <img :src="getItemImage(item)" :alt="item.InventoryItemName" />
                    </div>
                    <div class="search-dropdown__content">
                        <div class="search-dropdown__info">
                            <span class="search-dropdown__name">{{ item.InventoryItemName }}</span>
                            <span class="search-dropdown__sku">SKU: {{ item.InventoryItemCode }}</span>
                        </div>
                        <div class="search-dropdown__meta">
                            <span class="search-dropdown__price">{{ formatPrice(item.SellPrice) }}</span>
                            <span class="search-dropdown__stock" :class="{ 'is-out-stock': item.MinimumStock <= 0 }">
                                Tồn: {{ item.MinimumStock }}
                            </span>
                        </div>
                    </div>
                </li>

                <li v-if="isLoadingMore" class="search-dropdown__loading">Đang tải thêm...</li>
            </ul>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted, nextTick } from "vue";
import { DataType, FilterOperator } from "@/constants";
import inventoryItemApi from "@/api/modules/dictionary/inventoryItemAPI";
import { FilterNodeType, LogicalOperator, type PagingRequest, type PagingResponse } from "@/models/common/paging";
import type { ServiceResponse } from "@/models/common/serviceResponse";
import defaultImageUrl from "@/assets/images/image_default.png";
import type InventoryItemModel from "@/models/dictionary/inventoryItem";

export default defineComponent({
    name: "SearchInventoryItem",
    emits: ["select-item"],
    setup(_, { emit }) {
        const searchQuery = ref("");
        const searchResults = ref<InventoryItemModel[]>([]);
        const isLoading = ref(false);
        const isLoadingMore = ref(false);
        const isOpenDropdown = ref(false);
        const activeIndex = ref(-1);
        const searchInputRef = ref<HTMLInputElement | null>(null);
        const currentPage = ref(1);
        const hasMore = ref(false);
        const currentKeyword = ref("");
        const itemRefs = ref<Array<HTMLElement | null>>([]);
        let debounceTimer: ReturnType<typeof setTimeout> | null = null;

        /**
         * Tạo payload phân trang cho API tìm kiếm hàng hóa.
         * @param keyword Từ khóa người dùng nhập.
         * @returns Payload gửi lên `paging_combobox`.
         */
        const buildSearchPayload = (keyword: string): PagingRequest => {
            return {
                PageIndex: currentPage.value,
                PageSize: 20,
                Sort: [],
                Filter: {
                    NodeType: FilterNodeType.Group,
                    LogicalOperator: LogicalOperator.Or,
                    Children: [
                        {
                            NodeType: FilterNodeType.Condition,
                            Property: "InventoryItemCode",
                            Operator: FilterOperator.Contains,
                            Value: keyword,
                            DataType: DataType.String,
                        },
                        {
                            NodeType: FilterNodeType.Condition,
                            Property: "InventoryItemName",
                            Operator: FilterOperator.Contains,
                            Value: keyword,
                            DataType: DataType.String,
                        },
                    ],
                },
                Columns: "*",
                ViewOrTableName: "di_inventory_item",
                SelectedValue: null,
            };
        };

        /**
         * Gọi API tìm kiếm hàng hóa theo keyword.
         * @param keyword Từ khóa cần tìm.
         * @returns Danh sách hàng hóa trả về trực tiếp từ API.
         */
        const searchInventoryItems = async (keyword: string): Promise<any> => {
            const payload = buildSearchPayload(keyword);
            const response = (await inventoryItemApi.getPagingCombobox(payload)) as ServiceResponse<
                PagingResponse<any>
            >;

            const pageData = response.Data?.PageData ?? [];
            const total = response.Data?.Total ?? 0;

            // Cập nhật payload.pageSize thành payload.PageSize
            hasMore.value = currentPage.value * payload.PageSize < total || pageData.length >= payload.PageSize;

            return pageData;
        };

        /**
         * Lấy ảnh hiển thị cho từng sản phẩm.
         * @param item Sản phẩm cần lấy ảnh.
         * @returns URL ảnh của sản phẩm hoặc ảnh mặc định.
         */
        const getItemImage = (item: any): string => {
            return item.ImageUrl || defaultImageUrl;
        };

        /**
         * Lưu reference DOM của từng item trong danh sách dropdown.
         * @param element Phần tử DOM của item.
         * @param index Vị trí của item trong mảng.
         * @returns Không trả về giá trị.
         */
        const setItemRef = (element: unknown, index: number) => {
            itemRefs.value[index] = element instanceof HTMLElement ? element : null;
        };

        /**
         * Đưa item đang active vào trong vùng nhìn thấy của dropdown.
         * @returns Không trả về giá trị.
         */
        const scrollActiveItemIntoView = async () => {
            await nextTick();
            const activeElement = itemRefs.value[activeIndex.value];
            activeElement?.scrollIntoView({ block: "nearest" });
        };

        /**
         * Xử lý khi người dùng nhập liệu vào ô tìm kiếm.
         * @returns Không trả về giá trị.
         */
        const handleInput = () => {
            isOpenDropdown.value = true;
            activeIndex.value = -1;
            currentPage.value = 1;
            hasMore.value = false;
            currentKeyword.value = searchQuery.value.trim();
            itemRefs.value = [];

            if (!currentKeyword.value) {
                searchResults.value = [];
                isOpenDropdown.value = false;
                return;
            }

            if (debounceTimer) clearTimeout(debounceTimer);
            isLoading.value = true;

            debounceTimer = setTimeout(async () => {
                try {
                    searchResults.value = await searchInventoryItems(currentKeyword.value);
                } catch (error) {
                    console.error("Lỗi tìm kiếm:", error);
                    searchResults.value = [];
                } finally {
                    isLoading.value = false;
                }
            }, 300);
        };

        /**
         * Tải thêm page tiếp theo khi cuộn tới cuối danh sách.
         * @returns Không trả về giá trị.
         */
        const loadNextPage = async () => {
            if (isLoading.value || isLoadingMore.value || !hasMore.value || !currentKeyword.value) return;

            isLoadingMore.value = true;
            currentPage.value += 1;

            try {
                const nextItems = await searchInventoryItems(currentKeyword.value);
                searchResults.value = [...searchResults.value, ...nextItems];
            } catch (error) {
                console.error("Lỗi tải thêm dữ liệu:", error);
                currentPage.value = Math.max(1, currentPage.value - 1);
            } finally {
                isLoadingMore.value = false;
            }
        };

        /**
         * Xử lý cuộn trong dropdown để tự động load thêm dữ liệu.
         * @param event Sự kiện scroll.
         * @returns Không trả về giá trị.
         */
        const handleDropdownScroll = (event: Event) => {
            const target = event.target as HTMLElement | null;
            if (!target) return;

            const threshold = 24;
            const reachedBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - threshold;
            if (reachedBottom) {
                loadNextPage();
            }
        };

        /**
         * Di chuyển xuống trong danh sách gợi ý.
         * @returns Không trả về giá trị.
         */
        const moveDown = () => {
            if (!isOpenDropdown.value || searchResults.value.length === 0) return;
            if (activeIndex.value < searchResults.value.length - 1) {
                activeIndex.value++;
            } else {
                activeIndex.value = 0;
            }
            scrollActiveItemIntoView();
        };

        /**
         * Di chuyển lên trong danh sách gợi ý.
         * @returns Không trả về giá trị.
         */
        const moveUp = () => {
            if (!isOpenDropdown.value || searchResults.value.length === 0) return;
            if (activeIndex.value > 0) {
                activeIndex.value--;
            } else {
                activeIndex.value = searchResults.value.length - 1;
            }
            scrollActiveItemIntoView();
        };

        /**
         * Chọn sản phẩm đang được focus bằng phím Enter.
         * @returns Không trả về giá trị.
         */
        const selectCurrentItem = () => {
            if (activeIndex.value >= 0 && activeIndex.value < searchResults.value.length) {
                const selectedItem = searchResults.value[activeIndex.value];
                if (selectedItem) {
                    selectItem(selectedItem);
                }
            }
        };

        /**
         * Chọn một sản phẩm từ danh sách gợi ý.
         * @param item Sản phẩm được chọn.
         * @returns Không trả về giá trị.
         */
        const selectItem = (item: any) => {
            emit("select-item", item);
            clearSearch();
        };

        /**
         * Xóa nội dung tìm kiếm và đóng dropdown.
         * @returns Không trả về giá trị.
         */
        const clearSearch = () => {
            searchQuery.value = "";
            searchResults.value = [];
            isOpenDropdown.value = false;
            activeIndex.value = -1;
            currentPage.value = 1;
            hasMore.value = false;
            currentKeyword.value = "";
            searchInputRef.value?.focus();
        };

        /**
         * Định dạng giá tiền sang VNĐ.
         * @param value Giá trị cần định dạng.
         * @returns Chuỗi tiền tệ đã định dạng.
         */
        const formatPrice = (value: number) => {
            return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
        };

        /**
         * Bắt phím tắt toàn cục để focus vào ô tìm kiếm.
         * @param event Sự kiện bàn phím.
         * @returns Không trả về giá trị.
         */
        const handleGlobalKeyDown = (event: KeyboardEvent) => {
            if (event.key === "F4") {
                event.preventDefault();
                searchInputRef.value?.focus();
            }
        };

        onMounted(() => {
            window.addEventListener("keydown", handleGlobalKeyDown);
        });

        onUnmounted(() => {
            window.removeEventListener("keydown", handleGlobalKeyDown);
            if (debounceTimer) clearTimeout(debounceTimer);
        });

        return {
            searchQuery,
            searchResults,
            isLoading,
            isLoadingMore,
            isOpenDropdown,
            activeIndex,
            searchInputRef,
            handleInput,
            handleDropdownScroll,
            moveDown,
            moveUp,
            selectCurrentItem,
            selectItem,
            clearSearch,
            formatPrice,
            getItemImage,
            setItemRef,
        };
    },
});
</script>

<style scoped lang="scss">
@use "@/assets/styles/variable" as *;

.pos-item-search-container {
    position: relative;
    width: 100%;
}

.search-input-wrapper {
    display: flex;
    align-items: center;
    position: relative;
    border: $input-border;
    border-radius: 8px;
    padding: 6px 8px;
    background: #fff;

    &:focus-within {
        border-color: $primary-color;
    }
}

.search-input-wrapper .search-input {
    border: none;
    outline: none;
    width: 100%;
    margin-left: 12px;
    font-size: 14px;
}

.btn-clear {
    border: none;
    background: transparent;
    cursor: pointer;
    color: #999;
}

.search-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: #fff;
    max-height: 544px;
    overflow: hidden;
    z-index: 999;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    border: 1px solid #e5e7eb;
}

.search-dropdown__list {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 544px;
    overflow-y: auto;
}

.search-dropdown__list::-webkit-scrollbar {
    width: 8px;
}

.search-dropdown__list::-webkit-scrollbar-track {
    background: transparent;
}

.search-dropdown__list::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 999px;
}

.search-dropdown__list::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
}

.search-dropdown__item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-bottom: 1px solid #f1f5f9;
    cursor: pointer;
    transition:
        background-color 0.15s ease,
        color 0.15s ease;

    &:last-child {
        border-bottom: none;
    }

    &:hover {
        background-color: #f8fafc;
    }
}

.search-dropdown__item.is-active {
    background-color: #e0f2fe;
}

.search-dropdown__thumb {
    flex: 0 0 44px;
    width: 44px;
    height: 44px;
    border-radius: 8px;
    overflow: hidden;
    background: #f3f4f6;

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }
}

.search-dropdown__content {
    flex: 1;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    min-width: 0;
}

.search-dropdown__info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 4px;
    min-width: 0;
}

.search-dropdown__meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: flex-start;
    gap: 4px;
    flex: 0 0 auto;
}

.search-dropdown__name {
    font-weight: bold;
    color: #111827;
    line-height: 1.2;
    word-break: break-word;
}

.search-dropdown__sku,
.search-dropdown__stock {
    font-size: 12px;
    color: #666;
}

.search-dropdown__price {
    color: #e11d48;
    font-weight: bold;
}

.is-out-stock {
    color: #dc2626;
}

.search-dropdown__empty {
    padding: 15px;
    text-align: center;
    color: #666;
}

.search-dropdown__loading {
    padding: 10px 12px;
    text-align: center;
    color: #6b7280;
    font-size: 13px;
}
</style>
