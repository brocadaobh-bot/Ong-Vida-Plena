-- ============================================================
-- Migration 003: Tabelas de Cursos e Turmas
-- courses, classes, class_sessions
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Tabela: courses
-- ─────────────────────────────────────────────────────────────
CREATE TABLE courses (
  id             UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  title          VARCHAR(255)    NOT NULL,
  description    TEXT,
  category       course_category NOT NULL DEFAULT 'other',
  workload_hours INTEGER         CHECK (workload_hours IS NULL OR workload_hours > 0),
  requirements   TEXT,
  status         course_status   NOT NULL DEFAULT 'draft',
  created_by     UUID            REFERENCES profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_courses_status     ON courses(status);
CREATE INDEX idx_courses_category   ON courses(category);
CREATE INDEX idx_courses_created_by ON courses(created_by);

CREATE TRIGGER trg_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────
-- Tabela: classes
-- Turmas vinculadas a um curso e um instrutor
-- ─────────────────────────────────────────────────────────────
CREATE TABLE classes (
  id                   UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id            UUID         NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  instructor_id        UUID         REFERENCES profiles(id) ON DELETE SET NULL,
  name                 VARCHAR(255) NOT NULL,
  start_date           DATE         NOT NULL,
  end_date             DATE,
  capacity             INTEGER      NOT NULL DEFAULT 30 CHECK (capacity > 0),
  location             VARCHAR(255),
  schedule_description TEXT,
  status               class_status NOT NULL DEFAULT 'planned',
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_classes_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_classes_course_id     ON classes(course_id);
CREATE INDEX idx_classes_instructor_id ON classes(instructor_id);
CREATE INDEX idx_classes_status        ON classes(status);
CREATE INDEX idx_classes_start_date    ON classes(start_date);

CREATE TRIGGER trg_classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────
-- Tabela: class_sessions
-- Aulas/encontros de uma turma
-- ─────────────────────────────────────────────────────────────
CREATE TABLE class_sessions (
  id           UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id     UUID           NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  session_date DATE           NOT NULL,
  start_time   TIME,
  end_time     TIME,
  topic        VARCHAR(255),
  status       session_status NOT NULL DEFAULT 'scheduled',
  created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_session_times CHECK (end_time IS NULL OR end_time > start_time)
);

CREATE INDEX idx_class_sessions_class_id     ON class_sessions(class_id);
CREATE INDEX idx_class_sessions_session_date ON class_sessions(session_date);
CREATE INDEX idx_class_sessions_status       ON class_sessions(status);

CREATE TRIGGER trg_class_sessions_updated_at
  BEFORE UPDATE ON class_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
