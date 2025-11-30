# Sui-Chat

去中心化聊天應用 - 基於 Sui 區塊鏈 + Walrus 存儲

## 🎯 專案目標

打造一個完全去中心化的聊天室系統，整合以下技術：
- **Sui Move**: 智能合約管理用戶和訊息
- **Walrus**: 去中心化存儲（訊息內容、頭像）
- **React**: 前端用戶界面
- **Sui Testnet**: 部署環境

## 📁 專案結構

```
Sui-Chat/
├── move/                    # Move 智能合約
│   ├── sources/
│   │   ├── user_profile.move    # 用戶個人資料
│   │   └── chat_room.move       # 聊天室管理
│   ├── tests/                   # 合約測試
│   └── Move.toml                # Move 專案配置
│
├── frontend/                # React 前端應用
│   ├── src/
│   │   ├── components/          # UI 組件
│   │   ├── hooks/               # React Hooks
│   │   ├── config/              # 配置文件
│   │   ├── types/               # TypeScript 類型
│   │   ├── utils/               # 工具函數
│   │   └── styles/              # CSS 樣式
│   ├── public/                  # 靜態資源
│   └── package.json
│
├── docs/                    # 專案文檔
│   └── architecture.md          # 架構說明
│
└── README.md               # 本文件
```

## ✨ 核心功能

### Chat System (聊天系統)
- ✅ 公開聊天室（所有參與者可見）
- ✅ Hello 歡迎訊息（新用戶加入自動發送）
- ✅ 輸入指示器（顯示「XXX 正在輸入...」）
- ✅ 已讀回執（顯示訊息被多少人看過）

### User Profiles (用戶資料)
- ✅ 錢包地址作為唯一識別
- ✅ 可自訂用戶名稱
- ✅ 可自訂頭像（存儲在 Walrus）

## 🏗️ 技術架構

```
┌─────────────────────────────────────────────┐
│    React Frontend (部署到 Walrus Site)       │
│    - @mysten/dapp-kit                       │
│    - Walrus SDK                             │
└─────────────────┬───────────────────────────┘
                  │
         ┌────────┴────────┐
         ▼                 ▼
┌─────────────────┐ ┌─────────────────────┐
│  Sui Testnet    │ │  Walrus Testnet     │
│  Move Contracts │ │  - 訊息內容          │
│  - UserProfile  │ │  - 用戶頭像          │
│  - ChatRoom     │ │  - 前端靜態文件       │
└─────────────────┘ └─────────────────────┘
```

## 🚀 快速開始

### 前置需求

- Node.js >= 18
- Sui CLI >= 1.0
- Sui Wallet 瀏覽器插件

### 1. 部署 Move 合約

```bash
cd move
sui move build
sui client publish --gas-budget 100000000
```

### 2. 啟動前端

```bash
cd frontend
npm install
npm run dev
```

### 3. 配置環境變數

在 `frontend/.env` 中設置：

```env
VITE_SUI_NETWORK=testnet
VITE_PACKAGE_ID=<你的合約地址>
VITE_CHAT_ROOM_ID=<聊天室對象ID>
```

## 📖 開發指南

### Move 合約開發

詳見 [`move/README.md`](./move/README.md)

### 前端開發

詳見 [`frontend/README.md`](./frontend/README.md)

### 架構說明

詳見 [`docs/architecture.md`](./docs/architecture.md)

## 🧪 測試

### 合約測試

```bash
cd move
sui move test
```

### 前端測試

```bash
cd frontend
npm run test
```

## 📝 開發進度

- [ ] **階段 1**: Move 合約開發
  - [ ] UserProfile 合約
  - [ ] ChatRoom 合約
  - [ ] 部署到 testnet

- [ ] **階段 2**: Walrus 整合
  - [ ] 訊息存儲到 Walrus
  - [ ] 頭像上傳功能

- [ ] **階段 3**: 前端開發
  - [ ] 聊天室 UI
  - [ ] 個人資料設定
  - [ ] Sui 錢包整合

- [ ] **階段 4**: 即時功能
  - [ ] Event 監聽
  - [ ] 輸入指示器
  - [ ] 已讀回執

- [ ] **階段 5**: 部署
  - [ ] 部署到 Walrus Site
  - [ ] 測試與優化

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📄 授權

MIT License

## 🔗 相關連結

- [Sui 官方文檔](https://docs.sui.io/)
- [Walrus 文檔](https://docs.walrus.site/)
- [Move 語言指南](https://move-language.github.io/move/)

---

**建立日期**: 2025-11-30
**版本**: v0.1.0
