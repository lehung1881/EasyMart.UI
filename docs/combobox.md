# Yêu cầu xây dựng component BaseCombobox

Bạn là một senior frontend developer. Hãy xây dựng một component **BaseCombobox** có thể tái sử dụng bằng **Vue 3 + TypeScript + Pinia + SCSS** theo các yêu cầu sau.

---

## 1. Công nghệ bắt buộc

- Vue 3 Composition API, `<script setup lang="ts">`
- TypeScript
- Pinia (quản lý state)
- SCSS (scoped, bắt buộc dùng biến)
- Không dùng thư viện UI bên ngoài
- Hỗ trợ `v-model`

---

## 2. Cấu trúc file

Tách thành 3 file:

```
useComboboxStore.ts         ← Data layer (Pinia factory store)
BaseCombobox.vue            ← Logic layer (component chính)
BaseComboboxDropdown.vue    ← UI layer (pure render dropdown)
```

---

## 3. useComboboxStore.ts

### Yêu cầu

- Là một **factory function** (không phải singleton), mỗi lần gọi với `storeId` khác nhau tạo ra một Pinia store độc lập.
- Pinia cache instance theo `storeId` — gọi cùng `storeId` nhiều lần trả về cùng 1 instance.
- Sau khi lấy instance, **luôn gọi `syncConfig()`** để đồng bộ `comboboxLoadData` và `queryMode` vào instance — tránh mất config khi component re-render (vì Pinia chỉ chạy setup 1 lần).

### Interface Options

```ts
export type QueryMode = "local" | "remote";
export type ComboboxLoadData = (keyword: string) => Promise<Array<any>>;

export interface ComboboxStoreOptions {
    comboboxLoadData: ComboboxLoadData;
    queryMode?: QueryMode; // default: 'remote'
}
```

### State (public)

```ts
const data = ref<Array<any>>([]); // data hiển thị trong dropdown
const loading = ref<boolean>(false);
const error = ref<string | null>(null);
```

### Internal state

```ts
const rawData = ref<Array<any>>([])  // toàn bộ data gốc, chỉ dùng cho local mode
const loadFn  = ref<ComboboxLoadData | null>(...)  // dùng ref, KHÔNG dùng let
const mode    = ref<QueryMode>(...)                 // dùng ref, KHÔNG dùng let
```

> **Lưu ý quan trọng:** `loadFn` và `mode` phải là `ref` — không dùng `let`. Nếu dùng `let`, Pinia sẽ mất giá trị khi store được reuse vì setup chỉ chạy 1 lần.

### Actions (arrow functions)

Tất cả các action trong store phải là **arrow function** (`const fn = () => {}`), không dùng `function` keyword.

#### `loadData(keyword, displayField?)`

**Local mode:**

- Lần đầu (`rawData` rỗng): gọi `comboboxLoadData('')` để load toàn bộ, lưu vào `rawData`
- Trong lúc đang load lần đầu: dùng `pendingKeyword = '__local__'` để tránh gọi trùng
- Các lần sau: filter trực tiếp trên `rawData` theo keyword — không gọi API
- Filter: so sánh `String(item[displayField]).toLowerCase().includes(keyword.toLowerCase())`

**Remote mode:**

- Gọi `comboboxLoadData(keyword)` mỗi lần, luôn lấy data mới nhất (không cache)
- Set `loading = true` trước khi gọi, `loading = false` trong `finally`

#### `configure(fn, queryMode?)`

Cập nhật `loadFn`, `mode` và **reset toàn bộ** `data`, `rawData`, `pendingKeyword`. Dùng khi API phụ thuộc vào field khác trên form.

#### `syncConfig(fn, queryMode?)`

Chỉ cập nhật `loadFn` và `mode` — **không reset data**. Dùng nội bộ trong factory sau mỗi lần `store()` được gọi.

#### `reset()`

Reset `data`, `rawData`, `loading`, `error`, `pendingKeyword` về trạng thái ban đầu.

### Factory pattern

```ts
export function useComboboxStore(storeId: string, options?: ComboboxStoreOptions) {
    const store = defineStore(`combobox__${storeId}`, () => {
        // ... setup
        return { data, loading, error, loadData, configure, syncConfig, reset };
    });

    const instance = store();

    // Luôn sync sau mỗi lần gọi
    if (options?.comboboxLoadData) {
        instance.syncConfig(options.comboboxLoadData, options.queryMode);
    }

    return instance;
}

export type ComboboxStoreInstance = ReturnType<typeof useComboboxStore>;
```

---

## 4. BaseCombobox.vue (Logic layer)

### Props

```ts
interface Column {
  field:  string
  label:  string
  width?: string | number
}

// Interface nội bộ — KHÔNG import từ store
interface ComboboxStore {
  data:       { value: Array<any> }
  loading:    { value: boolean }
  error:      { value: string | null }
  loadData:   (keyword: string, displayField?: string) => Promise<void>
  configure:  (fn: (kw: string) => Promise<any[]>, mode?: 'local' | 'remote') => void
  syncConfig: (fn: (kw: string) => Promise<any[]>, mode?: 'local' | 'remote') => void
  reset:      () => void
}

props: {
  modelValue:    string | number | Record<string, any> | null  // bắt buộc
  store:         ComboboxStore   // bắt buộc, instance từ useComboboxStore()
  displayField:  string          // bắt buộc
  valueField:    string          // bắt buộc
  columns?:      Column[]        // nếu có → render bảng, không có → render list
  placeholder?:  string          // default: 'Tìm kiếm...'
  disabled?:     boolean         // default: false
  debounceTime?: number          // default: 300 (ms)
  minChars?:     number          // default: 0
}
```

> **Lưu ý:** Không dùng `import type` từ store. Định nghĩa `ComboboxStore` interface trực tiếp trong file.

### Emits

```ts
emit("update:modelValue", value); // cho v-model
emit("change", value); // side effects
emit("search", keyword); // mỗi lần trigger search
```

### State nội bộ

```ts
const isOpen = ref(false);
const isFocused = ref(false);
const inputText = ref("");
const activeIndex = ref(-1);
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
```

### Computed

```ts
// Guard: luôn là array, không bao giờ undefined
const storeData = computed<Array<any>>(() => props.store.data.value ?? []);
```

### Các xử lý bắt buộc

#### openDropdown()

```
- Nếu disabled → return
- Gọi store.loadData('', displayField)  ← luôn gọi, kể cả khi đã mở
- Nếu isOpen → return (chỉ guard phần UI, không guard fetch)
- isOpen = true
```

#### onInput()

```
- activeIndex = -1
- isOpen = true nếu chưa mở
- Clear debounce timer cũ
- Sau debounceTime ms: gọi store.loadData(keyword, displayField) nếu keyword.length >= minChars
- Emit 'search'
```

#### onFocus()

```
- isFocused = true
- Gọi openDropdown()
```

#### onBlur()

```
- isFocused = false
- Sau 150ms delay: kiểm tra focus còn trong rootRef không
  → Nếu không: closeDropdown() + reset inputText = getDisplayText(modelValue)
```

> Delay 150ms cần thiết để click vào item trong dropdown không bị blur chặn trước.

#### onSelect(item)

```
- value = modelValue là object → trả nguyên item
           modelValue là primitive → trả item[valueField]
- emit update:modelValue(value)
- emit change(value)
- inputText = item[displayField]
- closeDropdown()
- inputRef.blur()
```

#### clearValue()

```
- inputText = ''
- emit update:modelValue(null)
- emit change(null)
- activeIndex = -1
- inputRef.focus()
- store.loadData('', displayField)  ← reset về full list
```

#### Keyboard navigation

```
ArrowDown → nếu đóng: openDropdown(); nếu mở: activeIndex = min(activeIndex+1, total-1)
ArrowUp   → activeIndex = max(activeIndex-1, 0)
Enter     → nếu activeIndex >= 0: onSelect(storeData[activeIndex]); nếu không: openDropdown()
Escape    → closeDropdown() + reset inputText = getDisplayText(modelValue)
Tab       → closeDropdown()
```

#### Click outside

```
- Đăng ký mousedown trên document khi mounted
- Hủy đăng ký khi beforeUnmount
- Nếu click ngoài rootRef → closeDropdown() + reset inputText
```

#### getDisplayText(value)

```
- null/undefined → ''
- object → value[displayField]
- primitive → tìm trong storeData, trả displayField; nếu không tìm thấy → String(value)
```

#### Watch modelValue

```ts
watch(
    () => props.modelValue,
    (val) => {
        const text = getDisplayText(val);
        if (text !== inputText.value) inputText.value = text;
    },
    { immediate: true },
);
```

### Template cần có

- Input với đầy đủ ARIA: `role="combobox"`, `aria-expanded`, `aria-haspopup="listbox"`, `aria-activedescendant`
- Nút clear (×): chỉ hiện khi `inputText && !disabled`, dùng `@mousedown.prevent`
- Nút toggle (▼): chevron xoay 180° khi mở, dùng `@mousedown.prevent`
- `<Transition>` bao quanh dropdown panel
- Dropdown panel: `position: absolute`, cách input 4px, không liền mạch với input

---

## 5. BaseComboboxDropdown.vue (UI layer)

### Nguyên tắc

- **Không chứa bất kỳ business logic nào**
- Chỉ nhận props và render UI

### Props

```ts
props: {
  data:          Array<any>   // default: []  ← bắt buộc có default để tránh undefined
  displayField:  string
  valueField:    string
  columns?:      Column[]     // default: undefined
  activeIndex:   number
  selectedValue: any
  loading:       boolean
}
```

### Emits

```ts
emit("select", item); // khi click item
emit("hover", index); // khi mouseenter item
```

### Logic render

```
loading = true      → Hiển thị spinner + "Đang tải..."
data.length === 0   → Hiển thị "Không có kết quả"
columns có giá trị  → Render dạng bảng (thead + tbody)
columns không có    → Render dạng list (ul > li)
```

### Scroll into view

```ts
// Watch activeIndex → tự động cuộn item active vào viewport
watch(
    () => props.activeIndex,
    (index) => {
        if (index < 0) return;
        itemRefs.value[index]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    },
);
```

### isSelected(item)

```ts
if (selectedValue == null) return false;
if (typeof selectedValue === "object") return selectedValue[valueField] === item[valueField];
return selectedValue === item[valueField];
```

### Slots hỗ trợ

```
#item          → { item, index }          — custom render item trong list mode
#row           → { item, index, columns } — custom render toàn bộ <tr>
#cell-{field}  → { item, value }          — custom render từng cell theo tên field
```

---

## 6. Styling — SCSS

### BaseCombobox.vue

```scss
$primary:          #f48632;
$primary-alpha-20: rgba(244, 134, 50, 0.2);
$border-color:     #d0d0d0;
$border-radius:    6px;
$input-height:     38px;

// Input wrapper
border: 1px solid $border-color;  // 1px, không phải 2px
&:hover        → border-color: $primary
&(--focused)   → border-color: $primary + box-shadow: 0 0 0 3px $primary-alpha-20

// Dropdown panel
position: absolute;
top: calc(#{$input-height} + 4px);  // tách biệt với input, KHÔNG liền mạch
border: 1px solid $border-color;    // border xám, KHÔNG dùng màu cam
border-radius: $border-radius;
box-shadow: 0 4px 16px rgba(0,0,0,0.08);
```

### BaseComboboxDropdown.vue

```scss
$primary: #f48632;
$primary-light: rgba(244, 134, 50, 0.08);
$primary-medium: rgba(244, 134, 50, 0.18);

// Item/Row hover hoặc active
background: $primary-light;
border-left: 3px solid $primary;

// Item/Row selected
background: $primary-medium;
border-left: 3px solid $primary;
font-weight: 600;
&::after {
    content: "✓";
    color: $primary;
}

// Kết hợp active + selected
background: $primary-medium; // giữ màu selected, không bị override

// Dropdown max-height: 280px, overflow: hidden (scroll nội bộ từng mode)
// Màu chữ: không set cứng, kế thừa (inherit) từ app
```

---

## 7. Quy tắc import

```ts
// ✅ Đúng — useComboboxStore được import từ composables
import { useComboboxStore } from "@/composables/useComboboxStore";

// ✅ Đúng — BaseCombobox và BaseComboboxDropdown đã đăng ký global, không cần import
// (Không có dòng import component trong file sử dụng)

// ❌ Sai — không import type từ store vào component
import type { ComboboxStoreInstance } from "@/composables/useComboboxStore";
// → Thay bằng: định nghĩa interface ComboboxStore trực tiếp trong BaseCombobox.vue
```

---

## 8. Cách sử dụng

```ts
// Trong component cha — mỗi combobox một store riêng, API riêng
import { useComboboxStore } from "@/composables/useComboboxStore";

// Local: load 1 lần, filter client-side
const docTypeStore = useComboboxStore("docType", {
    comboboxLoadData: (_kw) => api.get("/doc-types"),
    queryMode: "local",
});

// Remote: gọi API mỗi lần search
const employeeStore = useComboboxStore("employee", {
    comboboxLoadData: (kw) => api.get("/employees", { params: { q: kw } }),
    queryMode: "remote",
});

// Dynamic: thay đổi API theo field khác
watch(
    () => form.departmentId,
    (deptId) => {
        employeeStore.configure((kw) => api.get("/employees", { params: { q: kw, deptId } }), "remote");
    },
);
```

```html
<!-- Local mode -->
<BaseCombobox
    v-model="form.docTypeId"
    display-field="name"
    value-field="id"
    :store="docTypeStore"
    placeholder="Chọn loại văn bản..."
/>

<!-- Remote mode với columns (dạng bảng) -->
<BaseCombobox
    v-model="form.employeeId"
    display-field="name"
    value-field="id"
    :store="employeeStore"
    :columns="[
    { field: 'name',       label: 'Họ tên',    width: 180 },
    { field: 'department', label: 'Phòng ban', width: 120 },
  ]"
    :debounce-time="400"
    placeholder="Tìm nhân viên..."
/>
```

---

## 9. Lưu ý quan trọng

1. **`loadFn` và `mode` phải là `ref`** trong store — không dùng `let`. Nếu dùng `let`, giá trị sẽ bị mất khi Pinia reuse store instance (setup chỉ chạy 1 lần).

2. **Luôn gọi `syncConfig()` trong factory** sau `store()` — đảm bảo `comboboxLoadData` được sync vào instance dù đây là lần đầu hay lần thứ N gọi.

3. **`openDropdown()` luôn gọi `store.loadData()`** trước khi check `isOpen` — đảm bảo data luôn được load kể cả khi dropdown đã mở.

4. **`onBlur()` cần delay 150ms** — tránh đóng dropdown trước khi `click` trên item được xử lý.

5. **Dropdown panel cách input 4px** (`top: calc(38px + 4px)`) — không liền mạch, border xám (không cam).

6. **Không cache ở remote mode** — mỗi lần search gọi API để lấy data mới nhất.

7. **Local mode chỉ gọi API 1 lần** — lưu vào `rawData`, các lần sau filter trực tiếp trên `rawData`.

8. **`data` prop của BaseComboboxDropdown phải có `default: () => []`** — tránh lỗi `Cannot read properties of undefined` khi store chưa init xong.

9. **Khi viết hàm phải có comment đầy đủ và ngắn gọn**
