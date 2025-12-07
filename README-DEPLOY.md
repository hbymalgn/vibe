# VIBE EDiT - Cloudflare Pages 배포 가이드

## 1. D1 데이터베이스 설정

### D1 데이터베이스 생성
1. Cloudflare Dashboard에 로그인
2. Workers & Pages > D1로 이동
3. "Create database" 클릭
4. Database name: `vibe-database` 입력
5. 생성 후 Database ID를 복사

### wrangler.toml 설정
`wrangler.toml` 파일에서 `database_id`를 생성한 D1 데이터베이스 ID로 변경:

```toml
[[d1_databases]]
binding = "DB"
database_name = "vibe-database"
database_id = "여기에-생성한-데이터베이스-ID-입력"
```

### 스키마 적용
로컬에서 스키마를 적용하려면:

```bash
npx wrangler d1 execute vibe-database --file=./schema.sql
```

또는 Cloudflare Dashboard에서 직접 SQL 실행:
1. D1 데이터베이스 선택
2. "Console" 탭 클릭
3. `schema.sql` 파일의 내용 복사하여 실행

## 2. 관리자 계정 생성

### 방법 1: 브라우저에서 생성
1. `create-admin.html` 파일을 브라우저에서 열기
2. 자동으로 관리자 계정 생성됨
3. 생성된 계정 정보:
   - 아이디: `hby`
   - 비밀번호: `qhfhd!@123`

### 방법 2: API로 생성
```bash
curl -X POST https://your-project.pages.dev/api/admin/create-admin \
  -H "Content-Type: application/json" \
  -d '{"email":"hby","password":"qhfhd!@123","name":"관리자"}'
```

### 방법 3: 브라우저 콘솔에서 실행
브라우저 개발자 도구 콘솔에서:
```javascript
const users = JSON.parse(localStorage.getItem('vibe_users') || '[]');
users.push({
    name: '관리자',
    email: 'hby',
    password: 'qhfhd!@123',
    role: 'admin',
    createdAt: Date.now()
});
localStorage.setItem('vibe_users', JSON.stringify(users));
console.log('관리자 계정 생성 완료!');
```

## 3. Cloudflare Pages 배포

### GitHub 연동 배포 (권장)
1. GitHub에 프로젝트 푸시
2. Cloudflare Dashboard > Workers & Pages > Create application > Pages
3. "Connect to Git" 선택
4. GitHub 저장소 선택
5. Build settings:
   - Build command: (비워두기)
   - Build output directory: `.`
6. Environment variables 설정:
   - `NODE_ENV`: `production`
7. "Save and Deploy" 클릭

### Wrangler CLI로 배포
```bash
# 로그인
npx wrangler login

# 배포
npx wrangler pages deploy .
```

## 4. 프로젝트 구조

```
vibe/
├── functions/              # Cloudflare Pages Functions
│   └── api/
│       ├── auth/
│       │   ├── login.js
│       │   └── register.js
│       ├── admin/
│       │   └── create-admin.js
│       └── projects/
│           ├── index.js
│           └── [id].js
├── schema.sql             # D1 데이터베이스 스키마
├── create-admin.html      # 관리자 계정 생성 페이지
├── wrangler.toml          # Cloudflare 설정
└── ...
```

## 5. API 엔드포인트

### 인증
- `POST /api/auth/login` - 로그인
- `POST /api/auth/register` - 회원가입

### 관리자
- `POST /api/admin/create-admin` - 관리자 계정 생성

### 프로젝트
- `GET /api/projects?user_id={id}` - 프로젝트 목록 조회
- `POST /api/projects` - 프로젝트 생성
- `GET /api/projects/{id}` - 프로젝트 조회
- `PUT /api/projects/{id}` - 프로젝트 수정
- `DELETE /api/projects/{id}` - 프로젝트 삭제

## 6. 주의사항

1. **비밀번호 보안**: 현재는 평문 저장 중입니다. 프로덕션 환경에서는 반드시 해시 처리(bcrypt 등)를 적용해야 합니다.

2. **CORS 설정**: 필요시 `functions/_middleware.js`에서 CORS 헤더 추가

3. **환경 변수**: Cloudflare Dashboard에서 환경 변수 설정 가능

4. **로컬 개발**: 
   ```bash
   npx wrangler pages dev .
   ```

