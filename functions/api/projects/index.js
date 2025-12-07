// Cloudflare Pages Function: GET/POST /api/projects
export async function onRequestGet(context) {
    const { request, env } = context;
    
    try {
        // URL에서 user_id 파라미터 가져오기
        const url = new URL(request.url);
        const userId = url.searchParams.get('user_id');
        
        if (!userId) {
            return new Response(
                JSON.stringify({ success: false, message: 'user_id가 필요합니다.' }),
                { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
        
        // 사용자의 프로젝트 목록 조회
        const projects = await env.DB.prepare(
            'SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC'
        ).bind(userId).all();
        
        return new Response(
            JSON.stringify({
                success: true,
                projects: projects.results || []
            }),
            { 
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
        
    } catch (error) {
        console.error('Get projects error:', error);
        return new Response(
            JSON.stringify({ success: false, message: '서버 오류가 발생했습니다.' }),
            { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const { user_id, name, data, thumbnail } = await request.json();
        
        if (!user_id || !name || !data) {
            return new Response(
                JSON.stringify({ success: false, message: '필수 필드가 누락되었습니다.' }),
                { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
        
        const now = Date.now();
        const result = await env.DB.prepare(
            'INSERT INTO projects (user_id, name, data, thumbnail, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(user_id, name, JSON.stringify(data), thumbnail || null, now, now).run();
        
        if (!result.success) {
            throw new Error('Failed to create project');
        }
        
        return new Response(
            JSON.stringify({
                success: true,
                project: {
                    id: result.meta.last_row_id,
                    user_id: user_id,
                    name: name,
                    created_at: now,
                    updated_at: now
                }
            }),
            { 
                status: 201,
                headers: { 'Content-Type': 'application/json' }
            }
        );
        
    } catch (error) {
        console.error('Create project error:', error);
        return new Response(
            JSON.stringify({ success: false, message: '서버 오류가 발생했습니다.' }),
            { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

