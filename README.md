# Đánh giá bác sĩ khối ngoại sau đào tạo chuyên môn

Dashboard web (React + TypeScript + Vite) để theo dõi hiệu quả đào tạo chuyên môn của bác sĩ khối ngoại theo **bộ 9 tiêu chí**, so sánh **trước – trong – sau** đào tạo. Chạy hoàn toàn trên trình duyệt: file Excel được đọc ngay tại máy người dùng, **không gửi đi đâu**.

## 9 tiêu chí

| # | Tiêu chí (tên sheet) | Kỳ dữ liệu | Chiều tốt |
|---|---|---|---|
| 1 | Năng suất khám bệnh ngoại trú | tháng | cao hơn |
| 2 | Tỷ lệ tự chủ phẫu thuật | tháng | cao hơn |
| 3 | Tỷ lệ tham gia phẫu thuật tại khoa | tháng | cao hơn |
| 4 | Phân loại độ khó ca mổ | 6 tháng | cao hơn |
| 5 | Tỷ lệ biến chứng phẫu thuật | 6 tháng | **thấp hơn** |
| 6 | Tỷ lệ tử vong hoặc tái phẫu thuật cấp cứu | 6 tháng | **thấp hơn** |
| 7 | Thời gian nằm viện trung bình sau mổ | 6 tháng | **thấp hơn** |
| 8 | Số lượng NCKH & sáng kiến cải tiến | năm | cao hơn |
| 9 | Chỉ số tuân thủ quy trình an toàn phẫu thuật | 6 tháng | cao hơn |

Đơn vị và chiều "tốt" có thể sửa trong [`src/lib/metrics.ts`](src/lib/metrics.ts) (đoán theo tên tiêu chí, hãy kiểm tra lại cho đúng với bệnh viện).

## Tính năng

**5 màn hình**
- **Tổng quan** – bảng điểm 9 tiêu chí (trước → sau, % thay đổi, mini-chart, đạt mục tiêu), xu hướng toàn viện / theo khoa / từng người, nhận định nhanh, bảng nhiệt, mức đầy đủ dữ liệu.
- **Theo khoa** – bảng nhiệt của khoa, biểu đồ so sánh các bác sĩ trong khoa hoặc trung bình khoa.
- **Nhân viên** – nhận xét tự động, bảng 9 tiêu chí (trước/trong/sau, xu hướng sau đào tạo, mục tiêu), biểu đồ có thể so với trung bình khoa, cột phân kỳ và radar Trước/Sau, xuất CSV.
- **So sánh** – đặt tối đa 8 bác sĩ cạnh nhau trên cùng một tiêu chí, căn theo mốc **T0** (tháng bắt đầu đào tạo) để so được các khoá khác nhau.
- **Dữ liệu** – mức đầy đủ dữ liệu theo từng người × tiêu chí, thiết lập ngưỡng/mục tiêu, xuất CSV tổng hợp.

**Biểu đồ tùy biến** (nút `⚙ Tùy chỉnh`, lưu trên trình duyệt)
kiểu đường / vùng / cột · làm mượt · điểm dữ liệu · nhãn số · vùng Trước-Trong-Sau · đường TB từng giai đoạn · đường xu hướng · trung bình trượt 3/6 kỳ · đường mục tiêu · thanh thu phóng · 4 bảng màu · 3 cỡ · trục theo lịch hoặc căn T0 · xuất ảnh PNG.

**Giao diện điện thoại**: thanh điều hướng ở đáy màn hình, bảng chuyển thành thẻ, danh sách chuyển thành thanh cuộn ngang.

## Chạy trên máy

Cần [Node.js](https://nodejs.org) 18 trở lên.

```bash
npm install
npm run dev        # mở http://localhost:5173
npm test           # kiểm thử phần tính toán
npm run build      # xuất bản vào thư mục dist/
```

Chưa có file thật? Bấm **Tải file → Xem thử với dữ liệu mẫu**.

## Đưa lên GitHub và tự động xuất bản (GitHub Pages)

```bash
git init
git add .
git commit -m "Khởi tạo dashboard đánh giá BS khối ngoại"
git branch -M main
git remote add origin https://github.com/<tai-khoan>/<ten-repo>.git
git push -u origin main
```

Sau đó trên GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
Mỗi lần push lên `main`, workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) sẽ chạy test, build và đăng lên `https://<tai-khoan>.github.io/<ten-repo>/`.

> ⚠️ **Dữ liệu bệnh viện**: file `.xlsx`/`.csv` đã được đưa vào `.gitignore` để không vô tình commit tên và số liệu của bác sĩ. Nếu repo để **Public**, bất kỳ ai cũng mở được trang web (nhưng không thấy dữ liệu, vì mỗi người tự tải file của mình). Nếu muốn giới hạn người truy cập, dùng repo **Private** với GitHub Pages của gói trả phí, hoặc chạy nội bộ bằng `npm run build` rồi đưa thư mục `dist/` lên máy chủ của bệnh viện.

## Định dạng file Excel

Mỗi sheet là một tiêu chí; sheet được nhận diện theo từ khoá trong tên (không phân biệt hoa/thường, có dấu hay không). Trong mỗi sheet:

1. Dòng tiêu đề và dòng header: `Mã nhân viên | Xưng hô | Họ và tên | Khoa phòng | Tên lớp | Từ ngày | Đến ngày | …`
2. Dòng **mốc thời gian** (7 cột đầu để trống, từ cột thứ 8 là các kỳ): ô ngày (theo tháng) hoặc text `09/2019-02/2020` (6 tháng) / `09/2019-08/2020` (năm).
3. Các dòng nhân viên ngay bên dưới. Một sheet có thể có nhiều khối (mỗi khối một dòng mốc thời gian + các nhân viên cùng khoá).

Ô trống = chưa có số liệu (khác với số `0`, là giá trị hợp lệ).

## Cách tính

- **Giai đoạn**: kỳ kết thúc trước tháng vào lớp = *Trước*; kỳ bắt đầu sau tháng ra lớp = *Sau*; còn lại = *Trong*. Giá trị mỗi giai đoạn là trung bình các kỳ.
- **Mức thay đổi** = (Sau − Trước) ÷ |Trước|, đảo dấu với tiêu chí "thấp hơn là tốt" nên dương luôn là tốt lên. Vượt ngưỡng ±X% (mặc định 10%, chỉnh được) mới tính là *Cải thiện* / *Giảm sút*.
- **Điểm tổng hợp** = trung bình mức thay đổi của các tiêu chí đủ dữ liệu, mỗi tiêu chí giới hạn ±100%.
- **Xu hướng sau đào tạo** = độ dốc hồi quy tuyến tính trên các kỳ thuộc giai đoạn *Sau* (cần ≥ 3 kỳ).

## Cấu trúc mã nguồn

```
src/
├─ lib/
│  ├─ metrics.ts     9 tiêu chí: tên, đơn vị, chiều tốt, từ khoá sheet
│  ├─ parse.ts       đọc các sheet → dữ liệu nhân viên (hàm thuần, có test)
│  ├─ readExcel.ts   bọc thư viện xlsx
│  ├─ stats.ts       giai đoạn, thay đổi, xu hướng, chuỗi theo T0, tổng hợp
│  ├─ insights.ts    nhận xét tự động
│  ├─ settings.tsx   thiết lập + tuỳ chọn biểu đồ (lưu localStorage)
│  ├─ export.ts      xuất CSV / PNG
│  └─ demo.ts        dữ liệu mẫu giả lập
├─ components/       MetricChart (biểu đồ tùy biến), Heatmap, Effects, MetricTable, ui…
├─ views/            Overview, Dept, Staff, Compare, Data
└─ App.tsx
tests/logic.test.ts  kiểm thử phần tính toán
```

## Ghi chú

- Thư viện đọc Excel là `xlsx` (SheetJS) bản 0.18.5 trên npm. Ứng dụng chỉ đọc file do chính người dùng chọn trên máy họ.
- Bản dựng chưa có `package-lock.json`; sau lần `npm install` đầu tiên hãy commit file này để các lần build sau cố định phiên bản.
