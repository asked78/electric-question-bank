// /api/progress.js - Vercel Serverless Function
// 代理 GitHub Gist 读写，前端不需要 Token
// Token 存在 Vercel 环境变量 GIST_TOKEN 里
// ★ 关键改进：后端做合并，避免前端竞态条件

const GIST_ID = "3d534e4ab1aca5964ab6378dc8bd75e8";
const GITHUB_API = "https://api.github.com";

function getCorsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };
}

// 获取整个 Gist
async function getGist(token) {
    const resp = await fetch(`${GITHUB_API}/gists/${GIST_ID}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!resp.ok) {
        const err = await resp.json();
        throw new Error(`Gist read failed: ${err.message || resp.status}`);
    }
    return await resp.json();
}

// 更新 Gist
async function updateGist(token, files) {
    const resp = await fetch(`${GITHUB_API}/gists/${GIST_ID}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            description: "高压电工错题集 - 多用户做题记录",
            files: files
        })
    });
    if (!resp.ok) {
        const err = await resp.json();
        throw new Error(`Gist write failed: ${err.message || resp.status}`);
    }
    return await resp.json();
}

// 合并两个数据集（取并集）
function mergeData(localData, cloudData) {
    if (!cloudData) return localData;
    
    const cloudWrong = new Set(cloudData.wrongList || []);
    const cloudFinished = new Set(cloudData.finished || []);
    const cloudFav = new Set(cloudData.favoriteList || []);
    
    // 本地数据加入并集
    (localData.wrongList || []).forEach(id => cloudWrong.add(id));
    (localData.finished || []).forEach(id => cloudFinished.add(id));
    (localData.favoriteList || []).forEach(id => cloudFav.add(id));
    
    return {
        version: 2,
        username: localData.username,
        lastUpdated: new Date().toISOString(),
        device: localData.device,
        wrongList: Array.from(cloudWrong),
        finished: Array.from(cloudFinished),
        favoriteList: Array.from(cloudFav),
        stats: {
            totalQuestions: localData.stats?.totalQuestions || 0,
            completedCount: cloudFinished.size,
            wrongCount: cloudWrong.size,
            favoriteCount: cloudFav.size
        }
    };
}

export default async function handler(req, res) {
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
        // GET /api/progress?username=xxx - 读取用户数据
        if (req.method === 'GET') {
            const username = req.query.username;
            if (!username || !/^[a-zA-Z0-9_\-]+$/.test(username)) {
                return res.status(400).json({ error: 'Invalid username' });
            }
            const filename = `progress_${username}.json`;
            
            const gist = await getGist(token);
            const file = gist.files[filename];
            
            if (!file) {
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
        
        // POST /api/progress - 合并并写入用户数据
        if (req.method === 'POST') {
            const { username, data } = req.body || {};
            if (!username || !/^[a-zA-Z0-9_\-]+$/.test(username)) {
                return res.status(400).json({ error: 'Invalid username' });
            }
            if (!data) {
                return res.status(400).json({ error: 'Missing data' });
            }
            
            const filename = `progress_${username}.json`;
            
            // ★ 关键：先读取云端当前数据
            const gist = await getGist(token);
            const existingFile = gist.files[filename];
            const cloudData = existingFile ? JSON.parse(existingFile.content) : null;
            
            // 合并本地和云端数据
            const mergedData = mergeData(data, cloudData);
            
            // 写入合并后的数据
            await updateGist(token, {
                [filename]: {
                    content: JSON.stringify(mergedData, null, 2)
                }
            });
            
            return res.status(200).json({ 
                success: true,
                message: 'Progress merged and saved',
                username: username,
                savedAt: mergedData.lastUpdated,
                stats: mergedData.stats,
                mergedData: mergedData  // 返回合并后的数据，前端可以更新本地
            });
        }
        
        return res.status(405).json({ error: 'Method not allowed' });
        
    } catch (e) {
        console.error('Progress API error:', e);
        return res.status(500).json({ error: e.message });
    }
}
