# ⚡ 高压电工错题集

一个纯前端的高压电工作业考试刷题工具，内置精选题库，支持错题集、收藏、回收站、📷 OCR 上传自动入题库等功能。

## 🚀 访问地址

| 部署 | 地址 | OCR 上传 | 国内访问 |
|------|------|---------|---------|
| **Vercel（推荐）** | 见部署后域名 | ✅ 可用 | ⭐⭐⭐⭐ |
| GitHub Pages | https://asked78.github.io/electric-question-bank/ | ❌ 不可用 | ⭐⭐（需 VPN） |

## ✨ 主要功能

### 📚 题库管理
- **全部题目** - 浏览题库所有题目
- **待重做错题** - 答错的题自动入集，集中复习
- **收藏题目** - 重点题目一键星标
- **最近新增** - 按时间倒序展示新题
- **🗑回收站** - 删除题目可恢复

### 📷 OCR 智能添加题目（新功能）
1. 在顶部 Tab 点击 **📷上传题目**
2. 选择题目截图（手机拍照或相册）
3. 自动调用百度 OCR 高精度版识别文字
4. 智能解析出题干、选项、答案
5. 在弹窗中预览编辑，确认后一键入题库

## 💾 数据存储

所有做题记录（错题、收藏、完成进度）保存在**浏览器的 localStorage** 中，不会上传到服务器。
每个设备/浏览器独立保存，**更换设备或清缓存会导致数据丢失**。

## 🛠 技术栈

- 前端：单文件 HTML + 原生 JS（零依赖）
- 云函数：Vercel Serverless Functions (Node.js)
- OCR：百度智能云 - 通用场景文字识别（高精度版）

## 🔧 本地开发

```bash
# 克隆仓库
git clone https://github.com/asked78/electric-question-bank.git
cd electric-question-bank

# 直接打开 index.html 即可（但 OCR 上传功能需要后端）
# 或用 Vercel CLI 本地运行（支持 OCR）
npm i -g vercel
vercel dev
```

## 🔐 环境变量

部署到 Vercel 后，需配置以下环境变量：

| 变量名 | 说明 | 获取方式 |
|--------|------|---------|
| `BAIDU_OCR_AK` | 百度 OCR API Key | https://console.bce.baidu.com/ai/#/ai/ocr/app/list |
| `BAIDU_OCR_SK` | 百度 OCR Secret Key | 同上 |

## 📁 项目结构

```
.
├── index.html          # 主程序（前端 + 题库）
├── api/
│   └── ocr.js          # Vercel Serverless Function（OCR 代理）
├── vercel.json         # Vercel 配置（CORS + 函数路由）
└── README.md
```

## 🔄 后续更新

修改 `index.html` 后 `git push`，Vercel 和 GitHub Pages 都会自动部署。
