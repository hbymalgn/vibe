// Cloudflare Pages Function: POST /api/auth/login
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
        const { id, password } = body;
        
        if (!id || !password) {
            return new Response(
                JSON.stringify({ success: false, message: '아이디와 비밀번호를 입력해주세요.' }),
                { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
        
        // D1 데이터베이스에서 사용자 조회
        const user = await env.DB.prepare(
            'SELECT * FROM users WHERE id = ?'
        ).bind(id).first();
        
        if (!user) {
            return new Response(
                JSON.stringify({ success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' }),
                { 
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
        
        // 비밀번호 확인 (실제로는 해시된 비밀번호를 비교해야 함)
        // 현재는 평문 비교 (나중에 bcrypt 등으로 변경 필요)
        if (user.password !== password) {
            return new Response(
                JSON.stringify({ success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' }),
                { 
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
        
        // 세션 정보 반환 (JWT 토큰 사용 권장)
        return new Response(
            JSON.stringify({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    role: user.role
                }
            }),
            { 
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
        
    } catch (error) {
        console.error('Login error:', error);
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

