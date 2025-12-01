# 頭像圖片修復說明

## 問題描述

在 `optimize-wallet-popups` 分支中，用戶報告頭像圖片無法顯示。

## 問題原因

頭像無法顯示的主要原因是：

### 1. **環境變數未正確載入**

在生產環境（如 Zeabur）部署時，如果環境變數沒有在平台設定中配置，`WALRUS_AGGREGATOR` 和 `WALRUS_PUBLISHER` 會是 `undefined`，導致頭像 URL 格式錯誤。

**錯誤的 URL 範例：**
```
undefined/v1/blobs/abc123...
```

### 2. **缺少預設值**

原本的程式碼沒有為 Walrus URL 提供預設值，一旦環境變數載入失敗，整個頭像系統就會失效。

### 3. **錯誤處理不足**

當 Walrus URL 無效時，雖然應該降級到 DiceBear 預設頭像，但由於 URL 格式錯誤，可能導致整個頭像組件渲染失敗。

## 解決方案

### 修改 1: 在 `constants.ts` 中添加預設值

```typescript
// 修改前
export const WALRUS_PUBLISHER = import.meta.env.VITE_WALRUS_PUBLISHER;
export const WALRUS_AGGREGATOR = import.meta.env.VITE_WALRUS_AGGREGATOR;

// 修改後
export const WALRUS_PUBLISHER = import.meta.env.VITE_WALRUS_PUBLISHER || 'https://publisher.walrus-testnet.walrus.space';
export const WALRUS_AGGREGATOR = import.meta.env.VITE_WALRUS_AGGREGATOR || 'https://aggregator.walrus-testnet.walrus.space';
```

**效果：**
- 即使環境變數未設定，也能使用預設的 Walrus testnet 端點
- 確保 URL 始終有效

### 修改 2: 改進 `useChat.ts` 中的頭像 URL 驗證

```typescript
// 修改前
if (avatarBlobId && avatarBlobId.trim() !== '' && !avatarBlobId.startsWith('default_')) {
    senderAvatar = `${WALRUS_AGGREGATOR}/v1/blobs/${avatarBlobId}`;
}

// 修改後
if (avatarBlobId && avatarBlobId.trim() !== '' && !avatarBlobId.startsWith('default_') && WALRUS_AGGREGATOR) {
    senderAvatar = `${WALRUS_AGGREGATOR}/v1/blobs/${avatarBlobId}`;
    console.log('Sender avatar URL:', senderAvatar);
} else {
    console.log('Using default avatar (blob ID invalid or aggregator not configured)');
}
```

**改進點：**
- 新增 `WALRUS_AGGREGATOR` 存在性檢查
- 添加詳細的日誌記錄以便除錯
- 確保只有在所有條件滿足時才構建 Walrus URL

### 修改 3: 改進 `useProfile.ts` 中的頭像 URL 驗證

```typescript
// 修改前
const isValidBlobId = avatarBlobId &&
                      avatarBlobId.trim() !== '' &&
                      !avatarBlobId.startsWith('default_');

// 修改後
const isValidBlobId = avatarBlobId &&
                      avatarBlobId.trim() !== '' &&
                      !avatarBlobId.startsWith('default_') &&
                      WALRUS_AGGREGATOR;
```

**改進點：**
- 確保 `WALRUS_AGGREGATOR` 已定義才使用 Walrus URL
- 添加日誌以追蹤頭像載入狀態

### 修改 4: 更新環境變數配置

**添加到 `.env` 和 `.env.example`：**
```env
# WebSocket Server Configuration (for typing indicator)
VITE_WS_SERVER_URL=http://localhost:3001
```

**添加除錯日誌（僅開發環境）：**
```typescript
if (import.meta.env.DEV) {
  console.log('Environment variables loaded:', {
    PACKAGE_ID,
    CHAT_ROOM_ID,
    WALRUS_PUBLISHER,
    WALRUS_AGGREGATOR,
    ENABLE_WALRUS: import.meta.env.VITE_ENABLE_WALRUS
  });
}
```

## 頭像系統工作原理

### 頭像載入流程

```
1. 檢查用戶是否有自訂頭像 (avatar_walrus_blob_id)
   ↓
2. 如果有 → 驗證 blob ID 是否有效
   ↓
3. 驗證 WALRUS_AGGREGATOR 是否已配置
   ↓
4. 構建 Walrus URL: `${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`
   ↓
5. 如果以上任何步驟失敗 → 使用 DiceBear 預設頭像
   ↓
6. DiceBear URL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`
```

### 頭像顯示優先順序

1. **第一優先：Walrus 自訂頭像**
   - 用戶上傳的圖片
   - 儲存在 Walrus 去中心化儲存
   - URL 格式：`https://aggregator.walrus-testnet.walrus.space/v1/blobs/{blobId}`

2. **第二優先：DiceBear 生成頭像**
   - 基於錢包地址生成的 SVG 頭像
   - 無需儲存，即時生成
   - URL 格式：`https://api.dicebear.com/7.x/avataaars/svg?seed={address}`

3. **最後降級：文字頭像**
   - Radix UI Avatar 組件的 fallback
   - 顯示用戶名稱的第一個字母
   - 例如：用戶名 "Alice" → 顯示 "A"

## Zeabur 部署配置

在 Zeabur 部署時，必須在環境變數設定中添加以下變數：

### 必需的環境變數

```env
# Sui Network
VITE_SUI_NETWORK=testnet

# Contract IDs
VITE_PACKAGE_ID=0x975450d66596a01c027f09a6f4126fe0203eb1714d038ce5ba6bc025cd9baf58
VITE_CHAT_ROOM_ID=0xad974ec7435443fd0c244df92b71ba56d96155c1f70baf459befc3bbf3c10fcd

# Walrus Storage
VITE_WALRUS_AGGREGATOR=https://aggregator.walrus-testnet.walrus.space
VITE_WALRUS_PUBLISHER=https://publisher.walrus-testnet.walrus.space
VITE_ENABLE_WALRUS=true

# WebSocket Server (需要另外部署 WebSocket 服務器)
VITE_WS_SERVER_URL=https://your-websocket-server-url.zeabur.app
```

### 配置步驟

1. 進入 Zeabur 專案設定
2. 選擇 frontend 服務
3. 點擊 "Environment Variables"
4. 逐一添加上述環境變數
5. 重新部署服務

## 測試驗證

### 開發環境測試

```bash
# 1. 確保 .env 文件存在並包含所有必需變數
cat frontend/.env

# 2. 啟動開發伺服器
cd frontend
npm run dev

# 3. 打開瀏覽器控制台，檢查是否有環境變數載入日誌
# 應該看到類似這樣的輸出：
# Environment variables loaded: {
#   PACKAGE_ID: "0x975...",
#   CHAT_ROOM_ID: "0xad9...",
#   WALRUS_PUBLISHER: "https://publisher.walrus-testnet.walrus.space",
#   WALRUS_AGGREGATOR: "https://aggregator.walrus-testnet.walrus.space",
#   ENABLE_WALRUS: true
# }

# 4. 測試頭像是否正常顯示
# - 檢查聊天室訊息中的頭像
# - 檢查右側用戶列表中的頭像
# - 檢查機器人頭像
```

### 生產環境測試

```bash
# 1. 構建生產版本
npm run build

# 2. 預覽生產版本
npm run preview

# 3. 檢查以下項目：
# - 頭像是否能正常載入
# - 如果 Walrus 頭像失敗，是否降級到 DiceBear
# - 如果圖片載入失敗，是否顯示文字頭像
```

## 除錯指南

### 如果頭像仍然無法顯示

1. **檢查瀏覽器控制台**
   ```
   - 查找 "Avatar blob ID:" 日誌
   - 查找 "Sender avatar URL:" 或 "Profile avatar URL:" 日誌
   - 查找 "Using default avatar" 日誌
   - 查找網路請求錯誤（404, CORS, 等）
   ```

2. **檢查網路請求**
   - 打開瀏覽器開發者工具 → Network 標籤
   - 篩選圖片請求
   - 檢查 Walrus 和 DiceBear 的請求狀態
   - 查看是否有 CORS 錯誤

3. **檢查環境變數**
   ```javascript
   // 在瀏覽器控制台執行：
   console.log({
     WALRUS_AGGREGATOR: import.meta.env.VITE_WALRUS_AGGREGATOR,
     WALRUS_PUBLISHER: import.meta.env.VITE_WALRUS_PUBLISHER,
   });
   ```

4. **檢查 Walrus 服務狀態**
   ```bash
   # 測試 Walrus Aggregator
   curl -I https://aggregator.walrus-testnet.walrus.space/v1/blobs/{blob_id}

   # 測試 DiceBear API
   curl -I https://api.dicebear.com/7.x/avataaars/svg?seed=test
   ```

5. **檢查用戶 Profile**
   ```javascript
   // 在開發者工具 Console 中：
   // 查看 useProfile hook 返回的數據
   // 檢查 avatar_walrus_blob_id 是否有效
   ```

## 常見問題

### Q1: 為什麼有些用戶有頭像，有些沒有？

**A:** 這是正常的。只有上傳過自訂頭像的用戶才會從 Walrus 載入圖片。沒有上傳的用戶會顯示 DiceBear 生成的預設頭像。

### Q2: DiceBear 頭像也無法顯示？

**A:** 檢查：
- 網路連線是否正常
- 是否有防火牆或網路策略阻止外部圖片
- DiceBear API 是否正常運作（https://status.dicebear.com）

### Q3: 在 Zeabur 上部署後頭像消失？

**A:** 確保在 Zeabur 環境變數中設定了所有必需的 `VITE_*` 變數。`.env` 文件在生產環境不會被讀取。

### Q4: 為什麼控制台顯示 "undefined/v1/blobs/..."？

**A:** 這表示 `WALRUS_AGGREGATOR` 環境變數未正確載入。檢查：
1. `.env` 文件是否存在
2. 環境變數名稱是否正確（必須以 `VITE_` 開頭）
3. 是否重新啟動了開發伺服器

## 相關文件

- [Walrus Documentation](https://docs.walrus.site/)
- [DiceBear Avatars](https://www.dicebear.com/)
- [Radix UI Avatar Component](https://www.radix-ui.com/themes/docs/components/avatar)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

## 修改歷史

| 日期 | 版本 | 變更說明 |
|------|------|----------|
| 2025-12-01 | 1.0.0 | 初始版本 - 修復頭像圖片無法顯示的問題 |

## 影響範圍

此修改影響以下文件：

- ✅ `frontend/src/config/constants.ts` - 添加預設值和除錯日誌
- ✅ `frontend/src/hooks/useChat.ts` - 改進頭像 URL 驗證
- ✅ `frontend/src/hooks/useProfile.ts` - 改進頭像 URL 驗證
- ✅ `frontend/.env` - 添加 VITE_WS_SERVER_URL
- ✅ `frontend/.env.example` - 更新範例配置

## 總結

這次修復主要解決了環境變數未正確載入導致的頭像顯示問題。通過添加預設值、改進驗證邏輯、增加除錯日誌，確保頭像系統在各種環境下都能正常工作。

即使在最壞的情況下（Walrus 和 DiceBear 都失敗），用戶仍然能看到文字頭像，保證了良好的用戶體驗。
