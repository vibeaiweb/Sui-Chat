# Sui Chat with AI Agents

一個基於 Sui 區塊鏈的去中心化聊天應用，集成了 AI 機器人助手和實時用戶列表功能。

## 📋 目錄

- [項目概述](#項目概述)
- [核心功能](#核心功能)
- [技術架構](#技術架構)
- [快速開始](#快速開始)
- [功能詳解](#功能詳解)
- [AI 機器人系統](#ai-機器人系統)
- [用戶管理](#用戶管理)
- [配置說明](#配置說明)
- [開發指南](#開發指南)
- [故障排除](#故障排除)

---

## 項目概述

Sui Chat 是一個完全去中心化的聊天應用，所有訊息和用戶資料都存儲在 Sui 區塊鏈上。應用使用 Walrus 去中心化存儲網絡來存儲訊息內容和用戶頭像，並集成了多個 AI 機器人助手來增強用戶體驗。

### 主要特色

- ✅ **完全去中心化** - 所有數據存儲在 Sui 區塊鏈
- ✅ **Walrus 存儲** - 使用 Walrus 去中心化存儲訊息內容
- ✅ **AI 機器人集成** - 支援多個 AI 助手即時回應
- ✅ **實時用戶狀態** - 顯示線上/離線狀態和最後發文時間
- ✅ **用戶資料管理** - 自定義用戶名和頭像
- ✅ **Web3 錢包整合** - 使用 Sui 錢包進行身份驗證

---

## 核心功能

### 1. 聊天功能
- 即時訊息發送和接收
- 訊息自動刷新（每 5 秒）
- 訊息持久化存儲在區塊鏈上
- 支援訊息已讀狀態追蹤

### 2. AI 機器人助手

目前支援 4 個 AI 機器人：

| 機器人 | 提及名稱 | 描述 |
|--------|----------|------|
| 【Lucky Vicky】張員瑛 | `@Vicky` | AI 助手 - 張員瑛 |
| 【Smart Aoi】森川葵 | `@Aoi` | AI 助手 - 森川葵 |
| 【Reliable Himmel】欣梅爾 | `@Himmel` | AI 助手 - 欣梅爾 |
| 【Mentor Naval】Naval | `@Naval` | AI 助手 - Naval |

**使用方式：**
```
@Vicky 請問什麼是 Sui 區塊鏈？
@Aoi 幫我解釋一下智能合約
@Himmel 介紹一下你自己
@Naval 分享一下你的創業建議
```

### 3. 用戶列表

側邊欄顯示：
- **🤖 可用機器人** - 所有可用的 AI 助手
- **👥 線上用戶** - 實時用戶狀態
  - 🟢 線上（5 分鐘內活躍）
  - ⚫ 離線
  - 最後發文時間

### 4. 用戶資料管理
- 創建個人資料（用戶名 + 頭像）
- 編輯用戶名和頭像
- 頭像上傳到 Walrus
- 自動更新最後上線時間

---

## 技術架構

### 前端技術棧
- **React 18** - UI 框架
- **TypeScript** - 類型安全
- **Vite** - 構建工具
- **@mysten/dapp-kit** - Sui 錢包整合
- **@mysten/sui.js** - Sui SDK
- **@radix-ui/themes** - UI 組件庫

### 區塊鏈層
- **Sui Blockchain** - Layer 1 區塊鏈
- **Move Smart Contracts** - 智能合約語言
  - `user_profile` 模組 - 用戶資料管理
  - `chat_room` 模組 - 聊天室管理

### 存儲層
- **Walrus** - 去中心化存儲
  - 訊息內容存儲
  - 用戶頭像存儲
- **Sui Events** - 事件查詢
  - `ProfileCreatedEvent` - 用戶創建事件
  - `MessageSentEvent` - 訊息發送事件

### AI 整合
- **Webhook API** - RESTful API 調用
- **多機器人支援** - 可配置多個 AI 助手
- **自動回應** - 檢測 @提及並自動調用 API

---

## 快速開始

### 前置需求

1. **Node.js** >= 18.0.0
2. **Sui 錢包** (推薦使用 Sui Wallet 擴展)
3. **測試網 SUI tokens** - 用於 gas fee
4. **WAL tokens** - 用於 Walrus 存儲

### 安裝步驟

#### 1. 克隆專案
```bash
git clone <repository-url>
cd Sui-Chat/frontend
```

#### 2. 安裝依賴
```bash
npm install
```

#### 3. 配置環境變數

創建 `.env` 文件：
```env
VITE_SUI_NETWORK=testnet
VITE_PACKAGE_ID=0x975450d66596a01c027f09a6f4126fe0203eb1714d038ce5ba6bc025cd9baf58
VITE_CHAT_ROOM_ID=0xad974ec7435443fd0c244df92b71ba56d96155c1f70baf459befc3bbf3c10fcd
VITE_WALRUS_AGGREGATOR=https://aggregator.walrus-testnet.walrus.space
VITE_WALRUS_PUBLISHER=https://publisher.walrus-testnet.walrus.space
VITE_ENABLE_WALRUS=true
```

#### 4. 啟動開發服務器
```bash
npm run dev
```

訪問 `http://localhost:5173`

### 初次使用

1. **連接錢包** - 點擊右上角 "Connect Wallet"
2. **獲取測試幣** - 前往 [Sui Faucet](https://discord.com/channels/916379725201563759/971488439931392130) 獲取測試 SUI
3. **兌換 WAL** - 使用 Walrus CLI 兌換 WAL tokens
   ```bash
   walrus get-wal
   ```
4. **創建個人資料** - 設定用戶名和頭像
5. **開始聊天** - 發送第一條訊息！

---

## 功能詳解

### 發送訊息

#### 基本流程
1. 在輸入框輸入訊息
2. 點擊發送或按 Enter
3. 錢包彈出簽名請求 → 點擊批准
4. 訊息上傳到 Walrus (~1-2 秒)
5. 訊息發送到區塊鏈
6. 所有用戶看到新訊息

#### 提及機器人
```
@Vicky 你好
```

**完整流程：**
1. **第一次簽名** - 發送問題到鏈上
2. **API 調用** - 系統自動調用機器人 API
3. **第二次簽名** - 發送機器人回應到鏈上
4. **顯示回應** - 機器人回應出現在聊天室

**機器人回應格式：**
```
🤖 【Lucky Vicky】張員瑛

回覆 @您的用戶名: 你好

你好！我是張員瑛，很高興認識你！有什麼我可以幫助你的嗎？
```

### 編輯個人資料

1. 點擊右上角用戶名旁的「編輯」按鈕
2. 修改用戶名或上傳新頭像
3. 點擊「保存」
4. 簽名交易
5. 個人資料更新完成

**頭像要求：**
- 格式：JPG, PNG, GIF
- 大小：< 5 MB
- 建議：正方形圖片

### 查看用戶狀態

右側邊欄顯示：

**機器人列表：**
- 顯示所有可用的 AI 助手
- 藍色卡片背景
- 顯示 @提及名稱和描述

**用戶列表：**
- 🟢 線上：最近 5 分鐘內活躍
- ⚫ 離線：超過 5 分鐘無活動
- 最後發文時間：用戶最後發送訊息的時間

---

## AI 機器人系統

### 架構設計

```
用戶發送訊息
    ↓
檢測 @提及
    ↓
提取問題內容
    ↓
調用機器人 API (GET)
    ↓
格式化回應
    ↓
發送到區塊鏈
    ↓
所有用戶看到回應
```

### API 規格

**請求格式：**
```
GET https://api-endpoint.com/webhook?text={question}&userid={username}
```

**參數：**
- `text` - 用戶的問題（移除 @提及後的內容）
- `userid` - 提問用戶的用戶名

**回應格式：**

選項 1 - JSON：
```json
{
  "response": "機器人的回應內容",
  "reply": "機器人的回應內容",  // 備選欄位
  "text": "機器人的回應內容",    // 備選欄位
  "message": "機器人的回應內容" // 備選欄位
}
```

選項 2 - 純文字：
```
機器人的回應內容
```

### 添加新機器人

編輯 `src/config/bots.ts`：

```typescript
export const BOTS: BotConfig[] = [
  // 現有機器人...

  // 添加新機器人
  {
    name: 'YourBot',              // @提及名稱
    displayName: '【顯示名稱】',   // 完整顯示名稱
    apiEndpoint: 'https://your-api.com/webhook',
    description: '機器人描述',
    avatar: 'https://avatar-url.com/image.png', // 可選
  },
];
```

**重啟應用後，新機器人自動出現在側邊欄！**

### 機器人 API 開發

**範例 Node.js 實作：**

```javascript
const express = require('express');
const app = express();

app.get('/webhook', async (req, res) => {
  const { text, userid } = req.query;

  // 處理問題並生成回應
  const response = await generateResponse(text, userid);

  // 返回 JSON
  res.json({
    response: response
  });
});

app.listen(3000);
```

**測試 API：**
```bash
curl "https://your-api.com/webhook?text=Hello&userid=testuser"
```

---

## 用戶管理

### 資料結構

```typescript
interface UserProfile {
  id: string;                    // Profile object ID
  wallet_address: string;        // 錢包地址
  username: string;              // 用戶名
  avatar_walrus_blob_id: string; // Walrus 頭像 blob ID
  created_at: number;            // 創建時間戳
  last_seen: number;             // 最後上線時間
  avatar_url?: string;           // 頭像 URL
  lastMessageTime?: number;      // 最後發文時間
}
```

### 自動功能

**last_seen 更新時機：**
- 進入聊天室時
- 發送訊息後
- 每 2 分鐘自動更新

**線上狀態判定：**
```javascript
const isOnline = (lastSeen) => {
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  return (now - lastSeen) < fiveMinutes;
};
```

### 用戶列表刷新

- 自動刷新：每 30 秒
- 手動刷新：發送訊息後
- 排序：按最後上線時間（最近的在前）

---

## 配置說明

### 環境變數

| 變數名稱 | 說明 | 必填 | 預設值 |
|---------|------|------|--------|
| `VITE_SUI_NETWORK` | Sui 網絡 | ✅ | testnet |
| `VITE_PACKAGE_ID` | 智能合約包 ID | ✅ | - |
| `VITE_CHAT_ROOM_ID` | 聊天室 Object ID | ✅ | - |
| `VITE_WALRUS_PUBLISHER` | Walrus 上傳節點 | ✅ | - |
| `VITE_WALRUS_AGGREGATOR` | Walrus 讀取節點 | ✅ | - |
| `VITE_ENABLE_WALRUS` | 啟用 Walrus | ❌ | true |

### 常量配置

`src/config/constants.ts`：

```typescript
// Sui Clock object ID
export const CLOCK_OBJECT_ID = '0x6';

// UI 配置
export const UI_CONFIG = {
  MESSAGE_LOAD_LIMIT: 20,       // 訊息載入數量
  TYPING_DEBOUNCE_MS: 500,      // 打字防抖延遲
  TYPING_TIMEOUT_MS: 3000,      // 打字超時
  MAX_MESSAGE_LENGTH: 1000,     // 最大訊息長度
  MAX_USERNAME_LENGTH: 50,      // 最大用戶名長度
};
```

---

## 開發指南

### 項目結構

```
frontend/
├── src/
│   ├── components/          # React 組件
│   │   ├── ChatRoom.tsx     # 聊天室容器
│   │   ├── MessageList.tsx  # 訊息列表
│   │   ├── MessageInput.tsx # 訊息輸入框
│   │   └── UserList.tsx     # 用戶/機器人列表
│   ├── hooks/               # React Hooks
│   │   ├── useChat.ts       # 聊天功能
│   │   ├── useProfile.ts    # 用戶資料
│   │   └── useOnlineUsers.ts # 用戶列表
│   ├── config/              # 配置文件
│   │   ├── constants.ts     # 常量
│   │   └── bots.ts          # 機器人配置
│   ├── services/            # 服務層
│   │   └── botService.ts    # 機器人 API 調用
│   ├── utils/               # 工具函數
│   │   └── walrus.ts        # Walrus 存儲
│   ├── types/               # TypeScript 類型
│   │   └── chat.ts          # 聊天類型定義
│   ├── App.tsx              # 主應用
│   └── main.tsx             # 入口文件
├── .env                     # 環境變數
└── package.json             # 依賴配置
```

### 核心 Hooks

#### useChat
```typescript
const {
  messages,           // 訊息列表
  isLoading,          // 載入狀態
  sendMessage,        // 發送訊息
  markAsRead,         // 標記已讀
  sendTypingIndicator,// 發送打字指示
  refreshMessages,    // 刷新訊息
} = useChat(roomId);
```

#### useProfile
```typescript
const {
  profile,            // 用戶資料
  hasProfile,         // 是否有資料
  isLoading,          // 載入狀態
  createProfile,      // 創建資料
  updateProfile,      // 更新資料
  updateLastSeen,     // 更新上線時間
  refreshProfile,     // 刷新資料
} = useProfile();
```

#### useOnlineUsers
```typescript
const {
  users,              // 用戶列表
  isLoading,          // 載入狀態
  refreshUsers,       // 刷新列表
} = useOnlineUsers();
```

### 添加新功能

#### 範例：添加訊息反應功能

1. **更新類型定義** (`src/types/chat.ts`)
```typescript
export interface Message {
  // 現有欄位...
  reactions?: {
    emoji: string;
    users: string[];
  }[];
}
```

2. **添加 Hook 函數** (`src/hooks/useChat.ts`)
```typescript
const addReaction = async (messageId: string, emoji: string) => {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::chat_room::add_reaction`,
    arguments: [
      tx.object(messageId),
      tx.pure.string(emoji),
    ],
  });
  await signAndExecuteTransaction({ transaction: tx });
};
```

3. **更新 UI** (`src/components/MessageList.tsx`)
```tsx
<Button onClick={() => addReaction(message.id, '👍')}>
  👍 Like
</Button>
```

### 測試

**手動測試檢查清單：**
- [ ] 連接錢包
- [ ] 創建個人資料
- [ ] 發送訊息
- [ ] 提及機器人
- [ ] 編輯個人資料
- [ ] 上傳頭像
- [ ] 查看用戶列表
- [ ] 查看機器人列表
- [ ] 刷新頁面後數據持久化

**Console 檢查：**
```javascript
// 應該沒有錯誤
// 應該看到以下日誌：
// - "Uploading to Walrus"
// - "Walrus upload success"
// - "Bot mentioned, calling API"
// - "Bot response sent successfully"
```

---

## 故障排除

### 常見問題

#### 1. 錢包連接失敗

**症狀：**
- 點擊 Connect Wallet 沒有反應
- 錢包彈窗不出現

**解決方法：**
- 確認已安裝 Sui Wallet 擴展
- 刷新頁面
- 檢查瀏覽器控制台錯誤
- 嘗試其他瀏覽器

#### 2. 訊息發送失敗

**症狀：**
- 簽名後訊息不出現
- Console 顯示錯誤

**可能原因和解決方法：**

**原因 1: Gas 不足**
```
錯誤: Insufficient gas
解決: 前往水龍頭獲取測試 SUI
```

**原因 2: WAL Token 不足**
```
錯誤: Walrus upload failed
解決: 使用 walrus get-wal 兌換 WAL
```

**原因 3: 網路問題**
```
錯誤: Network error
解決: 檢查網路連接，切換到測試網
```

#### 3. 機器人不回應

**症狀：**
- 提及機器人後沒有回應
- 只有問題訊息，沒有機器人回應

**檢查步驟：**

**步驟 1: 檢查 Console**
```javascript
// 應該看到：
Bot Vicky mentioned, calling API...
Bot API URL: https://...
Bot API response status: 200
```

**步驟 2: 測試 API**
```bash
curl "https://vibeaiweb3.zeabur.app/webhook/agent-01?text=test&userid=testuser"
```

**步驟 3: 檢查簽名**
- 確保完成第二次簽名
- 檢查錢包是否自動拒絕

**步驟 4: 查看錯誤訊息**
- 機器人會自動發送錯誤訊息到聊天室
- 查看 Console 詳細錯誤

#### 4. 頭像不顯示

**症狀：**
- 上傳頭像後不顯示
- 顯示預設頭像

**解決方法：**

**檢查 1: Walrus 上傳**
```javascript
// Console 應該顯示：
Walrus upload success: { blobId: "..." }
```

**檢查 2: Blob ID**
```javascript
// Profile 應該有 avatar_walrus_blob_id
console.log(profile.avatar_walrus_blob_id);
// 應該是一個長字串，不是 "default_" 開頭
```

**檢查 3: 頭像 URL**
```javascript
// 應該可以訪問
https://aggregator.walrus-testnet.walrus.space/v1/blobs/{blobId}
```

#### 5. 用戶列表不更新

**症狀：**
- 用戶狀態不變
- 最後發文時間不更新

**解決方法：**
- 等待 30 秒（自動刷新間隔）
- 發送一條訊息（觸發刷新）
- 檢查 `updateLastSeen` 是否被調用
- 查看 Console 是否有錯誤

### 調試技巧

#### 啟用詳細日誌

在 `src/hooks/useChat.ts` 添加：
```typescript
console.log('Current messages:', messages);
console.log('Sending message:', content);
```

#### 檢查區塊鏈狀態

使用 Sui Explorer：
```
https://testnet.suivision.xyz/
```
搜索：
- 交易 hash
- Object ID
- 錢包地址

#### 測試 Walrus

```bash
# 上傳測試文件
echo "test" > test.txt
walrus store test.txt --epochs 1

# 讀取測試
walrus read <blob-id>
```

---

## 性能優化

### 建議的優化

1. **訊息分頁**
   - 目前載入最近 50 條訊息
   - 可以實作無限滾動
   - 按需載入更多訊息

2. **用戶列表快取**
   - 快取用戶資料 5 分鐘
   - 減少重複查詢

3. **機器人回應快取**
   - 快取相同問題的回應
   - 避免重複調用 API

4. **圖片優化**
   - 壓縮頭像上傳
   - 使用 WebP 格式
   - Lazy loading

### 生產環境配置

```bash
# 構建生產版本
npm run build

# 預覽
npm run preview
```

**優化檢查清單：**
- [ ] 啟用 minification
- [ ] 移除 console.log
- [ ] 啟用 gzip 壓縮
- [ ] 設置 CDN
- [ ] 配置快取策略

---

## 安全考量

### 智能合約安全

- ✅ 使用官方 Sui SDK
- ✅ 所有交易需要簽名
- ✅ 驗證發送者地址
- ✅ 使用 `tx.object()` 防止 ID 偽造

### 前端安全

- ✅ 輸入驗證（用戶名、訊息長度）
- ✅ XSS 防護（React 自動轉義）
- ✅ HTTPS only
- ⚠️ 敏感資料不存儲在 localStorage

### API 安全

- ⚠️ 機器人 API 無認證（考慮添加 API key）
- ⚠️ 無速率限制（可能被濫用）
- ✅ 使用 HTTPS

---

## 路線圖

### 已完成 ✅
- [x] 基本聊天功能
- [x] 用戶資料管理
- [x] Walrus 存儲整合
- [x] AI 機器人系統
- [x] 用戶列表和狀態
- [x] 最後發文時間追蹤

### 計劃中 🚧
- [ ] 訊息反應（emoji）
- [ ] 私聊功能
- [ ] 多聊天室支援
- [ ] 訊息編輯和刪除
- [ ] 訊息搜索
- [ ] 檔案上傳
- [ ] 通知系統
- [ ] PWA 支援

### 未來考慮 💡
- [ ] 視訊/語音通話
- [ ] 加密訊息
- [ ] NFT 頭像
- [ ] Token 獎勵系統
- [ ] 社群治理
- [ ] 移動應用

---

## 貢獻指南

歡迎貢獻！請遵循以下步驟：

1. Fork 專案
2. 創建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

### 代碼規範

- 使用 TypeScript
- 遵循 ESLint 規則
- 添加適當的註釋
- 更新相關文檔

---

## 授權

MIT License

---

## 聯絡方式

- GitHub Issues: [提交問題](https://github.com/your-repo/issues)
- Discord: [加入社群](https://discord.gg/your-discord)

---

## 致謝

- **Sui Foundation** - 提供區塊鏈基礎設施
- **Walrus Team** - 去中心化存儲解決方案
- **@mysten/dapp-kit** - Sui 錢包整合工具
- **Radix UI** - 優秀的 UI 組件庫
- **所有貢獻者** - 感謝所有為專案貢獻的開發者

---

## 附錄

### A. 智能合約介面

#### user_profile 模組

```move
// 創建用戶資料
public entry fun create_profile(
    username: String,
    avatar_blob_id: String,
    clock: &Clock,
    ctx: &mut TxContext
)

// 更新用戶名
public entry fun update_username(
    profile: &mut UserProfile,
    new_username: String,
    clock: &Clock,
    ctx: &mut TxContext
)

// 更新頭像
public entry fun update_avatar(
    profile: &mut UserProfile,
    new_avatar_blob_id: String,
    clock: &Clock,
    ctx: &mut TxContext
)

// 更新最後上線時間
public entry fun update_last_seen(
    profile: &mut UserProfile,
    clock: &Clock,
    ctx: &mut TxContext
)
```

#### chat_room 模組

```move
// 發送訊息
public entry fun send_message(
    room: &mut ChatRoom,
    content_blob_id: String,
    message_type: u8,
    clock: &Clock,
    ctx: &mut TxContext
)

// 標記已讀
public entry fun mark_as_read(
    message: &mut Message,
    ctx: &mut TxContext
)

// 發送打字指示
public entry fun emit_typing(
    room: &ChatRoom,
    clock: &Clock,
    ctx: &mut TxContext
)
```

### B. 事件結構

```typescript
// 用戶創建事件
interface ProfileCreatedEvent {
  profile_id: string;
  wallet_address: string;
  username: string;
  timestamp: number;
}

// 訊息發送事件
interface MessageSentEvent {
  message_id: string;
  room_id: string;
  sender: string;
  content_blob_id: string;
  message_type: number;
  timestamp: number;
}

// 打字事件
interface TypingEvent {
  room_id: string;
  user: string;
  is_typing: boolean;
  timestamp: number;
}
```

### C. Walrus CLI 常用命令

```bash
# 獲取 WAL tokens
walrus get-wal

# 上傳文件
walrus store <file> --epochs <num>

# 讀取文件
walrus read <blob-id>

# 查看餘額
walrus info

# 列出已上傳文件
walrus list
```

### D. 有用的連結

- [Sui Documentation](https://docs.sui.io/)
- [Walrus Documentation](https://docs.walrus.site/)
- [Move Language](https://move-language.github.io/move/)
- [Sui Explorer](https://testnet.suivision.xyz/)
- [Sui Faucet](https://discord.com/channels/916379725201563759/971488439931392130)

---

**最後更新：** 2025-11-30
**版本：** 1.0.0
**作者：** Sui Chat Team
