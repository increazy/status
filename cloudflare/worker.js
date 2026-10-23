// O schedule do GitHub Actions atrasa horas em repo gratuito; este cron da Cloudflare (1x por minuto) dispara os
// workflows do Upptime. Todos dividem o mesmo grupo de concurrency e o GitHub descarta um pendente quando chega outro:
// por isso cada um tem um deslocamento (resto) diferente e raramente caem no mesmo minuto.
// shortcut: 3 no mesmo minuto ainda acontece (~14x por dia) e um deles se perde; a próxima rodada cobre
const WORKFLOWS = [
  ['uptime.yml', 5, 0],
  ['response-time.yml', 6, 1], // gráfico de tempo de resposta
  ['graphs.yml', 7, 2], // gráficos (página de cada serviço)
  ['summary.yml', 7, 4], // disponibilidade %, tempo médio e as barras de 90 dias
];

// Relatório semanal de consumo por loja (inc usage, repo privado increazy/ecossistema): domingo 06:00 UTC
// (03:00 Brasília). A cron do GitHub às vezes nem dispara; aqui é o único gatilho dele. Token próprio
// (GITHUB_TOKEN_ECOSSISTEMA: Actions read/write no ecossistema), porque o GITHUB_TOKEN só enxerga o status.
const WEEKLY = [['increazy/ecossistema', 'usage-report.yml', 'main', 'GITHUB_TOKEN_ECOSSISTEMA', 0, 6, 0]];

async function dispatch(env, workflow, repo = 'increazy/status', ref = 'master', token = env.GITHUB_TOKEN) {
  const res = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/${workflow}/dispatches`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'increazy-status-cron',
    },
    body: JSON.stringify({ ref }),
  });
  if (res.status !== 204) throw new Error(`${workflow}: GitHub respondeu ${res.status}: ${await res.text()}`);
}

export const due = (time) => {
  const minute = Math.round(time / 60000);
  return WORKFLOWS.filter(([, every, offset]) => minute % every === offset).map(([w]) => w);
};

// semanais que caem neste minuto (dia da semana, hora e minuto em UTC)
export const dueWeekly = (time) => {
  const d = new Date(time);
  return WEEKLY.filter(([, , , , day, hour, min]) => d.getUTCDay() === day && d.getUTCHours() === hour && d.getUTCMinutes() === min);
};

export default {
  async scheduled(event, env, ctx) {
    await Promise.all([
      ...due(event.scheduledTime).map((w) => dispatch(env, w)),
      ...dueWeekly(event.scheduledTime).map(([repo, w, ref, tokenName]) => dispatch(env, w, repo, ref, env[tokenName])),
    ]);
  },
};
