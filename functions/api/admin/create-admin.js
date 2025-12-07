// Cloudflare Pages Function: POST /api/admin/create-admin
// 관리자 계정 생성 (초기 설정용)
export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const { email, password, name } = await request.json();
        
        if (!email || !password) {
            return new Response(
                JSON.stringify({ success: false, message: '아이디와 비밀번호를 입력해주세요.' }),
                { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
        
        // 중복 확인
        const existingUser = await env.DB.prepare(
            'SELECT * FROM users WHERE email = ?'
        ).bind(email).first();
        
        if (existingUser) {
            return new Response(
                JSON.stringify({ success: false, message: '이미 존재하는 아이디입니다.' }),
                { 
                    status: 409,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
        
        // 관리자 계정 생성
        const now = Date.now();
        const result = await env.DB.prepare(
            'INSERT INTO users (email, name, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(email, name || '관리자', password, 'admin', now, now).run();
        
        if (!result.success) {
            throw new Error('Failed to create admin user');
        }
        
        return new Response(
            JSON.stringify({
                success: true,
                message: '관리자 계정이 생성되었습니다.',
                user: {
                    id: result.meta.last_row_id,
                    email: email,
                    name: name || '관리자',
                    role: 'admin'
                }
            }),
            { 
                status: 201,
                headers: { 'Content-Type': 'application/json' }
            }
        );
        
    } catch (error) {
        console.error('Create admin error:', error);
        return new Response(
            JSON.stringify({ success: false, message: '서버 오류가 발생했습니다.' }),
            { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

