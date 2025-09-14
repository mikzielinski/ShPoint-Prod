#!/usr/bin/env bash
set -euo pipefail

# Idź do katalogu repo (root)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# --- Wczytaj .env do ENV ---
if [[ -f .env ]]; then
  set -o allexport
  # shellcheck disable=SC1091
  source .env
  set +o allexport
fi

# Walidacja
: "${PYTHON_CMD:?Musisz ustawić PYTHON_CMD w .env (pełna ścieżka do pythona z .venv)}"
export PORT="${PORT:-3001}"
export RUN_SCRAPE_ON_BOOT="${RUN_SCRAPE_ON_BOOT:-false}"

# Zatrzymaj child-procesy przy wyjściu
trap 'jobs -pr | xargs -r kill' EXIT

# 1) Start backendu
( cd apps/server && npm run dev ) &

# 2) Czekaj aż backend wstanie
echo "Czekam na backend http://localhost:${PORT}/health ..."
until curl -fsS "http://localhost:${PORT}/health" >/dev/null; do sleep 0.5; done

# 3) Opcjonalny trigger sync
if [[ "${RUN_SCRAPE_ON_BOOT}" == "true" ]]; then
  echo "Triggeruję /admin/refresh-cards…"
  curl -fsS -X POST "http://localhost:${PORT}/admin/refresh-cards" || true
fi

# 4) Start Vite
( cd apps/client && npm run dev )
