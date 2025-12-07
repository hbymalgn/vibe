// 관리자 계정 생성 스크립트
// 브라우저 콘솔에서 실행하거나 별도 HTML 페이지에서 실행

(function() {
    const adminId = 'hby';
    const adminPassword = 'qhfhd!@123';
    const adminName = '관리자';
    
    // 기존 사용자 목록 가져오기
    const users = JSON.parse(localStorage.getItem('vibe_users') || '[]');
    
    // 이미 관리자 계정이 있는지 확인
    const existingAdmin = users.find(u => u.email === adminId);
    
    if (existingAdmin) {
        console.log('관리자 계정이 이미 존재합니다.');
        console.log('아이디:', existingAdmin.email);
        return;
    }
    
    // 관리자 계정 추가
    users.push({
        name: adminName,
        email: adminId,
        password: adminPassword,
        role: 'admin',
        createdAt: Date.now()
    });
    
    localStorage.setItem('vibe_users', JSON.stringify(users));
    
    console.log('✅ 관리자 계정이 생성되었습니다!');
    console.log('아이디:', adminId);
    console.log('비밀번호:', adminPassword);
    console.log('이제 로그인 페이지에서 로그인할 수 있습니다.');
})();

