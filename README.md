# English Easy — Website học tiếng Anh

Frontend thuần HTML + CSS + JS. Học **từ vựng**, **cấu trúc câu theo Unit 1–10**, làm **quiz** (Admin set thời gian).

## Cách chạy

1. Mở thư mục project
2. Chạy server local (cần server vì `fetch` file JSON):

```powershell
python -m http.server 5500
```

3. Vào http://localhost:5500/

Hoặc dùng Live Server (VS Code).

## Tính năng

### Người học
- Từ vựng theo Unit + flashcard + phát âm
- **Cấu trúc câu theo Unit** (mẫu Summit 1) + flashcard
- Luyện tập: chỉ làm bài Admin tạo (từ vựng hoặc cấu trúc), có đếm ngược, xem đúng/sai sau bài

### Admin (mật khẩu: `123456@Hung`)
- Quản lý từ vựng: thêm/sửa/xóa, import/export JSON, CSV
- Quản lý cấu trúc câu: thêm/sửa/xóa, import/export JSON
- Tạo quiz: chọn **loại** (từ vựng / cấu trúc), Unit, số câu, **thời gian**
- Import/export danh sách quiz (`quizzes.json`)

## Lưu dữ liệu vĩnh viễn (GitHub)

Trên trình duyệt, dữ liệu tạm nằm trong **localStorage**. Để lưu vĩnh viễn:

1. Admin → **Export** file tương ứng
2. Ghi đè vào thư mục `data/`:
   - `data/vocabulary.json`
   - `data/structures.json`
   - `data/quizzes.json`
3. Commit & push lên GitHub
4. Hosting (GitHub Pages, Netlify…) sẽ phục vụ file mới

Mẫu schema:
- `data/structures.schema.example.json`
- `data/quizzes.schema.example.json`

## Cấu trúc thư mục

```
practiceEnglisheasy/
├── index.html
├── vocabulary.html
├── structures.html
├── quiz.html
├── admin.html
├── css/style.css
├── js/
│   ├── app.js
│   ├── admin.js
│   └── quiz-manager.js
└── data/
    ├── vocabulary.json
    ├── structures.json
    ├── quizzes.json
    └── *.schema.example.json
```

## Định dạng structures.json (rút gọn)

```json
[
  {
    "id": 1,
    "unit": "Unit 1",
    "name": "Tag questions",
    "pattern": "Statement, auxiliary + subject?",
    "meaning": "Câu hỏi đuôi — xác nhận thông tin",
    "form": "...",
    "example": "You're a student, aren't you?",
    "example_vi": "Bạn là sinh viên, đúng không?",
    "usage": "...",
    "notes": "Summit 1"
  }
]
```

## Định dạng quizzes.json

```json
[
  {
    "id": 1,
    "title": "Unit 1 — Cấu trúc",
    "type": "structure",
    "topic": "Unit 1",
    "count": 8,
    "timerSeconds": 300,
    "createdAt": "..."
  }
]
```

`type`: `"vocab"` | `"structure"` · `timerSeconds`: `0` = không giới hạn.

## Ghi chú

- Phần cấu trúc mẫu mang tính gợi ý theo Summit 1; bạn nên chỉnh/import đúng giáo trình lớp mình.
- Nếu thấy dữ liệu cũ: Admin → Reset file tương ứng, hoặc xóa localStorage domain đó.
