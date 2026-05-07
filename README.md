# 记账本

![GitHub](https://img.shields.io/badge/license-MIT-blue)
![PRs](https://img.shields.io/badge/PRs-welcome-brightgreen)

一个功能完整的个人记账网站，支持收入/支出记录、分类管理、预算管理、定期账单、统计报表等功能。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS |
| 后端 | Node.js + Express + TypeScript + Prisma |
| 数据库 | PostgreSQL |
| 图表 | Recharts |
| 认证 | JWT + bcrypt |

## 本地开发

```bash
# 后端
cd backend
npm install
cp .env.example .env  # 配置数据库连接
npm run dev

# 前端
cd frontend
npm install
npm run dev
```

访问 http://localhost:5173

## 部署

### 方式一：一键部署（推荐）

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/as-a-panda/bookkeeping)

点击上方按钮，Render 会自动部署后端 + PostgreSQL 数据库。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/as-a-panda/bookkeeping)

前端部署后需设置环境变量 `VITE_API_URL` 为后端地址。

### 方式二：手动部署

详见下方部署指南。
