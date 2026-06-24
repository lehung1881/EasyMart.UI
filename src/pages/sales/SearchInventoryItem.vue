<template>
  <div class="pos-item-search-container">
    <div class="search-input-wrapper">
      <input
        ref="searchInputRef"
        v-model="searchQuery"
        type="text"
        placeholder="Nhập tên, mã SKU hoặc quét mã vạch (F4)..."
        @input="handleInput"
        @keydown.down.prevent="moveDown"
        @keydown.up.prevent="moveUp"
        @keydown.enter.prevent="selectCurrentItem"
        @keydown.escape="clearSearch"
      />
      <button v-if="searchQuery" class="btn-clear" @click="clearSearch">✕</button>
      <div v-if="isLoading" class="spinner"></div>
    </div>

    <div v-if="isOpenDropdown" class="search-dropdown">
      <div v-if="searchResults.length === 0 && !isLoading" class="no-result">
        Không tìm thấy sản phẩm phù hợp
      </div>

      <ul v-else-if="searchResults.length > 0">
        <li
          v-for="(item, index) in searchResults"
          :key="item.id"
          :class="{ 'is-active': index === activeIndex }"
          @click="selectItem(item)"
          @mouseenter="activeIndex = index"
        >
          <div class="item-info">
            <span class="item-name">{{ item.name }}</span>
            <span class="item-sku">SKU: {{ item.sku }}</span>
          </div>
          <div class="item-meta">
            <span class="item-price">{{ formatPrice(item.price) }}</span>
            <span class="item-stock" :class="{ 'out-of-stock': item.stock <= 0 }">
              Tồn: {{ item.stock }}
            </span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue';

// Khai báo kiểu dữ liệu cho Sản phẩm (Interface)
interface ProductItem {
  id: string | number;
  name: string;
  sku: string;
  price: number;
  stock: number;
}

export default defineComponent({
  name: 'SearchInventoryItem',
  emits: ['select-item'],
  setup(props, { emit }) {
    const searchQuery = ref('');
    const searchResults = ref<ProductItem[]>([]);
    const isLoading = ref(false);
    const isOpenDropdown = ref(false);
    const activeIndex = ref(-1); // Chỉ mục của sản phẩm đang được chọn bằng phím mũi tên
    const searchInputRef = ref<HTMLInputElement | null>(null);
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    // Hàm xử lý khi người dùng gõ phím (Debounce 300ms)
    const handleInput = () => {
      isOpenDropdown.value = true;
      activeIndex.value = -1; // Reset lại vị trí chọn

      if (!searchQuery.value.trim()) {
        searchResults.value = [];
        isOpenDropdown.value = false;
        return;
      }

      if (debounceTimer) clearTimeout(debounceTimer);
      isLoading.value = true;

      debounceTimer = setTimeout(async () => {
        try {
          // Gọi API tìm kiếm thực tế ở đây
          searchResults.value = await mockApiSearch(searchQuery.value);
        } catch (error) {
          console.error('Lỗi tìm kiếm:', error);
        } finally {
          isLoading.value = false;
        }
      }, 300);
    };

    // Giả lập API tìm kiếm (Thay thế bằng hàm gọi API của bạn)
    const mockApiSearch = (query: string): Promise<ProductItem[]> => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockData: ProductItem[] = [
            { id: 1, name: 'Sữa tươi tiệt trùng Vinamilk 1L', sku: 'VNM1000', price: 32000, stock: 15 },
            { id: 2, name: 'Bánh mì gối Kinh Đô', sku: 'KDO002', price: 22000, stock: 5 },
            { id: 3, name: 'Nước khoáng Aquafina 500ml', sku: 'AQF500', price: 6000, stock: 0 },
          ];
          const filtered = mockData.filter(item => 
            item.name.toLowerCase().includes(query.toLowerCase()) || 
            item.sku.toLowerCase().includes(query.toLowerCase())
          );
          resolve(filtered);
        }, 200);
      });
    };

    // Di chuyển xuống trong dropdown (Phím mũi tên xuống)
    const moveDown = () => {
      if (!isOpenDropdown.value || searchResults.value.length === 0) return;
      if (activeIndex.value < searchResults.value.length - 1) {
        activeIndex.value++;
      } else {
        activeIndex.value = 0; // Quay lại đầu danh sách
      }
    };

    // Di chuyển lên trong dropdown (Phím mũi tên lên)
    const moveUp = () => {
      if (!isOpenDropdown.value || searchResults.value.length === 0) return;
      if (activeIndex.value > 0) {
        activeIndex.value--;
      } else {
        activeIndex.value = searchResults.value.length - 1; // Xuống cuối danh sách
      }
    };

    // Chọn sản phẩm hiện tại khi nhấn Enter
    const selectCurrentItem = () => {
      // Trường hợp 1: Nếu dùng máy quét mã vạch bắn vào, thường dropdown chưa kịp chọn bằng phím
      // Bạn có thể bổ sung logic check nếu danh sách chỉ có 1 kết quả trùng khít mã vạch thì chọn luôn.
      if (activeIndex.value >= 0 && activeIndex.value < searchResults.value.length) {
        selectItem(searchResults.value[activeIndex.value]);
      }
    };

    // Chọn sản phẩm (bằng click chuột hoặc Enter)
    const selectItem = (item: ProductItem) => {
      emit('select-item', item); // Bắn sự kiện lên component cha (giỏ hàng)
      clearSearch();
    };

    // Xóa từ khóa và đóng dropdown
    const clearSearch = () => {
      searchQuery.value = '';
      searchResults.value = [];
      isOpenDropdown.value = false;
      activeIndex.value = -1;
      searchInputRef.value?.focus();
    };

    // Định dạng giá tiền VNĐ nhanh
    const formatPrice = (value: number) => {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    };

    // Lắng nghe phím tắt toàn cục (Ví dụ: F4 để focus vào ô search)
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F4') {
        event.preventDefault();
        searchInputRef.value?.focus();
      }
    };

    onMounted(() => {
      window.addEventListener('keydown', handleGlobalKeyDown);
    });

    onUnmounted(() => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      if (debounceTimer) clearTimeout(debounceTimer);
    });

    return {
      searchQuery,
      searchResults,
      isLoading,
      isOpenDropdown,
      activeIndex,
      searchInputRef,
      handleInput,
      moveDown,
      moveUp,
      selectCurrentItem,
      selectItem,
      clearSearch,
      formatPrice
    };
  }
});
</script>

<style scoped>
/* Bạn có thể tùy chỉnh hoặc áp dụng Tailwind CSS/SCSS tùy dự án */
.pos-item-search-container {
  position: relative;
  width: 100%;
}
.search-input-wrapper {
  display: flex;
  align-items: center;
  position: relative;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 8px;
  background: #fff;
}
.search-input-wrapper input {
  border: none;
  outline: none;
  width: 100%;
  margin-left: 8px;
  font-size: 16px;
}
.btn-clear {
  border: none;
  background: transparent;
  cursor: pointer;
  color: #999;
}
.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #ccc;
  border-top: none;
  max-height: 300px;
  overflow-y: auto;
  z-index: 999;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
.search-dropdown ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
.search-dropdown li {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}
.search-dropdown li.is-active {
  background-color: #e0f2fe; /* Màu highlight khi dùng phím mũi tên */
}
.item-info, .item-meta {
  display: flex;
  flex-direction: column;
}
.item-name { font-weight: bold; }
.item-sku, .item-stock { font-size: 12px; color: #666; }
.item-price { color: #e11d48; font-weight: bold; }
.out-of-stock { color: #dc2626; }
.no-result { padding: 15px; text-align: center; color: #666; }
</style>