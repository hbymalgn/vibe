// Test endpoint to check D1 database connection
export async function onRequestGet(context) {
    const { env } = context;
    
    try {
        const result = {
            envExists: !!env,
            dbExists: !!env?.DB,
            timestamp: new Date().toISOString()
        };
        
        if (env?.DB) {
            try {
                // Try to query the database
                const testQuery = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
                result.dbQuerySuccess = true;
                result.userCount = testQuery?.count || 0;
            } catch (dbError) {
                result.dbQuerySuccess = false;
                result.dbError = dbError.message;
            }
        }
        
        return new Response(
            JSON.stringify(result, null, 2),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({
                error: error.message,
                stack: error.stack,
                envExists: !!env,
                dbExists: !!env?.DB
            }, null, 2),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

