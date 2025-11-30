# Sui-Chat Frontend

基於 Sui 區塊鏈和 Walrus 去中心化存儲的聊天應用程式。

**技術棧**: React 18 + TypeScript + Vite + @mysten/dapp-kit + Radix UI Themes

## ✨ 功能特性

- 🔐 **Sui 錢包連接** - 支持多種 Sui 錢包（Sui Wallet、Suiet 等）
- 👤 **去中心化用戶資料** - 鏈上個人資料管理
- 💬 **即時聊天** - 基於 Sui 智能合約的消息系統
- 📦 **Walrus 存儲** - 去中心化消息和媒體存儲
- 🎨 **Linear 美學** - 極致深色主題和紫色光暈設計
- ⚡ **自動刷新** - 每 5 秒自動更新消息
- 🚀 **完全去中心化** - 無需中心化後端伺服器

## 🚀 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 配置環境變數

`.env` 文件已配置好測試網環境：

```env
VITE_SUI_NETWORK=testnet
VITE_PACKAGE_ID=0x975450d66596a01c027f09a6f4126fe0203eb1714d038ce5ba6bc025cd9baf58
VITE_CHAT_ROOM_ID=0xad974ec7435443fd0c244df92b71ba56d96155c1f70baf459befc3bbf3c10fcd
VITE_WALRUS_AGGREGATOR=https://aggregator.walrus-testnet.walrus.space
VITE_WALRUS_PUBLISHER=https://publisher.walrus-testnet.walrus.space
```

### 3. 啟動開發伺服器

```bash
npm run dev
```

應用程式將在 http://localhost:5180/ 運行。

### 4. 建置生產版本

```bash
npm run build
```

產出文件在 `dist/` 目錄。

### 5. 部署到 Walrus Site

```bash
# 建置
npm run build

# 部署到 Walrus (需要 walrus-sites CLI)
walrus-sites publish ./dist
```

## 📁 目錄結構

```
src/
├── components/          # React 組件
│   ├── ChatRoom.tsx    # 聊天室容器組件
│   ├── MessageList.tsx # 消息列表組件
│   ├── MessageInput.tsx # 消息輸入組件
│   └── index.ts        # 組件導出
│
├── hooks/              # 自定義 React Hooks
│   ├── useChat.ts      # 聊天功能 Hook
│   ├── useProfile.ts   # 用戶資料 Hook
│   └── index.ts        # Hooks 導出
│
├── config/             # 配置文件
│   ├── network.ts      # Sui 網絡配置
│   └── constants.ts    # 常量定義
│
├── types/              # TypeScript 類型定義
│   ├── chat.ts         # 聊天相關類型
│   └── index.ts        # 類型導出
│
├── utils/              # 工具函數
│   ├── walrus.ts       # Walrus 集成
│   └── format.ts       # 格式化工具
│
├── styles/             # CSS 樣式
│   └── main.css        # 全局樣式（Linear 美學）
│
├── App.tsx             # 主應用組件
└── main.tsx            # 應用入口
```

## 🔧 核心功能

### 1. useChat Hook - 聊天功能

管理聊天消息的核心 Hook：

```typescript
import { useChat } from './hooks';

const {
  messages,           // 消息列表
  isLoading,         // 加載狀態
  sendMessage,       // 發送消息函數
  markAsRead,        // 標記已讀函數
  sendTypingIndicator, // 輸入指示器
  refreshMessages    // 手動刷新
} = useChat(roomId);

// 發送消息
await sendMessage('Hello, World!', 0); // 0 = CHAT 類型

// 標記消息為已讀
await markAsRead(messageId);
```

**功能**：
- 自動從區塊鏈獲取消息
- 從 Walrus 解析消息內容
- 每 5 秒自動刷新
- 發送新消息到鏈上
- 支持消息已讀狀態

### 2. useProfile Hook - 用戶資料

管理用戶個人資料的 Hook：

```typescript
import { useProfile } from './hooks';

const {
  profile,          // 用戶資料對象
  hasProfile,       // 是否已有資料
  isLoading,        // 加載狀態
  createProfile,    // 創建資料
  updateProfile,    // 更新資料
  updateLastSeen,   // 更新上線時間
  refreshProfile    // 刷新資料
} = useProfile();

// 創建新資料
await createProfile('MyUsername', avatarFile);

// 更新資料
await updateProfile('NewUsername', newAvatarFile);
```

### 3. Walrus 去中心化存儲

上傳和讀取數據：

```typescript
import { uploadToWalrus, readFromWalrus } from './utils/walrus';

// 上傳消息到 Walrus
const blobId = await uploadToWalrus('Hello, World!');

// 從 Walrus 讀取消息
const content = await readFromWalrus(blobId);

// 上傳文件（如頭像）
const avatarBlobId = await uploadToWalrus(imageFile);
```

### 4. Sui 智能合約集成

**發送消息**：

```typescript
const tx = new Transaction();
tx.moveCall({
  target: `${PACKAGE_ID}::chat::send_message`,
  arguments: [
    tx.object(roomId),
    tx.pure.string(contentBlobId),
    tx.pure.u8(messageType),
    tx.object(CLOCK_OBJECT_ID),
  ],
});
```

**創建用戶資料**：

```typescript
tx.moveCall({
  target: `${PACKAGE_ID}::chat::create_user_profile`,
  arguments: [
    tx.pure.string(username),
    tx.pure.string(avatarBlobId),
    tx.object(CLOCK_OBJECT_ID),
  ],
});
```

## 🎨 使用流程

### 1️⃣ 連接錢包

點擊右上角 "Connect Wallet" 按鈕，選擇您的 Sui 錢包並授權連接。

### 2️⃣ 創建個人資料

首次使用需要創建個人資料：
- 輸入用戶名
- （可選）上傳頭像
- 確認交易（需要少量 Gas）

### 3️⃣ 開始聊天

- 在聊天室輸入消息
- 按 `Enter` 發送（`Shift+Enter` 換行）
- 消息會自動每 5 秒刷新

## 🎨 設計系統

### Linear 深色主題

繼承 Linear app 的極簡美學：

- **背景色**: `#0a0a0a` (極致黑)
- **主題色**: `purple` (Radix UI Themes)
- **邊框**: `1px solid var(--gray-6)` (微妙分隔)
- **動畫**: `fadeIn 0.3s ease-out` (平滑過渡)

### 組件樣式

```css
/* 全局樣式 */
body {
  background-color: #0a0a0a;
  color: #ffffff;
}

/* 滾動條 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-thumb {
  background: #3a3a3a;
  border-radius: 4px;
}
```

## 📝 已完成功能

- ✅ Sui 錢包集成
- ✅ 用戶資料系統
- ✅ 聊天室組件
- ✅ 消息列表和輸入
- ✅ Walrus 存儲集成
- ✅ Linear 深色主題
- ✅ 自動消息刷新
- ✅ TypeScript 類型安全

## 🚧 未來改進

- [ ] Sui Events 實時訂閱（替代輪詢）
- [ ] 頭像上傳功能
- [ ] 消息已讀標記 UI
- [ ] 輸入指示器顯示
- [ ] 表情符號支持
- [ ] 文件分享功能
- [ ] 消息搜索
- [ ] RWD 響應式優化
- [ ] 單元測試

## 🔗 相關資源

- [Sui 文檔](https://docs.sui.io/)
- [Walrus 文檔](https://docs.walrus.site/)
- [@mysten/dapp-kit 文檔](https://sdk.mystenlabs.com/dapp-kit)
- [Radix UI Themes](https://www.radix-ui.com/themes)
- [Vite 文檔](https://vitejs.dev/)

## ⚠️ 故障排除

**錢包連接失敗**：
- 確認已安裝 Sui 錢包擴展
- 確認錢包已解鎖
- 嘗試刷新頁面

**交易失敗**：
- 檢查錢包是否有足夠的 SUI（可從 [faucet.sui.io](https://faucet.sui.io) 獲取測試幣）
- 確認網絡設置為 testnet
- 查看控制台錯誤信息

**消息不顯示**：
- 檢查 Walrus 服務是否可用
- 確認 ChatRoom ID 正確
- 嘗試手動刷新

## 📄 授權

MIT License
