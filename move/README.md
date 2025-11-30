# Sui-Chat Move 智能合約

## 📋 合約概述

本目錄包含 Sui-Chat 的所有 Move 智能合約。

## 📦 合約列表

### 1. `user_profile.move`

管理用戶個人資料的合約。

**核心功能**：
- 創建用戶資料 NFT
- 更新用戶名稱
- 更新頭像（Walrus blob ID）
- 記錄最後上線時間

**主要結構**：
```move
struct UserProfile has key, store {
    id: UID,
    wallet_address: address,
    username: String,
    avatar_walrus_blob_id: String,
    created_at: u64,
    last_seen: u64,
}
```

### 2. `chat_room.move`

管理聊天室和訊息的合約。

**核心功能**：
- 創建聊天室（共享對象）
- 發送訊息
- 標記已讀
- 發送輸入指示器事件

**主要結構**：
```move
struct ChatRoom has key {
    id: UID,
    name: String,
    created_at: u64,
    message_count: u64,
}

struct Message has key, store {
    id: UID,
    room_id: ID,
    sender: address,
    content_walrus_blob_id: String,
    message_type: u8,
    timestamp: u64,
    read_count: u64,
}
```

**Event 列表**：
- `MessageSentEvent`: 新訊息發送
- `TypingEvent`: 用戶輸入狀態
- `MessageReadEvent`: 訊息已讀

## 🔧 開發指令

### 建置合約

```bash
sui move build
```

### 測試合約

```bash
sui move test
```

### 部署到 testnet

```bash
sui client publish --gas-budget 100000000
```

部署後會得到：
- Package ID: 合約包地址
- 需要記錄到前端的 `.env` 文件

### 創建聊天室

部署後需要創建聊天室（共享對象）：

```bash
sui client call \
  --package <PACKAGE_ID> \
  --module chat_room \
  --function create_room \
  --args "Public Chat Room" \
  --gas-budget 10000000
```

記錄返回的 ChatRoom Object ID 到前端 `.env`。

## 📊 數據流程

### 發送訊息流程

1. 用戶在前端輸入訊息
2. 前端上傳訊息到 Walrus → 獲得 `blob_id`
3. 前端調用 `send_message(room, blob_id, message_type)`
4. 合約創建 `Message` 對象 + 發出 `MessageSentEvent`
5. 其他用戶的前端監聽到 Event
6. 前端從 Walrus 讀取 `blob_id` 內容
7. 顯示在聊天室 UI

### 已讀回執流程

1. 用戶滾動到訊息（前端 Intersection Observer）
2. 前端調用 `mark_as_read(message)`
3. 合約更新 `read_count` + 發出 `MessageReadEvent`
4. 發送者的前端監聽到 Event
5. 更新「已讀 X 人」顯示

## 🧪 測試

### 測試用戶資料

```bash
# 創建測試用戶資料
sui client call \
  --package <PACKAGE_ID> \
  --module user_profile \
  --function create_profile \
  --args "Alice" "test_blob_id_123" \
  --gas-budget 10000000
```

### 測試發送訊息

```bash
sui client call \
  --package <PACKAGE_ID> \
  --module chat_room \
  --function send_message \
  --args <ROOM_ID> "walrus_blob_id_456" 0 \
  --gas-budget 10000000
```

## 📝 TODO

- [ ] 完成 `user_profile.move` 實作
- [ ] 完成 `chat_room.move` 實作
- [ ] 撰寫單元測試
- [ ] 部署到 testnet
- [ ] 測試所有功能
- [ ] Gas 費用優化

## 🔗 相關資源

- [Sui Move 文檔](https://docs.sui.io/build/move)
- [Move 語言教程](https://move-language.github.io/move/)
- [Sui Framework](https://github.com/MystenLabs/sui/tree/main/crates/sui-framework)
