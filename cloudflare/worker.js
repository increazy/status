// O schedule do GitHub Actions atrasa horas em repo gratuito; este cron da Cloudflare dispara o Uptime CI a cada 5 min
export default {
  async scheduled(event, env, ctx) {
    const res = await fetch('https://api.github.com/repos/increazy/status/actions/workflows/uptime.yml/dispatches', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'increazy-status-cron',
      },
      body: JSON.stringify({ ref: 'master' }),
    });
    if (res.status !== 204) throw new Error(`GitHub respondeu ${res.status}: ${await res.text()}`);
  },
};
