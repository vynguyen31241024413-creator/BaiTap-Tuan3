// Dữ liệu mẫu (mock data). Chạy: npm run seed  (xóa dữ liệu cũ và nạp lại)
const db = require('./db');

function dateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

const mock = [
  ['Làm bài tập JavaScript Lab 10', 'Hoàn thành phần DOM và nộp lên GitHub', 'Học tập', 'high', 'doing', 0],
  ['Họp nhóm dự án cà phê đóng chai', 'Chốt nội dung báo cáo tuần 4', 'Học tập', 'high', 'todo', 0],
  ['Đi siêu thị mua đồ ăn', 'Rau, trứng, sữa', 'Cá nhân', 'low', 'todo', 0],
  ['Tập gym 1 tiếng', '', 'Sức khỏe', 'medium', 'done', 0],
  ['Đọc chương 5 Thương mại điện tử', 'Ghi chú các ý chính', 'Học tập', 'medium', 'todo', 0],
  ['Nộp báo cáo tuần 3', '', 'Học tập', 'high', 'done', -1],
  ['Thanh toán tiền internet', '', 'Cá nhân', 'medium', 'done', -2],
  ['Chạy bộ 5km', '', 'Sức khỏe', 'low', 'done', -3],
  ['Sửa lỗi ERD website Sắp Tết', 'Thêm bảng Vouchers và Reviews', 'Học tập', 'high', 'todo', -1],
  ['Gọi điện cho ba mẹ', '', 'Gia đình', 'medium', 'done', -4],
  ['Chuẩn bị slide thuyết trình', 'Tối đa 10 slide', 'Học tập', 'high', 'todo', 2],
  ['Mua quà sinh nhật bạn', '', 'Cá nhân', 'medium', 'todo', 3],
  ['Học tiếng Anh 30 phút', 'Ôn từ vựng chủ đề business', 'Học tập', 'low', 'doing', 1],
  ['Dọn phòng cuối tuần', '', 'Gia đình', 'low', 'todo', 4],
  ['Khám sức khỏe định kỳ', '', 'Sức khỏe', 'medium', 'todo', 6],
  ['Ôn thi giữa kỳ', 'Ôn 3 chương đầu', 'Học tập', 'high', 'todo', 5],
];

function seed(reset = false) {
  if (reset) db.exec(`DELETE FROM tasks; DELETE FROM sqlite_sequence WHERE name = 'tasks';`);
  const ins = db.prepare(`INSERT INTO tasks (title, description, category, priority, status, due_date, completed_at)
                          VALUES (?, ?, ?, ?, ?, ?, ?)`);
  db.exec('BEGIN');
  try {
    for (const [title, desc, cat, pri, st, off] of mock) {
      ins.run(title, desc, cat, pri, st, dateOffset(off), st === 'done' ? dateOffset(off) + ' 20:00:00' : null);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

module.exports = { seed };

if (require.main === module) {
  seed(true);
  console.log(`Đã nạp ${mock.length} task mẫu vào todo.db`);
}
