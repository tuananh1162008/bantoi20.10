# Thiệp 20/10

Trang web tĩnh, có thể chạy trực tiếp trên GitHub Pages.

## Bật GitHub Pages

1. Mở **Settings → Pages** của repository.
2. Trong **Build and deployment**, chọn **Deploy from a branch**.
3. Chọn nhánh `main`, thư mục `/(root)`, rồi nhấn **Save**.
4. Mở URL GitHub Pages được hiển thị ở phần Pages.

`index.html` ở gốc repository là trang chính. Các tài nguyên và bối cảnh 3 dùng đường dẫn tương đối để hoạt động trong URL project pages.

## Chạy thử trên máy

Mở `index.html` trong trình duyệt hoặc chạy một máy chủ tĩnh tại thư mục gốc repository, ví dụ:

```powershell
py -m http.server 8000
```

Sau đó mở `http://localhost:8000`.
