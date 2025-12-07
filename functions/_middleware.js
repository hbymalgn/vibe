// Cloudflare Pages Middleware
// CORS 및 기본 헤더 설정

export async function onRequest(context) {
    const { request, next } = context;
    
    // API 요청에 대한 CORS 헤더 추가
    if (request.url.includes('/api/')) {
        const response = await next();
        
        // CORS 헤더 추가
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        // OPTIONS 요청 처리
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: response.headers
            });
        }
        
        return response;
    }
    
    return next();
}

