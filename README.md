# iPhone Dynamic Wallpaper Service (R2 + Workers)

基於 Cloudflare Workers + R2 的動態桌布 API，專為 iPhone 捷徑自動換桌布設計。

---

## API

| Method | Path | 說明 |
|--------|------|------|
| GET | `/random?folder=xxx` | 隨機回傳一張圖片（binary） |
| GET | `/random?folder=*` | 跨所有資料夾隨機回傳一張圖片 |
| POST | `/upload?folder=xxx` | 上傳圖片（需 Auth header） |
| GET | `/folders` | 列出所有資料夾 |

---

## 部署

### 前置條件

```bash
npm install -g wrangler
wrangler login
```

### 建立 R2 Bucket

```bash
wrangler r2 bucket create my-wallpapers
```

或登入 Cloudflare Dashboard > R2 > Create bucket，命名 `my-wallpapers`。

上傳第一張圖到 `default/` 資料夾，避免 API 首次呼叫回傳 404。

### 設定 AUTH_SECRET

```bash
wrangler secret put AUTH_SECRET
# 輸入一組自訂密鑰，例如：my_ios_secret_123
```

### 部署 Worker

```bash
wrangler deploy
```

部署完成後會輸出 Worker URL，格式為 `https://wallpaper-api.<your-subdomain>.workers.dev`。

---

## GitHub Actions CI/CD（可選）

> 如果想 push 到 main 就自動部署，設定以下 workflow。否則直接用 `wrangler deploy` 即可。

**1. 取得 Cloudflare API Token**

Dashboard > My Profile > API Tokens > Create Token > 選 `Edit Cloudflare Workers` 模板。

**2. 在 GitHub repo 加入 secret**

Settings > Secrets and variables > Actions > New repository secret：
- Name: `CLOUDFLARE_API_TOKEN`
- Value: 剛才的 token

**3. 建立 workflow 檔案**

```bash
mkdir -p .github/workflows
```

`.github/workflows/deploy.yml`：

```yaml
name: Deploy Worker

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install -g wrangler
      - run: wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

之後每次 push main，GitHub Actions 自動部署。

---

## iPhone 捷徑設定

### 捷徑 1：隨機換桌布（抓圖用）

1. 新增動作「取得網址內容」
   - URL：`https://你的Worker網址/random?folder=default`
   - 方法：GET
2. 新增動作「設定背景圖片」
   - 影像：選「URL 內容」
   - **展開「顯示更多」，關閉「Show Preview（顯示預覽）」**，否則自動化時會跳出確認視窗

### 捷徑 2：綁定專注模式（自動觸發）

捷徑 App > 自動化 > + > 專注模式 > 選「開啟時」> 立即執行 > 執行捷徑 > 隨機換桌布

### 捷徑 3：上傳圖片（分享選單）

1. 建立捷徑，Settings 開啟「在分享表單中顯示」，類型選「影像」
2. 新增動作「取得網址內容」
   - URL：`https://你的Worker網址/upload?folder=default`
   - 方法：POST
   - Headers：`Authorization` = `Bearer 你的AUTH_SECRET`
   - 要求內文：檔案，指定為捷徑輸入的影像

---

## 資料夾管理

R2 bucket 內以資料夾區分主題，例如：

```
my-wallpapers/
  default/
  dark/
  nature/
```

捷徑 URL 改 `?folder=dark` 即可切換主題。

`?folder=*` 會跨所有資料夾隨機抽，適合設成「完全隨機換桌布」捷徑。
