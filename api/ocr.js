// /api/ocr.js - Vercel Serverless Function
// 调用百度 OCR 高精度版识别图片文字
// AK/SK 通过 Vercel 环境变量配置：BAIDU_OCR_AK / BAIDU_OCR_SK

// 模块级缓存（同一实例多次调用复用 token，避免每次都请求百度 token 接口）
let cachedToken = null;
let tokenExpireAt = 0;

/**
 * 获取百度 access_token（带缓存，30 天有效期）
 */
async function getToken() {
    const now = Date.now();
    // 提前 60 秒过期，避免边界情况
    if (cachedToken && now < tokenExpireAt - 60000) {
        return cachedToken;
    }

    const ak = process.env.BAIDU_OCR_AK;
    const sk = process.env.BAIDU_OCR_SK;
    if (!ak || !sk) {
        throw new Error('Missing BAIDU_OCR_AK or BAIDU_OCR_SK environment variables');
    }

    const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${encodeURIComponent(ak)}&client_secret=${encodeURIComponent(sk)}`;
    const resp = await fetch(url, { method: 'POST' });
    const data = await resp.json();

    if (!data.access_token) {
        throw new Error('Failed to get access_token: ' + JSON.stringify(data));
    }

    cachedToken = data.access_token;
    tokenExpireAt = now + (data.expires_in || 2592000) * 1000;
    return cachedToken;
}

/**
 * Vercel Serverless Function 入口
 */
export default async function handler(req, res) {
    // CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed, use POST' });
    }

    try {
        // 兼容 application/json 和 form-urlencoded
        let image = null;
        if (typeof req.body === 'string') {
            try {
                const parsed = JSON.parse(req.body);
                image = parsed.image;
            } catch (e) {
                // 尝试 form-urlencoded
                const params = new URLSearchParams(req.body);
                image = params.get('image');
            }
        } else if (req.body && req.body.image) {
            image = req.body.image;
        }

        if (!image) {
            return res.status(400).json({ error: 'missing image field (base64 string)' });
        }

        // 去掉可能的 data:image/...;base64, 前缀
        const base64Match = image.match(/^data:image\/[^;]+;base64,(.+)$/);
        const pureBase64 = base64Match ? base64Match[1] : image;

        const token = await getToken();

        // 调用百度 OCR 高精度版（每天 500 次免费）
        const ocrUrl = `https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic?access_token=${token}`;
        const ocrResp = await fetch(ocrUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `image=${encodeURIComponent(pureBase64)}`
        });
        const ocrData = await ocrResp.json();

        // 返回简化结构
        if (ocrData.error_code) {
            return res.status(400).json({
                error: `Baidu OCR error ${ocrData.error_code}: ${ocrData.error_msg}`,
                raw: ocrData
            });
        }

        const words = (ocrData.words_result || []).map(w => w.words);
        return res.status(200).json({
            success: true,
            log_id: ocrData.log_id,
            words_result_num: ocrData.words_result_num,
            words: words,
            lines: words   // 别名，方便前端使用
        });
    } catch (e) {
        console.error('OCR handler error:', e);
        return res.status(500).json({ error: e.message });
    }
}
