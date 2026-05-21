# iPhone Dynamic Wallpaper Service (R2 + Workers)

這是一個基於 Cloudflare Workers 和 R2 建立的動態桌布 API。

## API 說明

### 1. 隨機獲取桌布
- **URL**: `GET /random?folder=資料夾名稱`
- **範例**: `https://your-worker.me/random?folder=Work`
- **說明**: 從指定資料夾中隨機挑選一張圖片並回傳。

### 2. 上傳圖片
- **URL**: `POST /upload?folder=資料夾名稱`
- **Header**: `Authorization: Bearer YOUR_SECRET`
- **Body**: 圖片二進位資料
- **說明**: 讓 iPhone 捷徑直接將照片傳到 R2 儲存。

## 部署方式
1. 在 Cloudflare 控制台建立 R2 Bucket 名為 `my-wallpapers`。
2. 串接此 GitHub Repo 至 Cloudflare Workers。
3. 在 Workers 設定中新增環境變數 `AUTH_SECRET` 作為上傳金鑰。
