# Sui-Chat 架構設計文檔

## 📐 系統架構概覽

```
┌─────────────────────────────────────────────────────┐
│              使用者 (User)                           │
│          使用 Sui Wallet 連接                        │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│         React Frontend (Walrus Site)                │
│  ┌──────────────────────────────────────────────┐  │
│  │  UI Components                               │  │
│  │  - ChatRoom                                  │  │
│  │  - MessageList                               │  │
│  │  - MessageInput                              │  │
│  │  - ProfileSettings                           │  │
│  │  - TypingIndicator                           │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │  Business Logic (Hooks)                      │  │
│  │  - useChatRoom()                             │  │
│  │  - useMessages()                             │  │
│  │  - useProfile()                              │  │
│  │  - useWalrus()                               │  │
│  └──────────────────────────────────────────────┘  │
└───────┬─────────────────────────────┬───────────────┘
        │                             │
        │ Sui SDK                     │ Walrus SDK
        │ (@mysten/dapp-kit)          │
        ▼                             ▼
┌─────────────────────┐     ┌─────────────────────────┐
│   Sui Testnet       │     │   Walrus Testnet        │
│                     │     │                         │
│  Smart Contracts:   │     │  Decentralized Storage: │
│  ┌───────────────┐  │     │  ┌───────────────────┐  │
│  │ UserProfile   │  │     │  │ Message Content   │  │
│  │ - username    │  │     │  │ (Large Text)      │  │
│  │ - avatar_id   │  │     │  └───────────────────┘  │
│  └───────────────┘  │     │  ┌───────────────────┐  │
│  ┌───────────────┐  │     │  │ User Avatars      │  │
│  │ ChatRoom      │  │     │  │ (Images)          │  │
│  │ - messages    │  │     │  └───────────────────┘  │
│  │ - events      │  │     │  ┌───────────────────┐  │
│  └───────────────┘  │     │  │ Frontend Assets   │  │
│  ┌───────────────┐  │     │  │ (HTML/JS/CSS)     │  │
│  │ Message       │  │     │  └───────────────────┘  │
│  │ - metadata    │  │     │                         │
│  │ - blob_id     │  │     └─────────────────────────┘
│  └───────────────┘  │
│                     │
│  Events:            │
│  - MessageSentEvent │
│  - TypingEvent      │
│  - MessageReadEvent │
└─────────────────────┘
```

## 🔄 核心流程設計

### 1. 用戶註冊流程

```
用戶連接 Sui Wallet
    ↓
檢查是否已有 UserProfile NFT
    ↓
    ├─ 有 → 載入個人資料
    │
    └─ 無 → 創建新的 UserProfile
           ↓
       1. 選擇頭像圖片
           ↓
       2. 上傳到 Walrus → 獲得 blob_id
           ↓
       3. 輸入用戶名稱
           ↓
       4. 調用 create_profile(username, blob_id)
           ↓
       5. Sui 鏈上創建 UserProfile NFT
           ↓
       6. 轉移 NFT 給用戶
```

### 2. 發送訊息流程

```
用戶在聊天室輸入訊息
    ↓
輸入時觸發 Typing Event
emit_typing(room_id, true)
    ↓
其他用戶看到「XXX 正在輸入...」
    ↓
用戶點擊「發送」
    ↓
1. 上傳訊息內容到 Walrus
   POST /store
   → 獲得 blob_id
    ↓
2. 調用 Move 函數
   send_message(
     room_id,
     blob_id,
     message_type
   )
    ↓
3. Sui 鏈上操作：
   - 創建 Message 對象
   - message.content_walrus_blob_id = blob_id
   - room.message_count++
   - emit MessageSentEvent
    ↓
4. 其他用戶的前端：
   - 監聽到 MessageSentEvent
   - 從 event.content_blob_id 獲取 blob_id
   - 從 Walrus 讀取內容: GET /read/{blob_id}
   - 顯示在聊天室 UI
```

### 3. 已讀回執流程

```
用戶滾動聊天室
    ↓
Intersection Observer 偵測到訊息進入可視區域
    ↓
調用 mark_as_read(message_id)
    ↓
Sui 鏈上操作：
  - message.read_count++
  - emit MessageReadEvent {
      message_id,
      reader: tx_sender,
      timestamp
    }
    ↓
發送者的前端：
  - 監聽到 MessageReadEvent
  - 更新訊息的「已讀 X 人」計數
```

### 4. 輸入指示器流程

```
用戶在輸入框開始打字
    ↓
debounce 500ms 後調用
emit_typing(room_id, true)
    ↓
Sui 鏈上發出 TypingEvent {
  room_id,
  user: sender,
  is_typing: true
}
    ↓
其他用戶的前端：
  - 監聽到 TypingEvent
  - 在聊天室底部顯示
    「Alice 正在輸入...」
    ↓
3秒無輸入後調用
emit_typing(room_id, false)
    ↓
其他用戶的前端移除輸入提示
```

## 🗃️ 資料模型

### Sui 鏈上數據（Move Structs）

#### UserProfile
```move
struct UserProfile has key, store {
    id: UID,
    wallet_address: address,      // 錢包地址（唯一識別）
    username: String,              // 用戶名稱
    avatar_walrus_blob_id: String, // Walrus 頭像 ID
    created_at: u64,              // 創建時間戳
    last_seen: u64,               // 最後上線時間
}
```

#### ChatRoom
```move
struct ChatRoom has key {
    id: UID,
    name: String,                 // 聊天室名稱
    created_at: u64,              // 創建時間
    message_count: u64,           // 訊息總數
}
```

#### Message
```move
struct Message has key, store {
    id: UID,
    room_id: ID,                  // 所屬聊天室
    sender: address,              // 發送者地址
    content_walrus_blob_id: String, // Walrus 內容 ID
    message_type: u8,             // 0=chat, 1=hello, 2=system
    timestamp: u64,               // 發送時間
    read_count: u64,              // 已讀人數
}
```

### Walrus 存儲數據

#### 訊息內容
```json
{
  "text": "Hello, everyone!",
  "timestamp": 1701234567890
}
```

#### 用戶頭像
- 格式：PNG/JPG/SVG
- 最大大小：1MB
- 存儲為 Blob

### 前端應用狀態

```typescript
// 聊天室狀態
interface ChatRoomState {
  roomId: string
  messages: Message[]
  typingUsers: Set<string>
  onlineUsers: number
}

// 訊息狀態
interface Message {
  id: string
  sender: string
  senderName: string
  senderAvatar: string
  content: string
  timestamp: number
  readCount: number
  isRead: boolean
}

// 用戶狀態
interface UserState {
  profile: UserProfile | null
  isConnected: boolean
  address: string
}
```

## 🔌 Event 驅動架構

### Sui Events 作為即時通訊基礎

由於區塊鏈不支援傳統 WebSocket，我們使用 **Sui Event Subscription** 實現即時通訊。

#### Event 類型

```move
// 新訊息事件
struct MessageSentEvent has copy, drop {
    message_id: ID,
    room_id: ID,
    sender: address,
    content_blob_id: String,
    timestamp: u64,
}

// 輸入指示器事件
struct TypingEvent has copy, drop {
    room_id: ID,
    user: address,
    is_typing: bool,
}

// 已讀事件
struct MessageReadEvent has copy, drop {
    message_id: ID,
    reader: address,
    timestamp: u64,
}
```

#### 前端訂閱

```typescript
// 訂閱新訊息
suiClient.subscribeEvent({
  filter: { MoveEventType: `${PKG}::chat_room::MessageSentEvent` },
  onMessage: async (event) => {
    const { content_blob_id } = event.parsedJson
    const content = await walrus.read(content_blob_id)
    addMessageToUI(content)
  }
})

// 訂閱輸入指示器
suiClient.subscribeEvent({
  filter: { MoveEventType: `${PKG}::chat_room::TypingEvent` },
  onMessage: (event) => {
    updateTypingIndicator(event.parsedJson)
  }
})
```

## 🐋 Walrus 整合設計

### 為什麼使用 Walrus？

| 數據類型 | 存儲位置 | 原因 |
|---------|---------|------|
| 訊息元數據 | Sui 鏈上 | 需要查詢、索引、權限控制 |
| 訊息內容 | Walrus | 大量文字，降低 Gas 費用 |
| 用戶頭像 | Walrus | 圖片文件，Blob 存儲 |
| 前端代碼 | Walrus Site | 去中心化部署 |

### Walrus API 使用

```typescript
// 上傳數據
const response = await fetch(`${WALRUS_PUBLISHER}/v1/store`, {
  method: 'PUT',
  body: messageContent
})
const { blobId } = await response.json()

// 讀取數據
const response = await fetch(`${WALRUS_AGGREGATOR}/v1/${blobId}`)
const content = await response.text()
```

## 🔐 安全性設計

### 1. 身份驗證
- 使用 Sui 錢包地址作為唯一識別
- 所有交易需要錢包簽名
- 無法偽造身份

### 2. 數據完整性
- Walrus blob 使用加密哈希
- 鏈上存儲 blob_id 作為索引
- 無法篡改已發送的訊息

### 3. 權限控制
```move
// 只有擁有者可以更新個人資料
public entry fun update_username(
    profile: &mut UserProfile,
    new_username: String,
    ctx: &mut TxContext
) {
    assert!(profile.wallet_address == tx_context::sender(ctx), 0);
    profile.username = new_username;
}
```

## ⚡ 效能優化

### 1. 訊息分頁載入
- 初次載入最新 20 則訊息
- 向上滾動時載入更多（Infinite Scroll）
- 使用虛擬滾動（react-virtuoso）

### 2. Event 去重
```typescript
const processedEvents = new Set<string>()

suiClient.subscribeEvent({
  onMessage: (event) => {
    const eventId = event.id.txDigest + event.id.eventSeq
    if (processedEvents.has(eventId)) return
    processedEvents.add(eventId)
    // 處理事件...
  }
})
```

### 3. Walrus 快取
```typescript
const walrusCache = new Map<string, string>()

async function fetchWalrusContent(blobId: string) {
  if (walrusCache.has(blobId)) {
    return walrusCache.get(blobId)
  }
  const content = await walrus.read(blobId)
  walrusCache.set(blobId, content)
  return content
}
```

## 🚀 部署策略

### 1. Move 合約部署
```bash
cd move
sui client publish --gas-budget 100000000
# 記錄 PACKAGE_ID
```

### 2. 創建聊天室
```bash
sui client call \
  --package <PACKAGE_ID> \
  --module chat_room \
  --function create_room \
  --args "Public Chat Room"
# 記錄 CHAT_ROOM_ID (共享對象)
```

### 3. 前端部署到 Walrus
```bash
cd frontend
npm run build
walrus-sites publish ./dist
# 獲得 https://xxxxx.walrus.site
```

## 🔄 未來擴展

### Phase 2
- [ ] 私人訊息（1對1 聊天）
- [ ] 多個聊天室
- [ ] 訊息搜尋功能

### Phase 3
- [ ] 圖片/文件分享
- [ ] 訊息反應（emoji）
- [ ] 用戶封鎖功能

### Phase 4
- [ ] 端到端加密
- [ ] 語音訊息
- [ ] 視訊通話

---

**版本**: v1.0
**最後更新**: 2025-11-30
