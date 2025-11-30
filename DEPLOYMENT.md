# Sui-Chat 部署資訊

## 📦 Package 資訊

**Package ID**: `0x975450d66596a01c027f09a6f4126fe0203eb1714d038ce5ba6bc025cd9baf58`

**Network**: Sui Testnet

**部署日期**: 2025-11-30

**Transaction Digest**: `3nqcMCJKXG2m82sBZreiCQ7Wa8GyD3HtRNWk3Q79C1VD`

## 📋 Modules

- `chat_room` - 聊天室和訊息管理
- `user_profile` - 用戶資料管理

## 🔍 Sui Explorer

查看已部署的合約:
- [Package on Sui Explorer](https://suiscan.xyz/testnet/object/0x975450d66596a01c027f09a6f4126fe0203eb1714d038ce5ba6bc025cd9baf58)
- [Transaction on Sui Explorer](https://suiscan.xyz/testnet/tx/3nqcMCJKXG2m82sBZreiCQ7Wa8GyD3HtRNWk3Q79C1VD)

## 📝 下一步驟

### 1. 創建 ChatRoom 共享對象

```bash
sui client call \
  --package 0x975450d66596a01c027f09a6f4126fe0203eb1714d038ce5ba6bc025cd9baf58 \
  --module chat_room \
  --function create_room \
  --args "Public Chat Room" 0x6 \
  --gas-budget 10000000
```

記錄返回的 ChatRoom 對象 ID

### 2. 更新前端環境變數

編輯 `frontend/.env`:

```env
VITE_SUI_NETWORK=testnet
VITE_PACKAGE_ID=0x975450d66596a01c027f09a6f4126fe0203eb1714d038ce5ba6bc025cd9baf58
VITE_CHAT_ROOM_ID=<創建的 ChatRoom ID>
VITE_WALRUS_PUBLISHER=https://publisher.walrus-testnet.walrus.space
VITE_WALRUS_AGGREGATOR=https://aggregator.walrus-testnet.walrus.space
```

### 3. 啟動前端開發

```bash
cd frontend
npm install
npm run dev
```

## 🧪 測試合約

### 創建用戶資料

```bash
sui client call \
  --package 0x975450d66596a01c027f09a6f4126fe0203eb1714d038ce5ba6bc025cd9baf58 \
  --module user_profile \
  --function create_profile \
  --args "Alice" "avatar_blob_id" 0x6 \
  --gas-budget 10000000
```

### 發送訊息 (需要先創建 ChatRoom)

```bash
sui client call \
  --package 0x975450d66596a01c027f09a6f4126fe0203eb1714d038ce5ba6bc025cd9baf58 \
  --module chat_room \
  --function send_message \
  --args <CHAT_ROOM_ID> "message_blob_id" 0 0x6 \
  --gas-budget 10000000
```

## 📊 Gas 費用統計

- **Storage Cost**: 30.29 SUI
- **Computation Cost**: 0.001 SUI
- **Total**: ~30.31 SUI

## 🔐 UpgradeCap

**UpgradeCap Object ID**: `0x2ab3155751eab2ba563f11acd9ce8c74be40b6692657430aa9dcb546f4abf933`

此對象允許未來升級合約。請妥善保管。

## ⚠️ 注意事項

1. 此為 testnet 部署，請勿用於生產環境
2. Testnet SUI 可從 [Sui Faucet](https://discord.com/channels/916379725201563759/971488439931392130) 獲取
3. Walrus testnet 儲存有時間限制，數據可能會過期
4. Clock 對象地址: `0x6` (Sui testnet shared clock)

## 🛠️ 合約功能清單

### UserProfile

- ✅ `create_profile(username, avatar_blob_id, clock)`
- ✅ `update_username(profile, new_username, clock)`
- ✅ `update_avatar(profile, new_avatar_blob_id, clock)`
- ✅ `update_last_seen(profile, clock)`

### ChatRoom

- ✅ `create_room(name, clock)`
- ✅ `send_message(room, content_blob_id, message_type, clock)`
- ✅ `mark_as_read(message, clock)`
- ✅ `emit_typing(room, is_typing, clock)`

## 📖 Events

- `ProfileCreatedEvent`
- `ProfileUpdatedEvent`
- `RoomCreatedEvent`
- `MessageSentEvent`
- `TypingEvent`
- `MessageReadEvent`

---

## ✅ 測試結果報告 (2025-11-30)

所有核心功能已在 Sui Testnet 上測試成功！

### 測試對象 ID

#### 1. ChatRoom 對象
- **ID**: `0xad974ec7435443fd0c244df92b71ba56d96155c1f70baf459befc3bbf3c10fcd`
- **名稱**: "Sui Chat Bootcamp 公開聊天室"
- **類型**: Shared Object
- **創建交易**: [Avgb22w5bvsEzZP4y6n5RNMUTZ7qjBkiSyMnppRWNnbS](https://suiscan.xyz/testnet/tx/Avgb22w5bvsEzZP4y6n5RNMUTZ7qjBkiSyMnppRWNnbS)

#### 2. UserProfile 對象
- **ID**: `0x1c45301dab3d5b3741da16c28176766612255bb5b875f9c3269136289338dd5e`
- **用戶名**: "Sui Bootcamp 學員"
- **類型**: Owned Object
- **創建交易**: [3bnfvxLMzuKNovGRMuQ3ppckq3LBGAVoxPcqavxEZop4](https://suiscan.xyz/testnet/tx/3bnfvxLMzuKNovGRMuQ3ppckq3LBGAVoxPcqavxEZop4)

#### 3. Message 對象
- **ID**: `0xb398db40127ab91daf00121e2ec983390a08c99562ff1341fe852283479b9998`
- **訊息類型**: 1 (HELLO)
- **Blob ID**: "walrus_blob_hello_message_001"
- **類型**: Shared Object
- **創建交易**: [DuHAKXujp4RpLvrmzZ1dCyabDSHzTycLQeEHhmXveBnR](https://suiscan.xyz/testnet/tx/DuHAKXujp4RpLvrmzZ1dCyabDSHzTycLQeEHhmXveBnR)

### 測試案例

| 功能 | 狀態 | 交易 Digest | 備註 |
|------|------|------------|------|
| ✅ 創建聊天室 | SUCCESS | Avgb22w5bvsEzZP4y6n5RNMUTZ7qjBkiSyMnppRWNnbS | RoomCreatedEvent 正確觸發 |
| ✅ 創建用戶資料 | SUCCESS | 3bnfvxLMzuKNovGRMuQ3ppckq3LBGAVoxPcqavxEZop4 | ProfileCreatedEvent 正確觸發 |
| ✅ 發送訊息 | SUCCESS | DuHAKXujp4RpLvrmzZ1dCyabDSHzTycLQeEHhmXveBnR | MessageSentEvent 正確觸發，message_count 增加 |
| ✅ 標記已讀 | SUCCESS | Db89FjhU9sFTMzF84ZLcWNW6aH8mog4LVYqivS8DSMJM | MessageReadEvent 觸發，Table 動態欄位創建 |
| ✅ 輸入指示器 | SUCCESS | GZTEETG2WDUXUux6vAz9UA3wX8cxh38dVDPJpUfmvQvJ | TypingEvent 正確觸發 |

### Gas 費用詳情

| 操作 | Storage Cost | Computation | Total |
|------|--------------|-------------|-------|
| 創建聊天室 | 2.93 SUI | 0.001 SUI | ~2.96 SUI |
| 創建用戶資料 | 3.06 SUI | 0.001 SUI | ~3.08 SUI |
| 發送訊息 | 5.40 SUI | 0.001 SUI | ~3.49 SUI (有 rebate) |
| 標記已讀 | 5.05 SUI | 0.001 SUI | ~2.63 SUI (有 rebate) |
| 輸入指示器 | 0.99 SUI | 0.001 SUI | ~1.01 SUI |

### 事件驗證

所有定義的事件都已成功觸發並包含正確的數據：

1. **RoomCreatedEvent** ✅
   - room_id, name, creator, timestamp 全部正確

2. **ProfileCreatedEvent** ✅
   - profile_id, wallet_address, username, timestamp 全部正確

3. **MessageSentEvent** ✅
   - message_id, room_id, sender, content_blob_id, message_type, timestamp 全部正確

4. **MessageReadEvent** ✅
   - message_id, reader, timestamp 全部正確
   - Dynamic field 正確創建以追蹤讀者

5. **TypingEvent** ✅
   - room_id, user, is_typing, timestamp 全部正確

### 快速測試指令

使用已創建的對象進行後續測試：

```bash
# 發送另一則訊息到聊天室
sui client call \
  --package 0x975450d66596a01c027f09a6f4126fe0203eb1714d038ce5ba6bc025cd9baf58 \
  --module chat_room \
  --function send_message \
  --args 0xad974ec7435443fd0c244df92b71ba56d96155c1f70baf459befc3bbf3c10fcd "new_message_blob" 0 0x6 \
  --gas-budget 10000000

# 標記訊息已讀
sui client call \
  --package 0x975450d66596a01c027f09a6f4126fe0203eb1714d038ce5ba6bc025cd9baf58 \
  --module chat_room \
  --function mark_as_read \
  --args 0xb398db40127ab91daf00121e2ec983390a08c99562ff1341fe852283479b9998 0x6 \
  --gas-budget 10000000

# 發送輸入指示器
sui client call \
  --package 0x975450d66596a01c027f09a6f4126fe0203eb1714d038ce5ba6bc025cd9baf58 \
  --module chat_room \
  --function emit_typing \
  --args 0xad974ec7435443fd0c244df92b71ba56d96155c1f70baf459befc3bbf3c10fcd false 0x6 \
  --gas-budget 10000000
```

### 結論

✅ **所有核心功能運作正常**
- Move 智能合約成功部署到 Sui Testnet
- 所有主要功能都通過測試
- 事件系統正確運作
- 共享對象（ChatRoom, Message）和擁有對象（UserProfile）都正常工作
- Table 數據結構正確實現已讀追蹤功能

**下一步**: 開發 React 前端並整合 Walrus 儲存系統
