# Skill: frontend-vue-code-quality

## Description

Đảm bảo code Frontend Vue 3 + TypeScript tuân thủ convention rõ ràng, dễ bảo trì, có comment đầy đủ và luôn đề xuất nhiều phương án khi xử lý bài toán kỹ thuật.

## When to use

- Khi viết component Vue mới.
- Khi viết composable.
- Khi xử lý logic (API, state, validation).
- Khi refactor code frontend.
- Khi đề xuất giải pháp kỹ thuật.

---

## Project Rules

### 1. Tech Stack

- Vue 3 (Composition API).
- TypeScript.
- `script setup`.
- Ưu tiên tách logic ra composable.

---

### 2. Coding Convention

#### Naming

- Component: `PascalCase` (ví dụ: `ProductList.vue`).
- Function: `camelCase` (ví dụ: `getProductList`).
- Variable: `camelCase`.
- Constant: `UPPER_CASE`.
- Composable: `useSomething` (ví dụ: `useProduct`).

#### Structure

- Tách rõ 3 phần:
  - UI (`template`)
  - Logic (`script`)
  - Style (`style scoped`)
- Không viết logic phức tạp trực tiếp trong template.
- Ưu tiên component có thể tái sử dụng.
- Một component chỉ nên có một trách nhiệm chính.

---

### 3. Mandatory Function Comment (BẮT BUỘC)

MỌI function đều phải có comment ngay phía trên:

```ts
/**
 * Mô tả chức năng của hàm.
 * @param paramName Mô tả ý nghĩa tham số.
 * @returns Mô tả giá trị trả về.
 */
```

Áp dụng cho:

- Function trong component.
- Function trong composable.
- Helper function trong module.

---

### 4. Best Practices

- Luôn khai báo kiểu dữ liệu rõ ràng cho `props`, `emit`, state và response API.
- Tránh dùng `any`; nếu bắt buộc, phải giải thích lý do.
- Dùng `computed` cho dữ liệu phát sinh từ state.
- Dùng `watch` khi cần side effect, không lạm dụng.
- Xử lý loading, empty state và error state đầy đủ khi gọi API.

---

### 5. Khi đề xuất giải pháp kỹ thuật

- Luôn đưa ra tối thiểu 2 phương án.
- Với mỗi phương án cần nêu:
  - Ưu điểm
  - Nhược điểm
  - Khi nào nên dùng
- Nếu có thể, chốt phương án khuyến nghị và lý do chọn.
