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

async function dispatch(env, workflow) {
  const res = await fetch(`https://api.github.com/repos/increazy/status/actions/workflows/${workflow}/dispatches`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'increazy-status-cron',
    },
    body: JSON.stringify({ ref: 'master' }),
  });
  if (res.status !== 204) throw new Error(`${workflow}: GitHub respondeu ${res.status}: ${await res.text()}`);
}

export const due = (time) => {
  const minute = Math.round(time / 60000);
  return WORKFLOWS.filter(([, every, offset]) => minute % every === offset).map(([w]) => w);
};

export default {
  async scheduled(event, env, ctx) {
    await Promise.all(due(event.scheduledTime).map((w) => dispatch(env, w)));
  },
};
