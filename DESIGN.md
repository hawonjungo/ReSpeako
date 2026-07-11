---
name: ReSpeako Calm Focus
colors:
  primary: "#2D6E5E"
  secondary: "#5B6B73"
  tertiary: "#E08A3C"
  neutral: "#F6F5F2"
  surface: "#FFFFFF"
  on-surface: "#1F2A2E"
  error: "#C84B3C"
typography:
  h1:
    fontFamily: Inter
    fontSize: 2rem
    fontWeight: 600
  h2:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: 600
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: 400
  label-caps:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: 500
rounded:
  sm: 6px
  md: 12px
  lg: 20px
spacing:
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    borderRadius: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
    borderRadius: "{rounded.md}"
  card:
    backgroundColor: "{colors.surface}"
    borderRadius: "{rounded.lg}"
    padding: "{spacing.lg}"
  recording-indicator-active:
    backgroundColor: "{colors.tertiary}"
    textColor: "#FFFFFF"
  recording-indicator-idle:
    backgroundColor: "{colors.secondary}"
    textColor: "#FFFFFF"
---

## Overview

ReSpeako là app luyện tiếng Anh tập trung vào nói và nghe (STT, TTS, IPA
Checker). Người dùng đang trong trạng thái luyện tập — cần sự tập trung,
không bị phân tâm bởi giao diện. Phong cách: **Calm Focus** — điềm tĩnh,
đáng tin cậy, giống một phòng luyện ngôn ngữ yên tĩnh hơn là một app mạng
xã hội nhiều màu sắc.

## Colors

Bảng màu dùng nền trung tính, một màu chính (xanh rêu đậm) cho hành động,
và một màu nhấn (cam) chỉ dùng riêng cho trạng thái "đang ghi âm / đang
hoạt động" để người dùng luôn biết khi nào mic đang mở.

- **Primary (#2D6E5E):** Xanh rêu đậm, dùng cho nút chính, liên kết, tiêu
  đề quan trọng. Gợi cảm giác tin cậy, không gây mỏi mắt khi nhìn lâu.
- **Secondary (#5B6B73):** Xám-xanh nhạt, dùng cho text phụ, border,
  trạng thái không hoạt động.
- **Tertiary (#E08A3C):** Cam ấm — CHỈ dùng cho chỉ báo đang ghi âm/đang
  phát audio, để nổi bật rõ giữa nền trung tính.
- **Neutral (#F6F5F2):** Nền tổng thể, kem nhạt, giảm chói mắt khi học
  lâu (so với trắng tinh).
- **Error (#C84B3C):** Chỉ dùng cho lỗi phát âm/lỗi hệ thống, không dùng
  cho cảnh báo nhẹ.

## Typography

Inter cho toàn bộ giao diện — rõ ràng ở cả kích thước nhỏ, quan trọng vì
app hiển thị phiên âm IPA và văn bản cần đọc chính xác.

- **Headlines:** Inter Semi-Bold, dùng cho tên bài luyện, tiêu đề module.
- **Body:** Inter Regular 16px, dùng cho câu cần đọc/nghe — đủ lớn để
  đọc thoải mái trong lúc luyện nói.
- **Labels:** Inter Medium, viết hoa, dùng cho nhãn trạng thái (ví dụ:
  "ĐANG GHI ÂM", "HOÀN THÀNH").

## Components

- **button-primary:** Nút hành động chính (Bắt đầu ghi âm, Phát audio).
- **button-secondary:** Nút phụ (Thử lại, Bỏ qua).
- **card:** Khối chứa từng bài luyện hoặc kết quả chấm điểm, bo góc lớn
  để tạo cảm giác mềm mại, thân thiện.
- **recording-indicator-active / idle:** Hai biến thể bắt buộc phải khác
  màu rõ rệt — người dùng cần nhận biết ngay trạng thái mic chỉ bằng
  màu sắc, không cần đọc text.
