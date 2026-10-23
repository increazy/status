// O schedule do GitHub Actions atrasa horas em repo gratuito; este cron da Cloudflare dispara os workflows do Upptime.
// Todos dividem o mesmo grupo de concurrency e o GitHub descarta um pendente quando chega outro: por isso os minutos
// ficam espaçados (nunca no mesmo minuto da checagem de 5 em 5).
const WORKFLOWS = {
  '*/5 * * * *': ['uptime.yml'],
  '2,12,22,32,42,52 * * * *': ['response-time.yml'], // gráfico de tempo de resposta
  '4,19,34,49 * * * *': ['graphs.yml'], // gráficos da home
  '8,23,38,53 * * * *': ['summary.yml'], // disponibilidade % e tempo médio
};

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

export default {
  async scheduled(event, env, ctx) {
    const workflows = WORKFLOWS[event.cron];
    if (!workflows) throw new Error(`cron sem workflow: ${event.cron}`);
    await Promise.all(workflows.map((w) => dispatch(env, w)));
  },
};
