-- D1 Database Schema for VIBE EDiT

-- 기존 테이블 삭제 (필요시)
-- DROP TABLE IF EXISTS projects;
-- DROP TABLE IF EXISTS users;

-- Users 테이블
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL, -- 일반 ID (텍스트)
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Projects 테이블
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY NOT NULL, -- UUID 또는 커스텀 ID
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    data TEXT NOT NULL, -- JSON 데이터
    thumbnail TEXT, -- 썸네일 이미지 URL 또는 base64
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
