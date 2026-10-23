# LinkStack

<p align="center">
  <img src="public/logo.png" alt="LinkStack Logo" width="180" />
</p>

<p align="center">
  Hệ thống quản lý bookmark và tài nguyên web tối giản cho lập trình viên, tổ chức liên kết theo cấu trúc Package và Section với cơ chế chống SSRF và điều hướng phím tắt.
</p>

<p align="center">
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.7-3178c6.svg" alt="TypeScript" /></a>
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-14.2-000000.svg" alt="Next.js" /></a>
  <a href="https://www.prisma.io/"><img src="https://img.shields.io/badge/Prisma-5.22-2d3748.svg" alt="Prisma" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg" alt="Tailwind CSS" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" /></a>
</p>

<p align="center">
  <a href="README.md">English</a> | <strong>Tiếng Việt</strong>
</p>

---

## Tổng quan

Quá trình làm việc hàng ngày tạo ra hàng trăm liên kết bị phân tán giữa trình duyệt, kênh chat và issue tracker. Các công cụ bookmark truyền thống thường dàn phẳng liên kết hoặc áp đặt cấu trúc thư mục đơn lẻ gò bó.

LinkStack tổ chức liên kết theo **mô hình phân cấp 3 tầng**: **Package → Section → URL**. Bạn có thể gom nhóm tài nguyên theo dự án, công nghệ hoặc nghiệp vụ, lưu liên kết trực tiếp tại gốc Package hoặc chia nhỏ vào các Section chuyên biệt.

### Tính năng nổi bật

- **Cấu trúc phân cấp 3 tầng**: `Package` → `Section` → `URLs`. Di chuyển liên kết linh hoạt giữa các section, an toàn khi xóa section và tùy chỉnh màu sắc, biểu tượng cho từng package.
- **Thu thập Metadata chống SSRF**: Tự động trích xuất tiêu đề, mô tả và favicon độ phân giải cao; kiểm duyệt IP chặt chẽ chặn hoàn toàn mạng nội bộ (private IP), loopback và cloud metadata.
- **Đăng nhập đa phương thức**: Đăng nhập bằng email/mật khẩu với mã hóa bcrypt 12 rounds, hỗ trợ OAuth Google và GitHub với cơ chế tự động liên kết tài khoản.
- **Command Palette tức thì (`Cmd/Ctrl + K`)**: Tìm kiếm và điều hướng nhanh chóng bằng bàn phím qua toàn bộ packages, sections, URLs và tags.
- **Nhập/Xuất Netscape HTML & JSON**: Nhập toàn bộ bookmark từ Chrome, Firefox, Safari, Edge, Brave với bộ lọc phát hiện liên kết trùng lặp thời gian thực; xuất dữ liệu linh hoạt bất kỳ lúc nào.
- **Thao tác hàng loạt (Batch Actions)**: Chọn nhiều liên kết cùng lúc để chuyển section, gắn nhãn (tag), đánh dấu yêu thích hoặc xóa.
- **Ghi chú Markdown & Quản lý nhiệm vụ (Tasks)**: Lưu trữ ghi chú kỹ thuật Markdown và nhắc việc gắn liền với tài nguyên.
- **Cô lập dữ liệu người dùng**: Kiểm tra quyền sở hữu `userId` ở tầng cơ sở dữ liệu trên mọi API mutation, ngăn chặn hoàn toàn lỗ hổng IDOR.

---

## Bắt đầu nhanh

**Yêu cầu hệ thống:**
- **Node.js**: v18.17+ hoặc v20+ / v22+
- **PostgreSQL**: v14+ (chạy cục bộ hoặc qua Docker)

### 1. Sao chép mã nguồn & Cài đặt thư viện

```bash
git clone https://github.com/harry-leon/LinkStack.git
cd LinkStack
npm install
```

### 2. Thiết lập biến môi trường

Sao chép file cấu hình mẫu:

```bash
cp .env.example .env
```

Cập nhật thông tin kết nối PostgreSQL trong `.env`:

```env
DATABASE_URL="postgresql://postgres@localhost:5432/linkstack_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="linkstack-super-secret-development-key-2026-secure-token"
```

### 3. Đồng bộ cơ sở dữ liệu

Đồng bộ lược đồ dữ liệu lên PostgreSQL qua Prisma:

```bash
npx prisma db push
```

### 4. Khởi chạy máy chủ phát triển

```bash
npm run dev
```

Kết quả hiển thị:
```text
  ▲ Next.js 14.2.35
  - Local:        http://localhost:3000
  - Environments: .env

 ✓ Ready in 1.8s
```

Truy cập [http://localhost:3000](http://localhost:3000) trên trình duyệt.

**Tài khoản Demo sẵn có**:
- **Email**: `demo@linkstack.app`
- **Mật khẩu**: `Password123!`

---

## Cấu hình

| Biến môi trường | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|
| `DATABASE_URL` | Có | - | Chuỗi kết nối PostgreSQL |
| `NEXTAUTH_URL` | Có | `http://localhost:3000` | URL gốc của ứng dụng |
| `NEXTAUTH_SECRET` | Có | - | Khóa bí mật mã hóa JWT phiên đăng nhập (tối thiểu 32 ký tự) |
| `GOOGLE_CLIENT_ID` | Không | - | Client ID từ Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Không | - | Client Secret từ Google Cloud Console |
| `GITHUB_ID` | Không | - | Client ID từ GitHub Developer Settings |
| `GITHUB_SECRET` | Không | - | Client Secret từ GitHub Developer Settings |
| `CRON_SECRET` | Không | - | Token xác thực API endpoint `/api/cron/reminders` |
| `STORAGE_ENDPOINT` | Không | - | Endpoint lưu trữ S3 (dành cho file đính kèm trong ghi chú) |
| `STORAGE_ACCESS_KEY_ID` | Không | - | Access Key ID của dịch vụ S3 |
| `STORAGE_SECRET_ACCESS_KEY` | Không | - | Secret Access Key của dịch vụ S3 |
| `STORAGE_BUCKET` | Không | - | Tên S3 Bucket |

---

## Mô hình dữ liệu & Phân cấp

```text
User (Tài khoản & Hạn ngạch Quotas)
  ├── Account (Liên kết nhà cung cấp OAuth Google / GitHub)
  ├── Note (Ghi chú Markdown & File đính kèm)
  ├── Task (Nhiệm vụ & Lời nhắc)
  ├── Tag (Nhãn phân loại)
  └── Package (id, name, color, icon, isFavorite, sortOrder)
        ├── Section (id, name, icon, sortOrder)
        │     └── Url (id, url, title, description, faviconUrl, isFavorite, tags)
        └── Url (Liên kết trực tiếp tại gốc Package)
```

- **Bảo vệ liên kết khi xóa Section**: Khi xóa section, bạn có thể chọn xóa tất cả URL bên trong hoặc giữ lại an toàn tại gốc Package (`sectionId: null`).
- **Phát hiện trùng lặp thời gian thực**: LinkStack kiểm tra chuẩn hóa URL trước khi lưu và cảnh báo nếu liên kết đã tồn tại ở Package hoặc Section khác.

---

## Kiến trúc bảo mật

1. **Bộ lọc chống SSRF (`lib/ssrf.ts`)**:
   - Chỉ cho phép giao thức `http:` và `https:`.
   - Phân giải tên miền (DNS) và đối chiếu địa chỉ IP với danh sách cấm: dải mạng nội bộ (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), loopback (`127.0.0.0/8`, `::1`), link-local (`169.254.0.0/16`) và endpoint cloud metadata (`169.254.169.254`).
   - Giới hạn thời gian chờ 4 giây và kích thước phản hồi tối đa 512 KB.
2. **Xác thực và phân quyền trên máy chủ**:
   - Tất cả các thao tác đọc/ghi đều kiểm tra `userId` dựa trên token phiên máy chủ đã ký duyệt.
3. **Bảo mật mật khẩu**:
   - Mật khẩu lưu trữ được băm qua bcrypt với 12 salt rounds theo tiêu chuẩn khuyến nghị của OWASP.

---

## Cấu trúc thư mục

```text
LinkStack/
├── app/                      # Next.js App Router (Giao diện & API Routes)
│   ├── api/                  # REST route handlers (packages, sections, urls, auth)
│   ├── login/ & register/    # Giao diện đăng nhập & đăng ký (Credentials, Google, GitHub)
│   ├── packages/             # Danh sách và chi tiết Package
│   ├── urls/                 # Danh bạ toàn bộ URL có bộ lọc đa năng
│   ├── notes/ & tasks/       # Quản lý ghi chú Markdown và danh sách công việc
│   ├── import-export/        # Công cụ nhập/xuất Netscape HTML và JSON
│   ├── layout.tsx            # Root layout tích hợp Session, Theme và Icons
│   └── manifest.ts           # Cấu hình PWA manifest cho trình duyệt
├── components/
│   ├── landing/              # Giao diện Landing Page giới thiệu
│   ├── layout/               # Sidebar, TopHeader, AppShell, CommandPalette
│   ├── shared/               # Logo, GoogleIcon, GithubIcon, FaviconImage
│   └── ui/                   # Các UI component chuẩn Radix UI và Tailwind CSS
├── features/                 # Các hộp thoại nghiệp vụ (packages, sections, urls)
├── lib/
│   ├── auth.ts               # Cấu hình NextAuth và tự động liên kết OAuth user
│   ├── db.ts                 # Prisma Client singleton
│   ├── metadata.ts           # Trích xuất metadata OpenGraph an toàn
│   ├── ssrf.ts               # Bộ lọc địa chỉ IP và chống SSRF
│   └── validations.ts        # Lược đồ kiểm tra tính hợp lệ dữ liệu (Zod)
├── prisma/
│   └── schema.prisma         # Định nghĩa lược đồ PostgreSQL
├── public/                   # Tài nguyên tĩnh (logo, icon.png, favicon.ico)
└── tests/                    # Bộ kiểm thử tự động Vitest (61 bài test trên 10 file)
```

---

## Lệnh khả dụng

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Khởi chạy máy chủ phát triển tại `http://localhost:3000` |
| `npm run build` | Biên dịch bản build tối ưu cho môi trường production |
| `npm run start` | Chạy máy chủ production |
| `npm run typecheck` | Kiểm tra toàn bộ kiểu dữ liệu TypeScript (`tsc --noEmit`) |
| `npm run test` | Chạy bộ kiểm thử tự động với Vitest |
| `npm run prisma:generate` | Tạo mới Prisma Client bindings |
| `npm run prisma:migrate` | Chạy migration cơ sở dữ liệu |
| `npm run prisma:seed` | Nạp dữ liệu mẫu ban đầu vào cơ sở dữ liệu |

---

## Kiểm thử & Chất lượng

Chạy bộ kiểm thử tự động:

```bash
npm run test
```

Kiểm tra an toàn kiểu TypeScript:

```bash
npm run typecheck
```

Biên dịch gói ứng dụng:

```bash
npm run build
```

---

## Xử lý sự cố

**Sự cố: Lỗi kết nối cơ sở dữ liệu (`P1001: Can't reach database server`)**
- **Nguyên nhân**: Dịch vụ PostgreSQL chưa chạy hoặc thông tin tài khoản trong `DATABASE_URL` không đúng.
- **Cách khắc phục**: Kiểm tra cấu hình `DATABASE_URL` trong file `.env` và bảo đảm dịch vụ PostgreSQL đang hoạt động.

**Sự cố: Đăng nhập Google hoặc GitHub báo lỗi cấu hình (OAuth Error)**
- **Nguyên nhân**: Thiếu Client ID hoặc Client Secret trong file `.env`.
- **Cách khắc phục**: Bổ sung `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_ID`, `GITHUB_SECRET` vào file `.env` và khởi động lại server.

**Sự cố: Không trích xuất được tiêu đề hoặc favicon của liên kết**
- **Nguyên nhân**: Trang web đích không thể truy cập, chặn bot tự động hoặc phân giải về địa chỉ IP nội bộ bị bộ lọc SSRF chặn.
- **Cách khắc phục**: LinkStack sẽ tự động sử dụng favicon mặc định và tiêu đề do bạn nhập tay.

---

## Hạn chế & Trạng thái

- **Trạng thái**: Bản phát hành ổn định v1.0.
- **Self-Hosting**: Yêu cầu có phiên bản PostgreSQL đang chạy.
- **Tải ảnh đính kèm**: Tính năng lưu ảnh trong ghi chú yêu cầu cấu hình lưu trữ S3 tương thích trong `.env`.
- **Chia sẻ công khai**: Các package hiện tại chỉ khả dụng cho chủ sở hữu; tính năng chia sẻ liên kết ra ngoài dự kiến sẽ có trong bản cập nhật kế tiếp.

---

## Đóng góp

Mọi đóng góp từ cộng đồng đều được hoan nghênh! Quy trình đề xuất:

1. Fork repository và tạo nhánh tính năng (`git checkout -b feature/tinh-nang-moi`).
2. Chạy `npm run typecheck` và `npm run test` trước khi gửi thay đổi.
3. Commit thông điệp rõ ràng và tạo Pull Request.

---

## Giấy phép

Phát hành theo [Giấy phép MIT](LICENSE). Bản quyền (c) 2026 harry-leon & LinkStack Contributors.
