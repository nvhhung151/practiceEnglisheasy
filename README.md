# English Easy – Website học tiếng Anh cho người học yếu

## Cách chạy demo

1. Giải nén / mở thư mục `english-easy`
2. Mở file `index.html` bằng trình duyệt (Chrome/Edge khuyến nghị)
   - Hoặc dùng Live Server trong VS Code cho tiện

## Tính năng hiện có

### Dành cho người học
- Trang chủ chọn chủ đề
- Học từ vựng theo danh sách + Flashcard
- Nghe phát âm (Web Speech API)
- Bài tập trắc nghiệm (Quiz)
- Giao diện tiếng Việt, chữ to, dễ dùng

### Dành cho Admin (bạn)
- Mật khẩu: `123456@Hung`
- Thêm / Sửa / Xóa từ vựng
- Import file **JSON** hoặc **CSV**
- Export ra file `vocabulary.json`
- Dữ liệu được lưu tạm trong localStorage của trình duyệt

## Cách cập nhật từ vựng lâu dài

1. Vào trang **Admin** → Export JSON
2. Lưu file `vocabulary.json` mới
3. Thay thế file `data/vocabulary.json` trong project
4. Upload lại lên hosting (Netlify, Vercel, GitHub Pages...)

Hoặc bạn có thể tiếp tục dùng localStorage khi test trên máy.

## Cấu trúc thư mục

```
english-easy/
├── index.html
├── vocabulary.html
├── quiz.html
├── admin.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   └── admin.js
└── data/
    └── vocabulary.json
```

## Ghi chú kỹ thuật

- Hoàn toàn frontend (HTML + CSS + JS thuần)
- Không cần server khi chạy local
- Phát âm dùng `speechSynthesis` của trình duyệt
- Dữ liệu mẫu có sẵn 18 từ thuộc 6 chủ đề: Food, Family, Colors, Numbers, School, Daily

Chúc bạn học IT vui và làm được website hay!
