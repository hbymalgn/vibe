// Cloudflare Pages Function: GET/PUT/DELETE /api/projects/[id]
export async function onRequestGet(context) {
    const { params, env } = context;
    const { id } = params;
    
    try {
        const project = await env.DB.prepare(
            'SELECT * FROM projects WHERE id = ?'
        ).bind(id).first();
        
        if (!project) {
            return new Response(
                JSON.stringify({ success: false, message: '프로젝트를 찾을 수 없습니다.' }),
                { 
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
        
        // JSON 데이터 파싱
        project.data = JSON.parse(project.data);
        
        return new Response(
            JSON.stringify({
                success: true,
                project: project
            }),
            { 
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
        
    } catch (error) {
        console.error('Get project error:', error);
        return new Response(
            JSON.stringify({ success: false, message: '서버 오류가 발생했습니다.' }),
            { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

export async function onRequestPut(context) {
    const { params, request, env } = context;
    const { id } = params;
    
    try {
        const { name, data, thumbnail } = await request.json();
        
        const now = Date.now();
        const result = await env.DB.prepare(
            'UPDATE projects SET name = ?, data = ?, thumbnail = ?, updated_at = ? WHERE id = ?'
        ).bind(
            name || null,
            data ? JSON.stringify(data) : null,
            thumbnail || null,
            now,
            id
        ).run();
        
        if (!result.success) {
            throw new Error('Failed to update project');
        }
        
        return new Response(
            JSON.stringify({
                success: true,
                message: '프로젝트가 업데이트되었습니다.'
            }),
            { 
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
        
    } catch (error) {
        console.error('Update project error:', error);
        return new Response(
            JSON.stringify({ success: false, message: '서버 오류가 발생했습니다.' }),
            { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

export async function onRequestDelete(context) {
    const { params, env } = context;
    const { id } = params;
    
    try {
        const result = await env.DB.prepare(
            'DELETE FROM projects WHERE id = ?'
        ).bind(id).run();
        
        if (!result.success) {
            throw new Error('Failed to delete project');
        }
        
        return new Response(
            JSON.stringify({
                success: true,
                message: '프로젝트가 삭제되었습니다.'
            }),
            { 
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
        
    } catch (error) {
        console.error('Delete project error:', error);
        return new Response(
            JSON.stringify({ success: false, message: '서버 오류가 발생했습니다.' }),
            { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

