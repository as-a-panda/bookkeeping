# 记账本

一个功能完整的个人记账网站，支持收入/支出记录、分类管理、预算管理、定期账单、统计报表等功能。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS |
| 后端 | Node.js + Express + TypeScript + Prisma |
| 数据库 | SQLite（零配置，开箱即用） |
| 图表 | Recharts |
| 认证 | JWT + bcrypt |

## 快速开始（本地运行）

### 前置要求
- Node.js 18+
- Git

### 步骤

```bash
# 1. 克隆项目
git clone https://github.com/as-a-panda/bookkeeping.git
cd bookkeeping

# 2. 启动后端（新开一个终端）
cd backend
npm install
npm run dev

# 3. 启动前端（新开一个终端）
cd frontend
npm install
npm run dev

# 4. 打开浏览器访问
http://localhost:5173
```

### 说明
- 数据库使用 SQLite，无需额外安装数据库
- 注册账号后即可开始记账
- 默认已有常用分类（餐饮、交通、工资等）

## 功能

- 用户注册/登录
- 记一笔（收入/支出）
- 多账户管理（现金、银行卡、微信、支付宝等）
- 分类管理
- 预算管理（月度/年度，进度追踪）
- 定期账单
- 统计数据（仪表盘、月度趋势、分类占比）
- CSV 导出
- 账单分摊

## 项目结构

```
bookkeeping/
├── frontend/          # React 前端
├── backend/           # Express 后端 + Prisma
└── README.md
```
