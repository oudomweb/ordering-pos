-- ==========================================
-- DOCTOR AI DATABASE SCHEMA (PostgreSQL)
-- With indexes
-- ==========================================

-- =========================
-- 1. ROLES
-- =========================
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

-- =========================
-- 2. USERS
-- =========================
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'active', -- active, pending, blocked
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);

-- =========================
-- 3. DOCTOR PROFILES
-- =========================
CREATE TABLE doctor_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    license_number VARCHAR(100) UNIQUE,
    specialization VARCHAR(120),
    hospital_name VARCHAR(150),
    verification_status VARCHAR(30) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    approved_by BIGINT,
    approved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_doctor_profiles_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_doctor_profiles_approved_by
        FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE INDEX idx_doctor_profiles_verification_status ON doctor_profiles(verification_status);
CREATE INDEX idx_doctor_profiles_approved_by ON doctor_profiles(approved_by);

-- =========================
-- 4. AUTH SESSIONS
-- =========================
CREATE TABLE auth_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    device_name VARCHAR(150),
    ip_address VARCHAR(64),
    user_agent TEXT,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP,
    expires_at TIMESTAMP,
    revoked_at TIMESTAMP,
    status VARCHAR(30) NOT NULL DEFAULT 'active', -- active, expired, revoked
    CONSTRAINT fk_auth_sessions_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX idx_auth_sessions_status ON auth_sessions(status);
CREATE INDEX idx_auth_sessions_expires_at ON auth_sessions(expires_at);
CREATE INDEX idx_auth_sessions_started_at ON auth_sessions(started_at);

-- =========================
-- 5. REFRESH TOKENS
-- =========================
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    token_hash TEXT NOT NULL,
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    replaced_by_token_id BIGINT,
    CONSTRAINT fk_refresh_tokens_session
        FOREIGN KEY (session_id) REFERENCES auth_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_refresh_tokens_replaced_by
        FOREIGN KEY (replaced_by_token_id) REFERENCES refresh_tokens(id)
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_session_id ON refresh_tokens(session_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- =========================
-- 6. LOGIN HISTORIES
-- =========================
CREATE TABLE login_histories (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    session_id BIGINT,
    login_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP,
    ip_address VARCHAR(64),
    user_agent TEXT,
    login_status VARCHAR(30) NOT NULL DEFAULT 'success', -- success, failed
    fail_reason TEXT,
    CONSTRAINT fk_login_histories_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_login_histories_session
        FOREIGN KEY (session_id) REFERENCES auth_sessions(id) ON DELETE SET NULL
);

CREATE INDEX idx_login_histories_user_id ON login_histories(user_id);
CREATE INDEX idx_login_histories_session_id ON login_histories(session_id);
CREATE INDEX idx_login_histories_login_time ON login_histories(login_time);
CREATE INDEX idx_login_histories_login_status ON login_histories(login_status);

-- =========================
-- 7. DOCUMENTS
-- =========================
CREATE TABLE documents (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- pdf, docx, txt
    status VARCHAR(30) NOT NULL DEFAULT 'active', -- active, archived, deleted
    uploaded_by BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_documents_uploaded_by
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_created_at ON documents(created_at);

-- =========================
-- 8. DOCUMENT VERSIONS
-- =========================
CREATE TABLE document_versions (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL,
    version_no INT NOT NULL,
    change_note TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    uploaded_by BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_document_versions UNIQUE (document_id, version_no),
    CONSTRAINT fk_document_versions_document
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    CONSTRAINT fk_document_versions_uploaded_by
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE INDEX idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX idx_document_versions_is_active ON document_versions(is_active);
CREATE INDEX idx_document_versions_created_at ON document_versions(created_at);

-- =========================
-- 9. DOCUMENT CHUNKS
-- =========================
CREATE TABLE document_chunks (
    id BIGSERIAL PRIMARY KEY,
    document_version_id BIGINT NOT NULL,
    chunk_index INT NOT NULL,
    page_number INT,
    content TEXT NOT NULL,
    embedding_ref TEXT, -- vector db reference/key
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_document_chunks UNIQUE (document_version_id, chunk_index),
    CONSTRAINT fk_document_chunks_version
        FOREIGN KEY (document_version_id) REFERENCES document_versions(id) ON DELETE CASCADE
);

CREATE INDEX idx_document_chunks_document_version_id ON document_chunks(document_version_id);
CREATE INDEX idx_document_chunks_page_number ON document_chunks(page_number);

-- =========================
-- 10. ARTICLES
-- =========================
CREATE TABLE articles (
    id BIGSERIAL PRIMARY KEY,
    author_user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    summary TEXT,
    content TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft', -- draft, pending_review, published, rejected, archived
    published_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_articles_author
        FOREIGN KEY (author_user_id) REFERENCES users(id)
);

CREATE INDEX idx_articles_author_user_id ON articles(author_user_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_published_at ON articles(published_at);
CREATE INDEX idx_articles_created_at ON articles(created_at);

-- =========================
-- 11. ARTICLE REVIEWS
-- =========================
CREATE TABLE article_reviews (
    id BIGSERIAL PRIMARY KEY,
    article_id BIGINT NOT NULL,
    reviewer_id BIGINT NOT NULL,
    decision VARCHAR(30) NOT NULL, -- approved, rejected, revision_required
    comment TEXT,
    reviewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_article_reviews_article
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    CONSTRAINT fk_article_reviews_reviewer
        FOREIGN KEY (reviewer_id) REFERENCES users(id)
);

CREATE INDEX idx_article_reviews_article_id ON article_reviews(article_id);
CREATE INDEX idx_article_reviews_reviewer_id ON article_reviews(reviewer_id);
CREATE INDEX idx_article_reviews_reviewed_at ON article_reviews(reviewed_at);

-- =========================
-- 12. PATIENT CASES
-- =========================
CREATE TABLE patient_cases (
    id BIGSERIAL PRIMARY KEY,
    doctor_user_id BIGINT NOT NULL,
    patient_code VARCHAR(100) NOT NULL,
    age INT,
    sex VARCHAR(20),
    symptoms_text TEXT,
    history_text TEXT,
    vital_signs_text TEXT,
    provisional_note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_patient_cases_doctor
        FOREIGN KEY (doctor_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_patient_cases_doctor_user_id ON patient_cases(doctor_user_id);
CREATE INDEX idx_patient_cases_patient_code ON patient_cases(patient_code);
CREATE INDEX idx_patient_cases_created_at ON patient_cases(created_at);

-- =========================
-- 13. AI QUERIES
-- =========================
CREATE TABLE ai_queries (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    patient_case_id BIGINT,
    query_type VARCHAR(30) NOT NULL, -- safe_mode, doctor_rag, patient_case
    question_text TEXT NOT NULL,
    answer_text TEXT,
    model_name VARCHAR(100),
    response_time_ms INT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ai_queries_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ai_queries_patient_case
        FOREIGN KEY (patient_case_id) REFERENCES patient_cases(id) ON DELETE SET NULL
);

CREATE INDEX idx_ai_queries_user_id ON ai_queries(user_id);
CREATE INDEX idx_ai_queries_patient_case_id ON ai_queries(patient_case_id);
CREATE INDEX idx_ai_queries_query_type ON ai_queries(query_type);
CREATE INDEX idx_ai_queries_created_at ON ai_queries(created_at);

-- =========================
-- 14. AI QUERY CITATIONS
-- =========================
CREATE TABLE ai_query_citations (
    id BIGSERIAL PRIMARY KEY,
    ai_query_id BIGINT NOT NULL,
    document_id BIGINT NOT NULL,
    document_version_id BIGINT,
    chunk_id BIGINT,
    page_number INT,
    excerpt_text TEXT,
    CONSTRAINT fk_ai_query_citations_query
        FOREIGN KEY (ai_query_id) REFERENCES ai_queries(id) ON DELETE CASCADE,
    CONSTRAINT fk_ai_query_citations_document
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    CONSTRAINT fk_ai_query_citations_document_version
        FOREIGN KEY (document_version_id) REFERENCES document_versions(id) ON DELETE SET NULL,
    CONSTRAINT fk_ai_query_citations_chunk
        FOREIGN KEY (chunk_id) REFERENCES document_chunks(id) ON DELETE SET NULL
);

CREATE INDEX idx_ai_query_citations_ai_query_id ON ai_query_citations(ai_query_id);
CREATE INDEX idx_ai_query_citations_document_id ON ai_query_citations(document_id);
CREATE INDEX idx_ai_query_citations_document_version_id ON ai_query_citations(document_version_id);
CREATE INDEX idx_ai_query_citations_chunk_id ON ai_query_citations(chunk_id);

-- =========================
-- 15. AUDIT LOGS
-- =========================
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    action VARCHAR(100) NOT NULL, -- approve_doctor, upload_document, publish_article
    entity_type VARCHAR(100) NOT NULL, -- users, documents, articles
    entity_id BIGINT NOT NULL,
    old_value_json JSONB,
    new_value_json JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_logs_user
        FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type_entity_id ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =========================
-- OPTIONAL SEED DATA
-- =========================
INSERT INTO roles (name, description) VALUES
('public_user', 'General public user'),
('doctor', 'Verified doctor user'),
('admin', 'System administrator');