# EasyMart UI - Cấu Trúc Dự Án Và Convention Đặt Tên

## 1. Cấu trúc thư mục chuẩn

```txt
src/
│
├── api/
│   ├── baseApi.ts
│   ├── configApi.ts
│   ├── models/
│   │   └── serviceResponse.ts
│   └── modules/
│       ├── authAPI.ts
│       ├── dictionary/
│       │   ├── inventoryItemApi.ts
│       │   ├── stockApi.ts
│       │   ├── customerApi.ts
│       │   └── supplierApi.ts
│       ├── inventoryBalanceApi.ts
│       ├── salesApi.ts
│       ├── invoiceApi.ts
│       ├── purchaseApi.ts
│       └── reportApi.ts
│
├── assets/
├── base/
│   ├── baseService.ts
│   └── baseStore.ts
├── commons/
│   ├── commonFunction.ts
│   ├── format.ts
│   └── validation.ts
├── components/
│   └── base/
│       ├── BaseButton.vue
│       ├── BaseCheckbox.vue
│       ├── BaseInput.vue
│       ├── BaseTable.vue
│       └── BaseForm.vue
├── constants/
│   └── enums/
│       ├── userRoleEnum.ts
│       └── orderStatusEnum.ts
├── composables/
│   ├── useAuth.ts
│   └── usePagination.ts
├── i18n/
│   ├── index.ts
│   ├── i18n_en.ts
│   ├── i18n_vi.ts
│   └── modules/
│       ├── en/
│       └── vi/
├── models/
│   ├── auth/
│   │   └── auth.ts
│   ├── dictionary/
│   │   ├── inventoryItem.ts
│   │   ├── stock.ts
│   │   ├── customer.ts
│   │   └── supplier.ts
│   ├── inventoryBalance/
│   │   └── inventoryBalance.ts
│   ├── sales/
│   │   └── sales.ts
│   ├── invoice/
│   │   └── invoice.ts
│   ├── purchase/
│       └── purchase.ts
├── pages/
│   ├── auth/
│   │   ├── Login.vue
│   │   └── Register.vue
│   ├── dashboard/
│   │   └── Dashboard.vue
│   ├── dictionary/
│   │   ├── inventoryItem/
│   │   ├── stock/
│   │   ├── customer/
│   │   ├── supplier/
│   │   └── Dictionary.vue
│   ├── inventoryBalance/
│   │   └── InventoryBalance.vue
│   ├── sales/
│   │   └── Sales.vue
│   ├── invoice/
│   │   └── Invoice.vue
│   └── purchase/
│       └── Purchase.vue
├── routers/
│   ├── index.ts
│   └── modules/
│       ├── authRouter.ts
│       ├── dictionaryRouter.ts
│       ├── inventoryBalanceRouter.ts
│       ├── salesRouter.ts
│       ├── invoiceRouter.ts
│       ├── purchaseRouter.ts
│       └── reportRouter.ts
├── stores/
│   ├── auth/
│   │   └── authStore.ts
│   ├── dictionary/
│   │   ├── inventoryItemStore.ts
│   │   ├── stockStore.ts
│   │   ├── customerStore.ts
│   │   └── supplierStore.ts
│   ├── inventoryBalance/
│   │   └── inventoryBalanceStore.ts
│   ├── sales/
│   │   └── salesStore.ts
│   ├── invoice/
│   │   └── invoiceStore.ts
│   ├── purchase/
│   │   └── purchaseStore.ts
│   └── dictionaryCommon/
│       └── dictionaryStore.ts
├── App.vue
├── main.ts
└── style.css
```

## 2. Convention đặt tên

### 2.1 File TypeScript

- Dùng `camelCase` cho file domain.
- Hậu tố theo vai trò:
    - `*Api.ts` cho API module.
    - `*Store.ts` cho Pinia store.
    - file model là tên domain thuần: `inventoryItem.ts`, `auth.ts`.
    - router module: `*Router.ts`.

### 2.2 File Vue

- Dùng `PascalCase`.
- Pages đặt theo màn hình: `Login.vue`, `InventoryBalance.vue`, `SupplierDetail.vue`.
- Base components bắt đầu bằng `Base`: `BaseButton.vue`, `BaseForm.vue`.

### 2.3 Thư mục

- Dùng `camelCase` cho domain folder: `inventoryBalance`, `dictionaryCommon`, `inventoryItem`.

## 3. Ví dụ đúng/sai

### Đúng

- `src/api/modules/inventoryBalanceApi.ts`
- `src/stores/dictionary/inventoryItemStore.ts`
- `src/routers/modules/purchaseRouter.ts`
- `src/models/dictionaryCommon/common.ts`

### Sai

- `inventory-balance.api.ts`
- `inventory-item.store.ts`
- `purchase.ts` (dùng cho router module)
- `auth.model.ts`

## 4. Checklist khi thêm module mới

1. Tạo model trong `src/models/<module>/`.
2. Tạo API trong `src/api/modules/` (hoặc `dictionary/` nếu thuộc nhóm dictionary).
3. Tạo store trong `src/stores/`.
4. Tạo page trong `src/pages/`.
5. Tạo router module `*Router.ts` trong `src/routers/modules/` và nối vào `routers/index.ts`.
6. Thêm i18n cho cả `en` và `vi`.
7. Bám đúng convention camelCase/PascalCase nêu trên.

## 5. Mô tả control dùng chung trong `src/components`

Mục tiêu của `src/components/controls` là chuẩn hóa control UI dùng chung để tất cả màn hình có cùng trải nghiệm và giảm trùng lặp code.

### 5.1 Danh sách control hiện có

- `BaseButton.vue`
    - Dùng cho các action chuẩn: thêm mới, lưu, cập nhật, xóa, hủy.
    - Ưu tiên dùng component này thay vì button tự style tại từng page.
- `BaseInput.vue`
    - Dùng cho nhập liệu text/number cơ bản.
    - Chuẩn hóa style input, trạng thái disabled/readonly và hiển thị lỗi validate.
- `BaseCheckbox.vue`
    - Dùng cho các trường bật/tắt hoặc lựa chọn nhị phân.
    - Tránh tự dựng checkbox riêng rải rác theo từng module.
- `BaseForm.vue`
    - Dùng làm khung form chuẩn cho màn hình nhập liệu.
    - Chuẩn hóa layout form và hành vi submit/reset.
- `BaseTable.vue`
    - Dùng hiển thị dữ liệu dạng danh sách/bảng.
    - Chuẩn hóa header, hiển thị empty state và thao tác theo dòng.

### 5.2 Quy ước sử dụng control dùng chung

- Luôn kiểm tra và tái sử dụng control trong `components/controls` trước khi tạo component mới.
- Chỉ tạo mới base control khi nhu cầu tái sử dụng từ 2 màn hình trở lên.
- Nếu custom theo nghiệp vụ riêng của một module, tạo wrapper tại module đó thay vì chỉnh base control theo hướng phá vỡ tính dùng chung.
- Khi mở rộng props/events của base control, phải đảm bảo tương thích ngược với các màn hình đang sử dụng.
