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

fixed_data/
├── fixed_listings.csv
├── fixed_reviews_sentiment.csv
├── fixed_calendar.csv
├── neighbourhoods.geojson


```

## Cách chạy

### 1. Cài Node.js

Tải và cài Node.js bản LTS từ:

```text
https://nodejs.org
```

Kiểm tra sau khi cài:

```bash
node --version
npm --version
```

### 2. Chuẩn bị dữ liệu

Đảm bảo thư mục `fixed_data` nằm ở thư mục gốc project và có đủ các file:

```text
fixed_data/fixed_listings.csv
fixed_data/fixed_reviews_sentiment.csv
fixed_data/neighbourhoods.geojson
```


### 3. Chạy project

Mở terminal tại thư mục gốc project, nơi có `package.json`, rồi chạy một trong các cách sau.

#### Windows

```bash
.\start.bat
```

#### macOS / Linux

```bash
chmod +x ./start.sh
./start.sh
```

#### Chạy bằng npm

```bash
npm start
```

Sau đó mở trình duyệt tại:

```text
http://localhost:8000/Code/index.html
```

Nếu cổng `8000` đang bị chiếm, chạy thủ công bằng cổng khác:

```bash
npx -y http-server . -p 8001
```

và mở:

```text
http://localhost:8001/Code/index.html
```

### Cách khác: VS Code Live Server

1. Cài extension **Live Server** trong VS Code
2. Click chuột phải vào `Code/index.html` → **Open with Live Server**

## Dữ liệu

Dashboard đọc các file trong thư mục `fixed_data`:

| File | Mô tả |
|------|--------|
| `fixed_data/fixed_listings.csv` | Dữ liệu listings đã được làm sạch |
| `fixed_data/fixed_reviews_sentiment.csv` | Dữ liệu reviews kèm nhãn sentiment |
| 'fixed_data/fixed_calendar.csv' | Dữ liệu lịch đặt trước đã được làm sạch |
| `fixed_data/neighbourhoods.geojson` | Dữ liệu ranh giới khu vực để vẽ bản đồ |


## Tính năng

- **Cross-filtering**: Click vào bất kỳ element nào (năm, quận, khu phố, sentiment) để lọc toàn bộ dashboard
- **Resizable panels**: Kéo thả thanh ngăn để thay đổi kích thước các panel
- **Sort toggle**: Nút sắp xếp tăng/giảm dần cho biểu đồ cột
- **Dashboard navigation**: Combobox chuyển đổi giữa các dashboard
