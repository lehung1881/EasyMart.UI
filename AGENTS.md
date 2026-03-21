# Default Coding Rules

Always apply skill `$coding-convention` at
`e:\WorkspaceV2\EasyMartCode\EasyMart.UI\.codex\skills\coding-convention`
for every coding task in this repository.

Mandatory:
- Add doc comment above every function.
- Avoid code smells.
- Do not split functions into overly tiny fragments without clear value.

## Project Context (Always Load First)

- Product one-liner: EasyMart UI là frontend quản lý vận hành bán hàng, nhập hàng, tồn kho và danh mục cho hệ thống EasyMart.
- Primary users: quản trị hệ thống, nhân viên bán hàng, nhân viên kho, kế toán/nhân sự nghiệp vụ liên quan.
- Core business modules:
  - `dictionary` (danh mục hàng hóa, kho, khách hàng, nhà cung cấp)
  - `sales` (nghiệp vụ bán hàng)
  - `invoice` (nghiệp vụ hóa đơn)
  - `purchase` (nghiệp vụ nhập hàng)
  - `inventoryBalance` (cân đối/đối soát tồn kho)
  - `auth` và `report` (xác thực, báo cáo)

### Working Principles For This Repo

1. Ưu tiên bám convention hiện có của dự án trước khi đề xuất pattern mới.
2. Không tự ý đổi naming convention hoặc cấu trúc module nếu chưa có yêu cầu rõ ràng.
3. Khi thiếu thông tin nghiệp vụ, nêu rõ assumption và đánh dấu phần cần xác nhận.
4. Ưu tiên patch nhỏ, tập trung, hạn chế chỉnh sửa lan rộng không cần thiết.
5. Luôn tóm tắt tác động nghiệp vụ và kỹ thuật của thay đổi trước khi kết thúc task.

### Large Task Rule

Trước khi bắt đầu task code lớn hoặc refactor, luôn đọc `docs/project-context.md` để nắm bối cảnh nghiệp vụ.

## Reference Docs

- `docs/project-context.md`
- `docs/project-structure-and-conventions.md`
