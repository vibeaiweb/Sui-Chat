# 打字指示器与已读功能改进方案

## 📋 目录

1. [当前状态分析](#当前状态分析)
2. [打字指示器改进方案](#打字指示器改进方案)
3. [已读功能改进方案](#已读功能改进方案)
4. [实施建议](#实施建议)

---

## 当前状态分析

### 1️⃣ 打字指示器 (Typing Indicator)

#### **当前实现**

**合约端：** `move/sources/chat_room.move:226-238`
```move
public entry fun emit_typing(
    room: &ChatRoom,
    is_typing: bool,
    clock: &sui::clock::Clock,
    ctx: &mut TxContext
) {
    event::emit(TypingEvent {
        room_id: object::id(room),
        user: ctx.sender(),
        is_typing,
        timestamp: clock.timestamp_ms(),
    });
}
```

**前端：** `frontend/src/hooks/useChat.ts:226-252`
```typescript
const sendTypingIndicator = async () => {
  // ⚠️ 已禁用 - 避免频繁弹钱包
  console.log('Typing indicator disabled to improve UX');
  return;
}
```

#### **问题分析**

| 问题 | 影响 | 严重程度 |
|------|------|---------|
| **需要链上交易** | 每次打字都弹钱包 | 🔴 严重 |
| **消耗 Gas** | 每次输入约 0.000012 SUI | 🟡 中等 |
| **用户体验差** | 频繁被打断 | 🔴 严重 |
| **延迟高** | ~2 秒交易确认 | 🟡 中等 |

---

### 2️⃣ 已读功能 (Read Status)

#### **当前实现**

**合约端：** `move/sources/chat_room.move:197-217`
```move
public entry fun mark_as_read(
    message: &mut Message,
    clock: &sui::clock::Clock,
    ctx: &mut TxContext
) {
    let reader = ctx.sender();

    // Check if already read by this user
    assert!(!message.readers.contains(reader), EAlreadyRead);

    // Mark as read
    message.readers.add(reader, true);
    message.read_count = message.read_count + 1;

    // Emit event
    event::emit(MessageReadEvent {
        message_id: object::id(message),
        reader,
        timestamp: clock.timestamp_ms(),
    });
}
```

**前端：** `frontend/src/hooks/useChat.ts:190-223`
```typescript
const markAsRead = async (messageId: string) => {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::chat_room::mark_as_read`,
    arguments: [tx.object(messageId)],
  });

  await signAndExecuteTransaction({ transaction: tx });  // 🔔 弹钱包
}
```

**显示：** `frontend/src/components/MessageList.tsx:78-82`
```tsx
{message.read_count > 0 && (
  <Text size="1" color="gray">
    已讀 {message.read_count} 人
  </Text>
)}
```

#### **现状评估**

| 特性 | 状态 | 说明 |
|------|------|------|
| **功能完整性** | ✅ 完整 | 合约已实现 |
| **前端集成** | ✅ 已实现 | 显示已读人数 |
| **用户体验** | 🟡 一般 | 需要主动标记（弹钱包） |
| **自动化** | ❌ 无 | 不会自动标记已读 |

---

## 打字指示器改进方案

### 方案 A: WebSocket 实现（推荐）⭐⭐⭐⭐⭐

#### **架构设计**

```
┌─────────────────────────────────────────────────────┐
│                   前端应用                           │
├─────────────────────────────────────────────────────┤
│  用户 A 开始打字                                     │
│    ↓                                                 │
│  检测 input onChange                                 │
│    ↓                                                 │
│  发送 WebSocket 消息                                │
│    { type: 'typing', user: 'A', isTyping: true }   │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│              WebSocket 服务器                        │
│  (Node.js + Socket.io / ws)                         │
├─────────────────────────────────────────────────────┤
│  1. 接收消息                                         │
│  2. 验证用户身份（可选）                             │
│  3. 广播给房间内其他用户                             │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│                 用户 B, C, D...                      │
├─────────────────────────────────────────────────────┤
│  收到 WebSocket 消息                                 │
│    ↓                                                 │
│  更新 UI 显示 "用户 A 正在打字..."                   │
└─────────────────────────────────────────────────────┘
```

#### **优点**

✅ **完全不需要签章** - 不消耗 Gas，不弹钱包
✅ **实时性极佳** - 延迟 < 100ms
✅ **成本低** - 服务器带宽成本极低
✅ **用户体验好** - 流畅无感知

#### **缺点**

❌ **需要后端服务** - 增加维护成本
❌ **中心化** - 依赖 WebSocket 服务器
❌ **复杂度增加** - 需要管理连接状态

#### **实施步骤**

**步骤 1: 后端 - WebSocket 服务器**

```javascript
// server/websocket-server.js
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

// 房间管理
const rooms = new Map();

wss.on('connection', (ws) => {
  let currentRoom = null;
  let currentUser = null;

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'join':
        // 加入房间
        currentRoom = data.roomId;
        currentUser = data.userId;

        if (!rooms.has(currentRoom)) {
          rooms.set(currentRoom, new Set());
        }
        rooms.get(currentRoom).add(ws);
        break;

      case 'typing':
        // 广播打字状态
        if (currentRoom && rooms.has(currentRoom)) {
          const message = JSON.stringify({
            type: 'typing',
            user: currentUser,
            userName: data.userName,
            isTyping: data.isTyping,
            timestamp: Date.now()
          });

          // 发送给房间内其他用户
          rooms.get(currentRoom).forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(message);
            }
          });
        }
        break;
    }
  });

  ws.on('close', () => {
    // 清理连接
    if (currentRoom && rooms.has(currentRoom)) {
      rooms.get(currentRoom).delete(ws);
    }
  });
});

console.log('WebSocket server running on ws://localhost:8080');
```

**步骤 2: 前端 - WebSocket Hook**

```typescript
// frontend/src/hooks/useWebSocket.ts
import { useEffect, useRef, useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';

export function useWebSocket(roomId: string) {
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);
  const currentAccount = useCurrentAccount();
  const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    if (!currentAccount?.address) return;

    // 连接 WebSocket
    const ws = new WebSocket('ws://localhost:8080');
    wsRef.current = ws;

    ws.onopen = () => {
      // 加入房间
      ws.send(JSON.stringify({
        type: 'join',
        roomId,
        userId: currentAccount.address
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'typing') {
        setTypingUsers((prev) => {
          const newMap = new Map(prev);

          if (data.isTyping) {
            newMap.set(data.user, data.userName);

            // 设置超时清除
            const existingTimeout = typingTimeoutRef.current.get(data.user);
            if (existingTimeout) {
              clearTimeout(existingTimeout);
            }

            const timeout = setTimeout(() => {
              setTypingUsers((prev) => {
                const updated = new Map(prev);
                updated.delete(data.user);
                return updated;
              });
            }, 3000);

            typingTimeoutRef.current.set(data.user, timeout);
          } else {
            newMap.delete(data.user);
          }

          return newMap;
        });
      }
    };

    return () => {
      ws.close();
      typingTimeoutRef.current.forEach(clearTimeout);
    };
  }, [roomId, currentAccount?.address]);

  const sendTypingIndicator = (isTyping: boolean, userName: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        isTyping,
        userName
      }));
    }
  };

  return {
    typingUsers,
    sendTypingIndicator
  };
}
```

**步骤 3: 前端 - 使用 Hook**

```typescript
// frontend/src/components/ChatRoom.tsx
import { useWebSocket } from '../hooks/useWebSocket';

function ChatRoom() {
  const { typingUsers, sendTypingIndicator } = useWebSocket(CHAT_ROOM_ID);
  const { profile } = useProfile();
  const [inputValue, setInputValue] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

    // 发送"正在打字"状态
    sendTypingIndicator(true, profile?.username || 'Anonymous');

    // 3秒后自动发送"停止打字"
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(false, profile?.username || '');
    }, 3000);
  };

  return (
    <div>
      {/* 显示谁在打字 */}
      {typingUsers.size > 0 && (
        <Text size="1" color="gray">
          {Array.from(typingUsers.values()).join(', ')} 正在打字...
        </Text>
      )}

      <input
        value={inputValue}
        onChange={handleInputChange}
        placeholder="输入消息..."
      />
    </div>
  );
}
```

#### **成本估算**

| 项目 | 费用 | 说明 |
|------|------|------|
| **服务器** | $5-10/月 | VPS (1GB RAM 足够) |
| **带宽** | < $1/月 | WebSocket 消息很小 |
| **维护** | 1-2 小时/月 | 监控和更新 |
| **总计** | **$6-11/月** | 比链上便宜 99.9% |

---

### 方案 B: Sponsored Transactions

#### **概念**

由应用赞助 Gas 费用，用户只需授权，不需要支付。

#### **实施步骤**

```typescript
// 前端
const sendTypingIndicator = async (isTyping: boolean) => {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::chat_room::emit_typing`,
    arguments: [...]
  });

  // 请求后端赞助
  const sponsoredTx = await fetch('/api/sponsor-typing', {
    method: 'POST',
    body: JSON.stringify({ transaction: tx.serialize() })
  });

  // 用户只需签名，不支付 Gas
  const result = await signTransaction({ transaction: sponsoredTx });
};
```

#### **优缺点**

✅ 保留链上特性（可验证、永久记录）
✅ 用户体验好（不需要支付）
❌ 应用需要持续支付 Gas
❌ 实现复杂度高
❌ 仍需要钱包签名（虽然不支付）

---

### 方案 C: 混合方案（链下 + 链上）⭐⭐⭐⭐

#### **设计思路**

```
实时打字指示器 → WebSocket (链下，免费)
                   ↓
              用户发送消息
                   ↓
          链上交易 (包含最后打字时间)
```

**优点：**
- 打字指示器实时且免费
- 消息发送时记录链上
- 结合两者优势

---

## 已读功能改进方案

### 方案 A: 自动标记已读（IntersectionObserver）⭐⭐⭐⭐⭐

#### **问题：** 当前需要用户主动点击标记已读，会弹钱包

#### **解决方案：** 当消息在视口中停留 >2 秒，自动标记已读

**实施步骤：**

```typescript
// frontend/src/hooks/useAutoMarkAsRead.ts
import { useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

export function useAutoMarkAsRead(
  messageId: string,
  markAsRead: (id: string) => Promise<void>,
  alreadyRead: boolean
) {
  const [ref, inView] = useInView({ threshold: 0.5 });
  const timerRef = useRef<NodeJS.Timeout>();
  const hasMarkedRef = useRef(false);

  useEffect(() => {
    if (inView && !alreadyRead && !hasMarkedRef.current) {
      // 消息进入视口，2秒后标记已读
      timerRef.current = setTimeout(async () => {
        try {
          await markAsRead(messageId);
          hasMarkedRef.current = true;
        } catch (error) {
          console.error('Failed to mark as read:', error);
        }
      }, 2000);
    } else {
      // 消息离开视口，清除计时器
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [inView, messageId, alreadyRead]);

  return ref;
}
```

**使用：**

```typescript
// frontend/src/components/MessageList.tsx
function MessageItem({ message }: { message: Message }) {
  const { markAsRead } = useChat();
  const currentAccount = useCurrentAccount();

  // 判断是否已读
  const alreadyRead = message.sender === currentAccount?.address;

  // 自动标记已读
  const ref = useAutoMarkAsRead(
    message.id,
    markAsRead,
    alreadyRead
  );

  return (
    <Flex ref={ref} gap="3" className="fade-in">
      {/* 消息内容 */}
    </Flex>
  );
}
```

#### **优点**

✅ **自动化** - 用户无需手动操作
✅ **体验好** - 自然流畅
✅ **准确** - 真正看到才算已读

#### **注意事项**

⚠️ **仍需要签章** - 每条消息标记已读时会弹钱包一次
⚠️ **Gas 消耗** - 每条消息约 0.000012 SUI

---

### 方案 B: 批量标记已读

#### **概念**

将多条消息的已读状态合并成一个交易。

```typescript
const markMultipleAsRead = async (messageIds: string[]) => {
  const tx = new Transaction();

  // 批量添加 moveCall
  messageIds.forEach(id => {
    tx.moveCall({
      target: `${PACKAGE_ID}::chat_room::mark_as_read`,
      arguments: [tx.object(id)]
    });
  });

  // 只签名一次
  await signAndExecuteTransaction({ transaction: tx });
};
```

#### **优点**

✅ 减少钱包弹出次数（10条消息 → 1次签名）
✅ 节省 Gas（批量交易通常更便宜）

#### **缺点**

❌ 需要收集多条消息才批量处理
❌ 实时性略差

---

### 方案 C: 链下记录 + 链上同步（推荐）⭐⭐⭐⭐⭐

#### **架构**

```
1. 用户查看消息
   ↓
2. 前端立即更新 UI（本地状态）
   ↓
3. 发送到后端数据库（链下记录）
   ↓
4. 定期批量同步到链上（例如每小时）
   ↓
5. 或在用户发送消息时，附带同步已读状态
```

#### **实施**

```typescript
// 前端：立即更新 UI，异步处理链上交易
const markAsReadOptimistic = (messageId: string) => {
  // 1. 立即更新 UI
  setMessages(prev =>
    prev.map(msg =>
      msg.id === messageId
        ? { ...msg, read_count: msg.read_count + 1 }
        : msg
    )
  );

  // 2. 记录到本地存储
  localStorage.setItem(`read_${messageId}`, 'true');

  // 3. 发送到后端（链下）
  fetch('/api/mark-read', {
    method: 'POST',
    body: JSON.stringify({ messageId })
  });

  // 4. 添加到待同步队列
  addToPendingSync(messageId);
};

// 在发送消息时，同步已读状态
const sendMessage = async (content: string) => {
  const tx = new Transaction();

  // 发送消息
  tx.moveCall({
    target: `${PACKAGE_ID}::chat_room::send_message`,
    arguments: [...]
  });

  // 同时同步待读状态
  const pendingReads = getPendingSync();
  pendingReads.forEach(messageId => {
    tx.moveCall({
      target: `${PACKAGE_ID}::chat_room::mark_as_read`,
      arguments: [tx.object(messageId)]
    });
  });

  // 只签名一次
  await signAndExecuteTransaction({ transaction: tx });

  // 清除待同步队列
  clearPendingSync();
};
```

#### **优点**

✅ **用户体验最佳** - 即时反馈
✅ **减少签章** - 合并到其他交易中
✅ **灵活** - 可控制同步策略

---

## 实施建议

### 优先级排序

| 功能 | 推荐方案 | 优先级 | 复杂度 | 成本 |
|------|---------|-------|-------|------|
| **打字指示器** | WebSocket | 🔴 高 | 中 | 低 |
| **已读功能** | 链下+链上混合 | 🟡 中 | 中 | 极低 |

### 分阶段实施

#### **Phase 1: 打字指示器 WebSocket 实现**

**时间：** 1-2 天

1. 搭建 WebSocket 服务器
2. 实现前端 WebSocket Hook
3. 集成到 ChatRoom 组件
4. 测试和优化

**预期效果：**
- ✅ 完全不弹钱包
- ✅ 实时打字提示
- ✅ 用户体验大幅改善

#### **Phase 2: 优化已读功能**

**时间：** 1 天

1. 实现自动标记已读（IntersectionObserver）
2. 实现批量标记
3. 合并到发送消息交易中

**预期效果：**
- ✅ 自动化
- ✅ 减少 50%+ 的钱包弹出

---

## 技术栈建议

### WebSocket 服务器

**选项 1: Socket.io (推荐)**
```bash
npm install socket.io
```
- ✅ 成熟稳定
- ✅ 自动重连
- ✅ 房间管理简单

**选项 2: ws (轻量)**
```bash
npm install ws
```
- ✅ 轻量快速
- ✅ 原生 WebSocket
- ❌ 需要手动处理重连

### 部署方案

**选项 1: 与前端一起部署到 Zeabur**
- 创建 `server/` 目录
- 添加 WebSocket 服务器代码
- 更新 `package.json` 启动脚本

**选项 2: 独立部署到 Railway/Render**
- 独立的 WebSocket 服务
- 更易扩展
- 更专业

---

## 成本效益分析

### 打字指示器

| 方案 | 月费用 | 用户体验 | 复杂度 |
|------|--------|---------|-------|
| **链上（当前）** | 每用户 $0.50 | ❌ 差 | 低 |
| **WebSocket** | $6-11 固定 | ✅ 优秀 | 中 |
| **Sponsored** | 每用户 $0.50 | 🟡 一般 | 高 |

**结论：** WebSocket 性价比最高

### 已读功能

| 方案 | 月费用 | 用户体验 | 准确性 |
|------|--------|---------|-------|
| **手动标记** | $0 | ❌ 差 | ✅ 高 |
| **自动标记** | 约 $0.10 | ✅ 好 | ✅ 高 |
| **混合方案** | < $0.01 | ✅ 优秀 | ✅ 高 |

**结论：** 混合方案最佳

---

## 下一步行动

### 立即可做

1. **启用 WebSocket 打字指示器**
   - 部署简单的 WebSocket 服务器
   - 集成到前端
   - 测试效果

2. **优化已读功能**
   - 实现自动检测
   - 批量处理
   - 合并到发送消息

### 未来考虑

1. **Sponsored Transactions** - 等待 Sui 官方工具成熟
2. **链下缓存** - 减少链上查询
3. **离线支持** - PWA + Service Worker

---

**生成时间：** 2025-12-01
**作者：** Claude Code
**版本：** v1.0
