# Todolist — Quản lý công việc cá nhân

Ứng dụng TODO chạy trên trình duyệt, dùng Node.js + Express cho API và SQLite để lưu dữ liệu. Giao diện tiếng Việt hỗ trợ theo dõi công việc trong ngày, tìm kiếm, lọc và xem thống kê tiến độ.

## Chức năng

- **Hôm nay:** xem các task có hạn hôm nay; task quá hạn chưa hoàn thành được đánh dấu riêng.
- **Tất cả task:** xem toàn bộ công việc, tìm theo tiêu đề/mô tả và kết hợp bộ lọc trạng thái, ưu tiên, danh mục, ngày cụ thể, hôm nay hoặc quá hạn.
- **CRUD:** thêm, sửa, xóa task; đánh dấu hoàn thành nhanh. Mỗi task có tiêu đề, mô tả, danh mục, ưu tiên, trạng thái và ngày hạn.
- **Thống kê:** tổng task, đã hoàn thành, tỉ lệ hoàn tất, task quá hạn, tiến độ hôm nay; biểu đồ theo trạng thái, ưu tiên, danh mục và 7 ngày gần nhất.
- **Mock data:** lần đầu chạy tự tạo 16 task mẫu nếu cơ sở dữ liệu chưa có task. `npm run seed` xóa dữ liệu hiện tại và nạp lại dữ liệu mẫu.
- **Database:** SQLite tạo bảng và chỉ mục tự động trong `todo.db` ở thư mục dự án.

## Công nghệ

- Node.js 22.13 trở lên (dùng module `node:sqlite` tích hợp)
- Express 4
- HTML, CSS, JavaScript thuần
- SQLite

## Chạy ứng dụng

```bash
npm install
npm start
```

Mở [http://localhost:3000](http://localhost:3000). Có thể đặt cổng khác bằng biến môi trường `PORT`.

Nạp lại dữ liệu mẫu:

```bash
npm run seed
```

## Cấu trúc

```text
server.js         Express server và REST API
db.js             Kết nối SQLite, khởi tạo bảng và chỉ mục
seed.js           Dữ liệu mẫu
public/index.html Giao diện ứng dụng
public/style.css  Kiểu dáng responsive
public/app.js     Tương tác giao diện và gọi API
```

## Cấu trúc dữ liệu

Bảng `tasks` gồm `id`, `title`, `description`, `category`, `priority`, `status`, `due_date`, `created_at`, `completed_at`.

Giá trị hợp lệ cho `priority`: `low`, `medium`, `high`. Giá trị hợp lệ cho `status`: `todo`, `doing`, `done`.

## REST API

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `GET` | `/api/tasks?q=&status=&priority=&category=&date=` | Danh sách và bộ lọc task; `date` nhận `today`, `overdue` hoặc `YYYY-MM-DD` |
| `POST` | `/api/tasks` | Tạo task |
| `PUT` | `/api/tasks/:id` | Cập nhật một phần hoặc toàn bộ task |
| `DELETE` | `/api/tasks/:id` | Xóa task |
| `GET` | `/api/categories` | Danh mục hiện có |
| `GET` | `/api/stats` | Dữ liệu thống kê |

Các API ghi dữ liệu trả lỗi `400` khi dữ liệu không hợp lệ và `404` nếu không tìm thấy task cần cập nhật/xóa.
