# Pop the Lock

Bấm Space / Enter, click vòng khóa hoặc chạm nút khi kim vàng chạm vùng xanh. Trúng sẽ đổi chiều; bấm sớm hoặc bỏ lỡ sẽ thua. Màn N cần N lần trúng liên tiếp. Mỗi màn tăng tốc và thu hẹp vùng trúng, có giới hạn. Thua thử lại cùng màn; thắng sang màn kế tiếp. Kỷ lục là màn cao nhất đã qua, lưu trong trình duyệt. P tạm dừng; Esc xác nhận về Home.

Chạy từ thư mục root của Sky Club bằng npm run dev.

## Chế độ tăng tốc theo thời gian

Dễ: +0.15 rad/s mỗi 10 giây. Thường (mặc định): +0.40 rad/s mỗi 10 giây. Khó: +0.80 rad/s mỗi 10 giây. Cùng tốc độ ban đầu, cùng quy tắc vùng trúng; khác nhịp tăng tốc. Tổng tốc độ (theo màn + thời gian) giới hạn 5.5 rad/s.

Chỉ tính thời gian đang chơi: pause, Esc, ẩn tab và màn kết quả không tăng tốc. Qua màn giữ thời gian; thử lại đặt thời gian về 0 và giữ màn. Đổi chế độ bắt đầu lại màn 1. Lựa chọn được lưu trong trình duyệt.
