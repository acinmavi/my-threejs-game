# Pop the Lock

Bấm Space / Enter, click vòng khóa hoặc chạm nút khi kim vàng chạm vùng xanh. Trúng sẽ đổi chiều; bấm sớm hoặc bỏ lỡ sẽ thua. Trong chế độ Theo màn, màn N cần N lần trúng liên tiếp. Mỗi màn tăng tốc và thu hẹp vùng trúng, có giới hạn. Thua thử lại cùng màn; thắng sang màn kế tiếp. Theo màn lưu màn cao nhất đã qua; Endless lưu số lần trúng cao nhất, riêng trong trình duyệt. P tạm dừng; Esc xác nhận về Home.

Chạy từ thư mục root của Sky Club bằng npm run dev.

## Chế độ tăng tốc theo thời gian

Dễ: +0.075 rad/s mỗi 10 giây. Thường (mặc định): +0.20 rad/s mỗi 10 giây. Khó: +0.40 rad/s mỗi 10 giây. Cùng tốc độ ban đầu, cùng quy tắc vùng trúng; khác nhịp tăng tốc. Tổng tốc độ (theo màn + thời gian) giới hạn 5.5 rad/s.

Chỉ tính thời gian đang chơi: pause, Esc, ẩn tab và màn kết quả không tăng tốc. Qua màn giữ thời gian; thử lại đặt thời gian về 0 và giữ màn. Đổi chế độ bắt đầu lại màn 1. Lựa chọn được lưu trong trình duyệt.

## Endless (mặc định)

Endless bấm liên tục: mỗi lần trúng thêm 1 điểm, đổi chiều và tạo mục tiêu mới. Không dừng giữa màn; bấm sai hoặc để kim vượt vùng trúng sẽ kết thúc. Tốc độ tăng theo thời gian đang chơi với ba mức khó; vùng trúng giữ nguyên. Chơi lại đặt điểm và thời gian về 0. Kỷ lục Endless lưu riêng; Home hiển thị số lần trúng cao nhất.

Chọn “Theo màn” để chơi luật mở khóa theo màn như trước. Chuyển kiểu chơi hoặc mức khó bắt đầu lượt mới. Mỗi lần mở game mặc định Endless; mức khó gần nhất vẫn được lưu.
