CREATE TABLE IF NOT EXISTS tasks (
  id           TEXT PRIMARY KEY,
  title        TEXT        NOT NULL,
  subject      TEXT        NOT NULL,
  due_date     DATE        NOT NULL,
  priority     TEXT        NOT NULL CHECK (priority IN ('baixa', 'media', 'alta', 'urgente')),
  status       TEXT        NOT NULL CHECK (status IN ('pendente', 'fazendo', 'concluida')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks (due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status);
