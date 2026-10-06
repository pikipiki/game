#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SONAR_URL="${SONAR_HOST_URL:-http://localhost:9000}"
SONAR_TOKEN="${SONAR_TOKEN:-}"
ADMIN_PASS="${SONAR_ADMIN_PASSWORD:-SonarLocalDev2026!}"

compose() {
  docker compose -f docker-compose.sonar.yml "$@"
}

wait_for_sonar() {
  echo "Attente de SonarQube sur ${SONAR_URL}…"
  for _ in $(seq 1 90); do
    if curl -sf "${SONAR_URL}/api/system/status" | grep -q '"status":"UP"'; then
      echo "SonarQube est prêt."
      return 0
    fi
    sleep 4
  done
  echo "SonarQube ne répond pas après ~6 min." >&2
  return 1
}

ensure_token() {
  if [[ -n "$SONAR_TOKEN" ]]; then
    return 0
  fi
  if curl -sf -u "admin:${ADMIN_PASS}" "${SONAR_URL}/api/authentication/validate" | grep -q '"valid":true'; then
    :
  elif curl -sf -u admin:admin "${SONAR_URL}/api/authentication/validate" | grep -q '"valid":true'; then
    curl -sf -u admin:admin -X POST \
      "${SONAR_URL}/api/users/change_password?login=admin&previousPassword=admin&password=${ADMIN_PASS}" >/dev/null
  else
    echo "Impossible de s'authentifier (définissez SONAR_TOKEN)." >&2
    return 1
  fi
  SONAR_TOKEN="$(
    curl -sf -u "admin:${ADMIN_PASS}" -X POST \
      "${SONAR_URL}/api/user_tokens/generate?name=local-scanner-$(date +%s)" \
      | sed -n 's/.*"token":"\([^"]*\)".*/\1/p'
  )"
  export SONAR_TOKEN
  echo "Token scanner généré (session courante uniquement)."
}

echo "Couverture Vitest (lcov)…"
pnpm test:coverage

if ! curl -sf "${SONAR_URL}/api/system/status" | grep -q '"status":"UP"'; then
  echo "Démarrage du conteneur SonarQube…"
  compose up -d
  wait_for_sonar
fi

ensure_token

echo "Analyse Sonar…"
pnpm exec sonar-scanner-npm \
  -Dsonar.host.url="${SONAR_URL}" \
  -Dsonar.token="${SONAR_TOKEN}"

echo ""
echo "Rapport : ${SONAR_URL}/dashboard?id=royaumes-des-peluches"
echo "Métriques (complexité par fichier) :"
curl -sf -u "admin:${ADMIN_PASS}" \
  "${SONAR_URL}/api/measures/component_tree?component=royaumes-des-peluches&metricKeys=complexity,cognitive_complexity,ncloc&strategy=leaves&ps=500&s=complexity&asc=false" \
  | node -e "
const chunks = [];
process.stdin.on('data', (d) => chunks.push(d));
process.stdin.on('end', () => {
  const raw = Buffer.concat(chunks).toString().trim();
  if (!raw) {
    console.warn('Métriques Sonar indisponibles (réponse API vide).');
    return;
  }
  const data = JSON.parse(raw);
  const rows = (data.components || [])
    .filter((c) => c.path && c.measures?.length)
    .map((c) => {
      const m = Object.fromEntries(c.measures.map((x) => [x.metric, x.value]));
      return {
        path: c.path,
        complexity: m.complexity ?? '-',
        cognitive: m.cognitive_complexity ?? '-',
        ncloc: m.ncloc ?? '-',
      };
    })
    .sort((a, b) => Number(b.complexity) - Number(a.complexity))
    .slice(0, 25);
  console.table(rows);
});
"
