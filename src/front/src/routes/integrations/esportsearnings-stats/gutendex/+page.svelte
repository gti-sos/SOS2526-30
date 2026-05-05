<script>
    import { onMount, tick } from 'svelte';
    import Highcharts from 'highcharts';

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

            const moneyByCountry = {};
            esportsData.forEach(item => {
                if (item.country) moneyByCountry[item.country] = (moneyByCountry[item.country] || 0) + item.total_money;
            });

            const resC = await fetch('https://corsproxy.io/?https://restcountries.com/v3.1/all');
            const countriesData = await resC.json();

            const categories = [];
            const esportsMoney = [];
            const populations = [];

            Object.keys(moneyByCountry).forEach(c => {
                const match = countriesData.find(cd => cd.name.common.toLowerCase().includes(c.toLowerCase()));
                if (match) {
                    categories.push(c);
                    esportsMoney.push(moneyByCountry[c]);
                    populations.push(match.population);
                }
            });

            loading = false;
            setTimeout(() => {
                Highcharts.chart('chart-poblacion', {
                    chart: { type: 'column' },
                    title: { text: 'eSports vs Población Mundial', style: { color: '#7e22ce' } },
                    xAxis: { categories },
                    yAxis: [{ title: { text: 'Dinero ($)' } }, { title: { text: 'Población' }, opposite: true }],
                    series: [
                        { name: 'Dinero eSports', data: esportsMoney, color: '#a855f7' },
                        { name: 'Población', type: 'spline', yAxis: 1, data: populations, color: '#10b981' }
                    ]
                });
            }, 100);
        } catch (e) { loading = false; }
    });
</script>

<div class="container">
    <a href="/integrations/esportsearnings-stats" class="back-link">← Volver</a>
    <div id="chart-poblacion" style="height: 500px;"></div>
    {#if loading}<p class="loading">Cargando países...</p>{/if}
</div>

<style>
    .container { max-width: 1000px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #e9d5ff; }
    .back-link { color: #7e22ce; text-decoration: none; font-weight: bold; }
    .loading { text-align: center; color: #7e22ce; }
</style>
