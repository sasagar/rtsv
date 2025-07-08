
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    access_code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    question_type TEXT NOT NULL, -- 'multiple-choice', 'free-text', 'multiple-select'
    options JSONB,
    is_open BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE answers (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    answer_text TEXT,
    selected_options JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
