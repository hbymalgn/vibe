// /vibe/vibe/js/auth.js

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const logoutButton = document.getElementById('logoutButton');

    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const id = document.getElementById('email').value; // input id는 email이지만 실제로는 id 값
            const password = document.getElementById('password').value;

            fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id, password }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // 사용자 정보를 로컬 스토리지에 저장
                    localStorage.setItem('vibe_user', JSON.stringify(data.user));
                    sessionStorage.setItem('vibe_user', JSON.stringify(data.user));
                    window.location.href = '/dashboard.html';
                } else {
                    alert(data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            });
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            fetch('/api/auth/logout', {
                method: 'POST',
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.href = '/login.html';
                } else {
                    alert(data.message);
                }
            })
            .catch(error => console.error('Error:', error));
        });
    }
});