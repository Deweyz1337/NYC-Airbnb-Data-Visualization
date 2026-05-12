# Current UI Design Structure

This document outlines the current UI structure and design tokens based on `index.html` and `style.css`. You can use this as a reference or modify it to specify new UI requirements.

## 1. Layout & Grid System
- **Main Container**: Flexbox-based (`.dashboard`), takes full viewport height (`100vh`), padding: 12px.
- **Header**: Top area containing total metrics.
- **Main Grid** (`.main-grid`): Flexbox row layout, split into Left and Right columns.
  - **Left Column** (`.col-left`): Flexbox column layout. Contains Line Chart (top) and Sentiment Table (bottom).
  - **Right Column** (`#barPanel`): Contains the Bar Chart.
- **Resizers**: 
  - Horizontal (`.resizer-h`): Between left and right columns (width: 6px).
  - Vertical (`.resizer-v`): Between top and bottom panels in the left column (height: 6px).

## 2. Typography
- **Primary Font**: `Inter`, sans-serif (Weights: 300, 400, 500, 600, 700, 800, 900)
- **Big Numbers**: 48px, weight 300.
- **Panel Titles**: 16px, weight 400.
- **Table Headers/Data**: 12px - 13px, weight 600.

## 3. Color Palette
- **Backgrounds**:
  - Main Body: `#f0f0f0` (Light gray)
  - Main Grid/Panels: `#fff` (White)
  - Table Headers: `#f8f8f8`
- **Text Colors**:
  - Primary: `#333`
  - Secondary/Labels: `#666`
  - Tertiary/Brand: `#999`
- **Accents & Interaction**:
  - Primary Accent (Hover, Active Filters, Resizers): `#4472c4` (Blue)
- **Borders & Dividers**:
  - Grid Border: `#d0d0d0`
  - Table Rows/Spinner: `#ddd`, `#eee`

## 4. Components
- **Panels** (`.panel`): Padding 12px 16px, used as containers for charts and tables.
- **Loading Spinners**: 36px circular spinner with blue top border, animated rotation. Overlay loader with `rgba(255, 255, 255, 0.7)` background and 2px backdrop blur.
- **Tables** (`.sent-table`): Border-collapse, with bottom borders on rows. First column is left-aligned, others are center-aligned.
- **Custom Scrollbars**: 6px width with `#ddd` rounded thumb (Webkit).

## 5. Interaction States
- **Hover/Active Filters** (`.filter-active`): 2px solid blue outline (`#4472c4`).
- **Dimmed/Inactive** (`.filter-dimmed`): Opacity 0.25, blurred (1.5px), and grayscale (50%).
- **Clickable Elements** (`.clickable`, `.clickable-header`): Opacity fades or background changes on hover, indicating interactivity.

---
*Bạn có thể chỉnh sửa file này để thêm các yêu cầu thiết kế mới (màu sắc, layout, font chữ...) trước khi chúng ta tiếp tục code!*
