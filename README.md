# APK Dashboard

Dashboard quản trị đơn giản: upload/xóa APK + checklist công việc. Chạy độc lập bằng Express, không cần build frontend.

## Cài đặt & chạy

```bash
npm install
node server.js
```

Mở trình duyệt: `http://localhost:3000`

Đổi port: `PORT=8080 node server.js`

## Cấu trúc

```
apk-dashboard/
├── server.js          # Express server (API + serve static)
├── package.json
├── uploads/            # File .apk được lưu ở đây (tự tạo)
├── data/
│   └── tasks.json      # Dữ liệu checklist (tự tạo)
└── public/
    ├── index.html
    ├── style.css
    └── app.js
```

## API

| Method | Endpoint                      | Mô tả                     |
|--------|-------------------------------|---------------------------|
| POST   | /api/apks/upload               | Upload file APK (multipart, field `file`) |
| GET    | /api/apks                      | Danh sách APK             |
| DELETE | /api/apks/:filename             | Xóa 1 file APK             |
| GET    | /api/apks/:filename/download    | Tải file APK               |
| GET    | /api/tasks                     | Danh sách công việc        |
| POST   | /api/tasks                      | Thêm công việc (`{ text }`) |
| PUT    | /api/tasks/:id                  | Sửa/tick công việc (`{ text?, done? }`) |
| DELETE | /api/tasks/:id                  | Xóa công việc               |

## Ghi chú triển khai lên VPS

- Chạy nền bằng PM2: `pm2 start server.js --name apk-dashboard`
- Reverse proxy qua Nginx nếu muốn gắn domain/SSL.
- Nhớ set giới hạn dung lượng upload phù hợp ở Nginx (`client_max_body_size`) vì mặc định server.js đang giới hạn APK tối đa 500MB.
- Thư mục `uploads/` và `data/` nên được backup hoặc mount ra ngoài nếu deploy bằng Docker.
