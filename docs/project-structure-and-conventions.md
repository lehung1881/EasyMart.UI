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
│       ├── authApi.ts
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
│   ├── base/
│   │   ├── BaseButton.vue
│   │   ├── BaseInput.vue
│   │   ├── BaseTable.vue
│   │   └── BaseForm.vue
│   └── shared/
│       └── ConfirmDialog.vue
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
