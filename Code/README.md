# Airbnb NYC — Data Visualization Dashboard

Dashboard trực quan hóa dữ liệu đánh giá Airbnb tại New York City, xây dựng bằng **D3.js** (v7) thuần HTML/CSS/JS.

## Cấu trúc thư mục

```
Code/
├── index.html                    # Trang chính
├── style.css                     # Stylesheet
├── js/
│   ├── data.js                   # Tải CSV và tạo lookup Maps
│   ├── filters.js                # Quản lý trạng thái filter & cross-filter
│   ├── main.js                   # Entry point, kết nối các module
│   ├── navigation.js             # Chuyển đổi dashboard (combobox)
│   ├── resizers.js               # Kéo thả thay đổi kích thước panel
│   └── charts/
│       ├── lineChart.js          # Biểu đồ đường (review theo năm)
│       ├── barChart.js           # Biểu đồ cột ngang (review theo khu phố)
│       └── sentimentTable.js     # Bảng sentiment heatmap
├── design.md                     # Tài liệu thiết kế UI
```

## Yêu cầu

- Trình duyệt hiện đại (Chrome, Firefox, Edge)
- Một HTTP server cục bộ (không mở file trực tiếp bằng `file://`)

## Cách chạy

### Cách 1: Node.js — http-server (khuyến nghị)

```bash
cd "Data visualization"
npx -y http-server . -p 8000
```

Mở trình duyệt: **http://localhost:8000/Code/index.html**

### Cách 2: VS Code — Live Server Extension

1. Cài extension **Live Server** trong VS Code
2. Click chuột phải vào `Code/index.html` → **Open with Live Server**

## Dữ liệu

Dashboard đọc 3 file CSV nằm ở thư mục gốc của project:

| File | Mô tả |
|------|--------|
| `fixed_data/fixed_listings.csv` | Dữ liệu listings đã được làm sạch |
| `fixed_data/fixed_reviews_sentiment.csv` | Dữ liệu reviews kèm nhãn sentiment |
| `listings.csv` | Dữ liệu listings gốc (lấy host_name) |

> **Lưu ý:** Các file CSV có dung lượng lớn và đã được thêm vào `.gitignore`. Đảm bảo các file này tồn tại trước khi chạy dashboard.

## Tính năng

- **Cross-filtering**: Click vào bất kỳ element nào (năm, quận, khu phố, sentiment) để lọc toàn bộ dashboard
- **Resizable panels**: Kéo thả thanh ngăn để thay đổi kích thước các panel
- **Sort toggle**: Nút sắp xếp tăng/giảm dần cho biểu đồ cột
- **Dashboard navigation**: Combobox chuyển đổi giữa các dashboard
