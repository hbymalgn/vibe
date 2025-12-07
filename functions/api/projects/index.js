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
        const result = await env.DB.prepare(
            'SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC'
        ).bind(userId).all();
        
        // data 필드는 JSON 문자열이므로 파싱하지 않고 그대로 반환 (필요시 클라이언트에서 파싱)
        return new Response(
            JSON.stringify({
                success: true,
                projects: result.results || []
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
        
        // 프로젝트 ID 생성 (UUID 또는 타임스탬프 기반)
        const projectId = `vibe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = Date.now();
        
        const result = await env.DB.prepare(
            'INSERT INTO projects (id, user_id, name, data, thumbnail, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(projectId, user_id, name, JSON.stringify(data), thumbnail || null, now, now).run();
        
        if (!result.success) {
            throw new Error('Failed to create project');
        }
        
        return new Response(
            JSON.stringify({
                success: true,
                project: {
                    id: projectId,
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

