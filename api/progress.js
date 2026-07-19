// /api/progress.js - Vercel Serverless Function
// 代理 GitHub Gist 读写，前端不需要 Token
// Token 存在 Vercel 环境变量 GIST_TOKEN 里

const GIST_ID = "3d534e4ab1aca5964ab6378dc8bd75e8";
const GITHUB_API = "https://api.github.com";

function getCorsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };
}

export default async function handler(req, res) {
    // CORS
    const corsHeaders = getCorsHeaders();
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const token = process.env.GIST_TOKEN;
    if (!token) {
        return res.status(500).json({ error: 'Server not configured: missing GIST_TOKEN' });
    }

    try {
        // 路由：GET /api/progress?username=xxx  - 读取用户数据
        //       POST /api/progress  body: {username, data}  - 写入用户数据
        
        if (req.method === 'GET') {
            const username = req.query.username;
            if (!username || !/^[a-zA-Z0-9_\-]+$/.test(username) === false) {
                return res.status(400).json({ error: 'Invalid username' });
            }
            const filename = `progress_${username}.json`;
            
            // 获取整个 Gist
            const resp = await fetch(`${GITHUB_API}/gists/${GIST_ID}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!resp.ok) {
                const err = await resp.json();
                throw new Error(`Gist read failed: ${err.message || resp.status}`);
            }
            const gist = await resp.json();
            const file = gist.files[filename];
            
            if (!file) {
                // 该用户还没有云端记录
                return res.status(200).json({ 
                    success: true, 
                    found: false,
                    message: 'No data for this user yet' 
                });
            }
            
            const content = JSON.parse(file.content);
            return res.status(200).json({ 
                success: true, 
                found: true,
                data: content 
            });
        }
        
        if (req.method === 'POST') {
            const { username, data } = req.body || {};
            if (!username || !/^[a-zA-Z0-9_\-]+$/.test(username)) {
                return res.status(400).json({ error: 'Invalid username' });
            }
            if (!data) {
                return res.status(400).json({ error: 'Missing data' });
            }
            
            const filename = `progress_${username}.json`;
            
            // 更新 Gist 中的特定文件
            const resp = await fetch(`${GITHUB_API}/gists/${GIST_ID}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    description: "高压电工错题集 - 多用户做题记录",
                    files: {
                        [filename]: {
                            content: typeof data === 'string' ? data : JSON.stringify(data, null, 2)
                        }
                    }
                })
            });
            
            if (!resp.ok) {
                const err = await resp.json();
                throw new Error(`Gist write failed: ${err.message || resp.status}`);
            }
            
            return res.status(200).json({ 
                success: true,
                message: 'Progress saved',
                username: username,
                savedAt: new Date().toISOString()
            });
        }
        
        return res.status(405).json({ error: 'Method not allowed' });
        
    } catch (e) {
        console.error('Progress API error:', e);
        return res.status(500).json({ error: e.message });
    }
}
