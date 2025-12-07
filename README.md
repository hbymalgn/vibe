# VIBE EDiT - 웹 기반 디자인 에디터

Canva 스타일의 웹 기반 디자인 에디터입니다. 텍스트, 이미지, 도형을 사용하여 디자인을 만들고 내보낼 수 있습니다.

## 주요 기능

- **사용자 인증**: 아이디/비밀번호 기반 로그인 및 회원가입
- **디자인 캔버스**: 텍스트, 이미지, 도형을 추가하고 편집할 수 있는 캔버스
- **프로젝트 관리**: 디자인을 저장하고 관리할 수 있는 대시보드
- **내보내기**: PNG, JPEG, HTML 형식으로 내보내기
- **계정 관리**: 프로필 수정 및 계정 삭제

## 기술 스택

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Cloudflare Pages Functions
- **Database**: Cloudflare D1 (SQLite)
- **Deployment**: Cloudflare Pages

## 프로젝트 구조

```
vibe/
├── index.html              # 메인 랜딩 페이지
├── login.html              # 로그인 페이지
├── register.html           # 회원가입 페이지
├── dashboard.html          # 대시보드
├── editor.html             # 에디터
├── functions/              # Cloudflare Pages Functions
│   └── api/
│       ├── auth/           # 인증 API
│       ├── admin/          # 관리자 API
│       └── projects/       # 프로젝트 API
├── css/                    # 스타일시트
├── js/                     # JavaScript 파일
├── schema.sql              # D1 데이터베이스 스키마
└── wrangler.toml           # Cloudflare 설정
```

## 배포

### Cloudflare Pages 배포

1. **GitHub에 푸시**
   ```bash
   git push origin main
   ```

2. **Cloudflare Dashboard에서 배포**
   - Workers & Pages > Create application > Pages
   - "Connect to Git" 선택
   - GitHub 저장소 연결
   - 프로젝트 이름: `vibeedit`
   - Build command: (비워두기)
   - Build output directory: `.`

3. **배포 후 접속**
   - URL: `https://vibeedit.pages.dev`

### D1 데이터베이스 설정

1. Cloudflare Dashboard > D1에서 데이터베이스 생성
2. `schema.sql` 파일 실행하여 테이블 생성
3. `wrangler.toml`에 database_id 설정

자세한 배포 가이드는 `README-DEPLOY.md`를 참고하세요.

## 로컬 개발

```bash
# 의존성 설치
npm install

# 로컬 서버 실행 (Express.js)
npm start

# Cloudflare Pages 로컬 개발
npx wrangler pages dev .
```

## 라이선스

MIT License
