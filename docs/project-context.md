# EasyMart UI - Project Context

Tài liệu này là context nghiệp vụ và vận hành chi tiết để dùng khi bắt đầu phiên chat mới.

Liên kết tham chiếu cấu trúc code/convention: [docs/project-structure-and-conventions.md](./project-structure-and-conventions.md).

## 1. Tổng quan sản phẩm

EasyMart UI là ứng dụng frontend phục vụ vận hành nghiệp vụ bán lẻ: quản lý danh mục, nhập hàng, bán hàng, hóa đơn, tồn kho và báo cáo.

Mục tiêu chính:

- Chuẩn hóa thao tác nghiệp vụ theo module rõ ràng.
- Đồng bộ dữ liệu qua API backend theo domain.
- Đảm bảo tính nhất quán về convention code để dễ mở rộng và bảo trì.

Phạm vi hiện tại (từ cấu trúc repo):

- Tập trung vào các module nghiệp vụ chính trong `src/pages`, `src/stores`, `src/api/modules`.
- Hỗ trợ đa ngôn ngữ qua `i18n` (`vi`, `en`).

## 2. Đối tượng người dùng & vai trò

Vai trò đang áp dụng làm mặc định:

- Admin/Quản trị: cấu hình và giám sát toàn hệ thống.
- Nhân viên bán hàng: thao tác nghiệp vụ sales/invoice.
- Nhân viên kho: thao tác nhập hàng, cân đối tồn.
- Kế toán/điều phối nghiệp vụ: đối soát hóa đơn, báo cáo.

TODO_BUSINESS:

- Xác nhận danh sách role chính thức và phạm vi quyền từng role.
- Xác nhận role nào được xem/chỉnh sửa/xóa theo từng module.

## 3. Luồng nghiệp vụ chính

Luồng nghiệp vụ cốt lõi đang dùng để định hướng khi phát triển:

1. Quản lý danh mục nền (`dictionary`): hàng hóa, kho, khách hàng, nhà cung cấp.
2. Nhập hàng (`purchase`): tạo và xử lý nghiệp vụ nhập kho.
3. Bán hàng (`sales`): tạo giao dịch bán.
4. Xuất hóa đơn (`invoice`): ghi nhận chứng từ liên quan giao dịch bán.
5. Cân đối tồn (`inventoryBalance`): theo dõi/đối soát biến động tồn kho.
6. Báo cáo (`report`): tổng hợp số liệu theo nhu cầu quản trị.

TODO_BUSINESS:

- Xác nhận thứ tự nghiệp vụ bắt buộc giữa `sales` và `invoice`.
- Xác nhận luồng hoàn/trả hàng và điều chỉnh tồn kho.

## 4. Bản đồ module hiện tại

Mapping module nghiệp vụ với cấu trúc mã nguồn:

- `auth`
    - API: `src/api/modules/authAPI.ts`
    - Model: `src/models/auth/`
    - Store: `src/stores/auth/`
    - Page: `src/pages/auth/`
    - Router: `src/routers/modules/authRouter.ts`
- `dictionary`
    - API: `src/api/modules/dictionary/`
    - Model: `src/models/dictionary/`
    - Store: `src/stores/dictionary/` và `src/stores/dictionaryCommon/`
    - Page: `src/pages/dictionary/`
    - Router: `src/routers/modules/dictionaryRouter.ts`
- `purchase`
    - API: `src/api/modules/purchaseApi.ts`
    - Model: `src/models/purchase/`
    - Store: `src/stores/purchase/`
    - Page: `src/pages/purchase/`
    - Router: `src/routers/modules/purchaseRouter.ts`
- `sales`
    - API: `src/api/modules/SAOrderAPI.ts`
    - Model: `src/models/sales/`
    - Store: `src/stores/sales/`
    - Page: `src/pages/sales/`
    - Router: `src/routers/modules/salesRouter.ts`
- `invoice`
    - API: `src/api/modules/invoiceApi.ts`
    - Model: `src/models/invoice/`
    - Store: `src/stores/invoice/`
    - Page: `src/pages/invoice/`
    - Router: `src/routers/modules/invoiceRouter.ts`
- `inventoryBalance`
    - API: `src/api/modules/inventoryBalanceApi.ts`
    - Model: `src/models/inventoryBalance/`
    - Store: `src/stores/inventoryBalance/`
    - Page: `src/pages/inventoryBalance/`
    - Router: `src/routers/modules/inventoryBalanceRouter.ts`
- `report`
    - API: `src/api/modules/reportApi.ts`
    - Router: `src/routers/modules/reportRouter.ts`
    - TODO_BUSINESS: xác nhận page/store/report model tương ứng.

## 5. Quy tắc nghiệp vụ quan trọng

Các quy tắc sau không được tự đoán nếu chưa có xác nhận:

- Quy tắc tính Giá mua, chiết khấu, thuế, làm tròn tiền.
- Điều kiện chuyển trạng thái đơn/chứng từ (draft, confirmed, canceled, completed...).
- Chính sách âm kho, khóa sổ, và sửa dữ liệu sau khi chốt.
- Quan hệ bắt buộc giữa `sales` và `invoice` (tạo trước/sau, 1-1 hay 1-n).
- Quy tắc đồng bộ tồn kho khi sửa/xóa chứng từ cũ.

TODO_BUSINESS:

- Điền rule chuẩn cho từng trạng thái nghiệp vụ.
- Điền công thức chuẩn cho các phép tính tài chính.

## 6. Tích hợp & phụ thuộc

Tích hợp chính trong frontend:

- API/backend:
    - Tập trung ở `src/api/` với `baseApi.ts`, `configApi.ts`, `modules/*`.
    - Response model dùng `src/api/models/serviceResponse.ts`.
- State management:
    - Pinia stores theo domain trong `src/stores/`.
- Routing:
    - Router chính ở `src/routers/index.ts`, module router tách theo domain.
- i18n:
    - Cấu hình ở `src/i18n/index.ts`, ngôn ngữ `vi`/`en`.

TODO_BUSINESS:

- Xác nhận URL môi trường backend chính thức theo từng môi trường.
- Xác nhận cơ chế auth token/refresh token chuẩn.

## 7. Định nghĩa thuật ngữ (Glossary)

- Dictionary: nhóm dữ liệu danh mục nền của hệ thống.
- Purchase: nghiệp vụ nhập hàng vào kho.
- Sales: nghiệp vụ bán hàng cho khách.
- Invoice: chứng từ/hóa đơn gắn với giao dịch bán.
- Inventory Balance: nghiệp vụ cân đối và đối soát tồn kho.

TODO_BUSINESS:

- Bổ sung thuật ngữ nội bộ đặc thù (nếu có) để tránh hiểu sai giữa các team.

## 8. Definition of Done cho task code

Task được xem là hoàn thành khi đáp ứng đủ:

1. Đúng module nghiệp vụ và đúng convention cấu trúc/naming.
2. Tuân thủ rule trong `AGENTS.md` và skill `coding-convention`.
3. Mọi function mới/chỉnh sửa có doc comment rõ ràng.
4. Không tạo thêm code smell rõ ràng.
5. Có ghi rõ assumption và điểm cần xác nhận nghiệp vụ nếu thiếu thông tin.
6. Nêu tác động nghiệp vụ/kỹ thuật trong phần tổng kết.

## 9. Assumptions mặc định khi thiếu thông tin

Khi chưa đủ thông tin nghiệp vụ, dùng mặc định an toàn:

- Không tự thay đổi quy tắc tài chính/đối soát nếu chưa có rule xác thực.
- Ưu tiên giữ behavior cũ và patch nhỏ.
- Không đổi naming/convention hiện hữu của module.
- Với luồng `sales`/`invoice`, chỉ triển khai phần kỹ thuật chắc chắn từ code hiện có; mọi rule nghiệp vụ chưa rõ phải đánh dấu `TODO_BUSINESS`.
- Khi cần quyết định ảnh hưởng dữ liệu, phải nêu rõ assumption trong kết quả trả lời.
