\# ReSpeako - Copilot Instructions



\## Mục tiêu project

ReSpeako là app luyện tiếng Anh tập trung vào PTE Academic, gồm 3 module chính:

\- \*\*STT (Speech-to-Text)\*\*: ghi âm người dùng, chuyển thành text để kiểm tra fluency

\- \*\*TTS (Text-to-Speech)\*\*: đọc văn bản để luyện shadowing/nghe

\- \*\*IPA Checker\*\*: hiển thị phiên âm IPA, kiểm tra phát âm



Đối tượng dùng: người học tiếng Anh trình độ trung cấp, đang luyện thi PTE Academic, target band 65+.



\## Nguyên tắc code khi Copilot generate

\- Component React function, dùng hooks (useState, useEffect), KHÔNG class component

\- Giữ style hiện có của project (kiểm tra file tương tự trước khi tạo file mới)

\- Mọi text hiển thị cho người dùng cuối nên hỗ trợ song ngữ Anh-Việt nếu UI hiện tại đang làm vậy

\- Ưu tiên accessibility: label rõ ràng cho input, button có aria-label khi chỉ có icon

\- Không hardcode API key — luôn dùng biến môi trường (.env)

\- Comment ngắn gọn bằng tiếng Anh cho logic phức tạp



\## Khi thêm tính năng mới liên quan PTE

Các tính năng định hướng PTE cần tuân theo format chuẩn:

\- \*\*Read Aloud\*\*: giới hạn 30-40 giây chuẩn bị + đọc

\- \*\*Repeat Sentence\*\*: câu dài 3-9 từ tùy độ khó

\- \*\*Write from Dictation\*\*: câu 5-20 từ

\- \*\*Describe Image\*\*: 25 giây chuẩn bị + 40 giây nói

\- Mọi tính năng chấm điểm nên có thang điểm tham khảo 0-90 giống PTE thật (không bắt buộc chính xác 100%, chỉ cần định hướng đúng)



\## Cấu trúc thư mục ưu tiên

\- `src/components/` - UI components

\- `src/hooks/` - custom hooks (useSTT, useTTS, useIPA nếu có)

\- `src/utils/` - hàm xử lý logic, so sánh text, tính điểm

\- `src/data/` - wordlists, PTE templates, sample texts



\## Không làm

\- Không tự ý đổi thư viện STT/TTS/IPA hiện tại nếu không được yêu cầu

\- Không xóa code cũ khi thêm feature mới — comment lại nếu cần thay thế, hỏi trước khi xóa hẳn

\- Không thêm dependency mới nặng nếu có thể giải quyết bằng vanilla JS/React

