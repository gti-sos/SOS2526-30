<script>
    import { onMount, tick } from 'svelte';
    import Chart from 'chart.js/auto';

    let loading = true;

    onMount(async () => {
        await tick();
        try {
            let res = await fetch('/api/v2/esportsearnings-stats');
            let esportsData = await res.json();
            if (!esportsData || esportsData.length === 0) {
                await fetch('/api/v2/esportsearnings-stats/loadInitialData');
                res = await fetch('/api/v2/esportsearnings-stats');
                esportsData = await res.json();
            }

            const resC = await fetch('https://corsproxy.io/?https://api.coincap.io/v2/assets?limit=10');
            const coinData = await resC.json();

            const games = esportsData.slice(0,10).map(d => d.game_name);
            const money = esportsData.slice(0,10).map(d => d.total_money / 1000000);
            const cryptos = coinData.data.map(c => parseFloat(c.priceUsd));

            loading = false;
            setTimeout(() => {
                new Chart(document.getElementById('chart-crypto'), {
                    type: 'bar',
                    data: {
                        labels: coinData.data.map(c => c.symbol),
                        datasets: [
                            { label: 'Premios eSports (M$)', data: money, backgroundColor: '#a855f7' },
                            { label: 'Precio Crypto ($)', data: cryptos, backgroundColor: '#10b981' }
                        ]
                    },
                    options: { scales: { y: { type: 'logarithmic' } } }
                });
            }, 100);
        } catch (e) { loading = false; }
    });
</script>

<div class="container">
    <a href="/integrations/esportsearnings-stats" class="back-link">← Volver</a>
    <div style="height: 500px;"><canvas id="chart-crypto"></canvas></div>
    {#if loading}<p class="loading">Cargando criptomonedas...</p>{/if}
</div>

<style>
    .container { max-width: 1000px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #e9d5ff; }
    .back-link { color: #7e22ce; text-decoration: none; font-weight: bold; }
    .loading { text-align: center; color: #7e22ce; }
</style>
