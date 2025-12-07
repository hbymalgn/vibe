// Cloudflare Pages Function: POST /api/auth/register
export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        // D1 데이터베이스 연결 확인
        if (!env || !env.DB) {
            console.error('D1 database not available');
            return new Response(
                JSON.stringify({ success: false, message: '데이터베이스 연결 오류가 발생했습니다.' }),
                { 
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
        
        const body = await request.json();
        const { id, name, password } = body;
        
        if (!id || !name || !password) {
            return new Response(
                JSON.stringify({ success: false, message: '모든 필드를 입력해주세요.' }),
                { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
        
        if (password.length < 6) {
            return new Response(
                JSON.stringify({ success: false, message: '비밀번호는 최소 6자 이상이어야 합니다.' }),
                { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
        
        // 중복 확인
        const existingUser = await env.DB.prepare(
            'SELECT * FROM users WHERE id = ?'
        ).bind(id).first();
        
        if (existingUser) {
            return new Response(
                JSON.stringify({ success: false, message: '이미 사용 중인 아이디입니다.' }),
                { 
                    status: 409,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
        
        // 사용자 생성 (비밀번호는 나중에 해시 처리 필요)
        const now = Date.now();
        const result = await env.DB.prepare(
            'INSERT INTO users (id, name, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(id, name, password, 'user', now, now).run();
        
        if (!result.success) {
            throw new Error('Failed to create user');
        }
        
        return new Response(
            JSON.stringify({
                success: true,
                message: '회원가입이 완료되었습니다.',
                user: {
                    id: id,
                    name: name
                }
            }),
            { 
                status: 201,
                headers: { 'Content-Type': 'application/json' }
            }
        );
        
    } catch (error) {
        console.error('Register error:', error);
        return new Response(
            JSON.stringify({ 
                success: false, 
                message: '서버 오류가 발생했습니다.',
                error: error.message 
            }),
            { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

