# 🤖 AGENT.md - 助手指南（如果你是新对话的助手，请先读这个！）

## ⚡ 项目快速恢复

如果你是新对话的助手，**不要重新走授权流程**！所有授权都已完成：

```bash
# 一键部署最新版到 Vercel 生产环境
cd /workspace/project
git pull origin main
vercel deploy --prod --yes
# 部署地址：https://electric-question-bank.vercel.app
```

## 📋 项目概要

- **项目**：高压电工错题集（纯前端 HTML + Vercel 云函数）
- **GitHub**：https://github.com/asked78/electric-question-bank
- **Vercel 生产**：https://electric-question-bank.vercel.app
- **GitHub Pages**：https://asked78.github.io/electric-question-bank/

## 🔑 关键凭证（已配置好，无需重新授权）

| 服务 | 凭证 | 状态 |
|------|------|------|
| GitHub | 账号 asked78 | ✅ 已授权 `gh auth` |
| Vercel | 账号 1184893511-4406 | ✅ 已授权 `vercel login` |
| 百度 OCR AK | `bEqAXMhhLT4NB7YGesStYncL` | ✅ 已配置在 Vercel 环境变量 |
| 百度 OCR SK | `8l8J6J7L77RhW31m85Rw7cRYeWKJ4QLf` | ✅ 已配置在 Vercel 环境变量 |

## 📁 文件结构

```
/workspace/project/
├── index.html          # 主程序（主站）
├── preview.html        # 预览版（含新上传流程，用户在测试）
├── api/
│   └── ocr.js          # Vercel Serverless Function（百度 OCR 代理）
├── vercel.json         # Vercel 配置
├── README.md
└── AGENT.md            # 这个文件
```

## 🎯 用户场景（重要！）

- 用户使用 **iPhone 14 Pro Max + WorkBuddy APP** 和助手对话
- 用户已充值 WorkBuddy
- 用户在 WorkBuddy APP 里打开题库页面
- 点「📷上传题目」按钮 → 弹出操作指引 → 用户切到做题 APP 截图 → 切回 WorkBuddy 发图给助手

## 🔄 用户上传题目完整流程

当用户在 WorkBuddy 对话发送题目截图时，助手应该：

1. **下载图片**：用 `curl` 从附件 URL 下载到 `/tmp/user_question.jpg`
2. **调用百度 OCR**：

```python
import base64, json, urllib.request, urllib.parse

with open('/tmp/user_question.jpg', 'rb') as f:
    img_b64 = base64.b64encode(f.read()).decode()

AK = "bEqAXMhhLT4NB7YGesStYncL"
SK = "8l8J6J7L77RhW31m85Rw7cRYeWKJ4QLf"

# 获取 token
token_resp = urllib.request.urlopen(
    urllib.request.Request(
        f"https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id={AK}&client_secret={SK}",
        method='POST'
    ), timeout=15
)
token = json.loads(token_resp.read())['access_token']

# 调用 OCR
data = urllib.parse.urlencode({'image': img_b64}).encode()
req = urllib.request.Request(
    f"https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic?access_token={token}",
    data=data,
    headers={'Content-Type': 'application/x-www-form-urlencoded'}
)
with urllib.request.urlopen(req, timeout=30) as resp:
    result = json.loads(resp.read())
words = [w['words'] for w in result.get('words_result', [])]
```

3. **智能解析**（识别题干、选项 A-D、答案标号）
4. **加入题库**：修改 `preview.html` 的 `SEED_QUESTIONS` 数组
5. **部署**：
```bash
cd /workspace/project
git add -A && git commit -m "feat: 添加新题目 - <题干前20字>"
git push origin main
vercel deploy --prod --yes
```
6. **告诉用户**刷新页面

## 🧠 智能解析算法

```javascript
// 选项识别
const optRegex = /^([A-D])[\.、\)\::\s]\s*(.+)$/;

// 答案识别（多种格式）
const ansRegexList = [
    /(?:答案|正确答案|参考答案|答)\s*[是:：为]\s*([A-D正确错误对错√×])/,
    /[（(]\s*([A-D正确错误对错√×])\s*[）)]/
];

// 判断题识别
const judgeOpts = ['正确', '错误', '对', '错', '√', '×'];

// 题号清理
q = q.replace(/^[\d]+[\.、\::\s]+/, '').trim();
```

## ⚠️ 绝对不要做的事情

- ❌ 不要重新 `gh auth login`（已授权）
- ❌ 不要重新 `vercel login`（已授权）
- ❌ 不要重新创建 GitHub 仓库（已存在）
- ❌ 不要重新创建 Vercel 项目（已存在）
- ❌ 不要重新让用户授权百度 OCR
- ❌ 不要使用复杂的 OCR Modal 让用户在手机端操作

## ✅ 应该做的事情

- ✅ 直接修改代码 + `git push` + `vercel deploy --prod --yes`
- ✅ 用户发图后，直接 OCR + 解析 + 入题库 + 部署
- ✅ 部署后告诉用户刷新页面
- ✅ 保持简洁的对话风格

## 📞 用户偏好

- 要求"记住我的项目 要求保存记忆"
- 用户喜欢简洁，不喜欢繁琐流程
- 用户在 iPhone 上操作，UI 要适配手机
- 用户使用 WorkBuddy APP 对话，发的图片助手能收到

## 📅 项目历史

- 2026-07-19 23:32 - 项目开始
- 2026-07-19 23:54 - GitHub Pages 部署
- 2026-07-20 00:25 - Vercel 部署完成
- 2026-07-20 00:33 - OCR 功能完成
- 2026-07-20 00:48 - preview.html 创建（新上传流程）
- 2026-07-20 01:04 - 简化上传按钮为操作指引

## 🆘 紧急恢复

如果 Vercel 部署出问题：
```bash
cd /workspace/project
vercel ls                    # 查看所有部署
vercel deploy --prod --yes   # 重新部署
```

如果 GitHub 推送出问题：
```bash
cd /workspace/project
git remote -v                # 查看远程
git push origin main         # 重新推送
```

如果百度 OCR 失败：
- 检查 AK/SK 是否正确
- 检查 Vercel 环境变量是否配置
- 在 https://console.bce.baidu.com/ai/#/ai/ocr/app/list 重置密钥
