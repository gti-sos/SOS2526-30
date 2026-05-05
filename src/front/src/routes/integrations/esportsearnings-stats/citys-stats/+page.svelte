<script>
    import { onMount, tick } from 'svelte';
    import Highcharts from 'highcharts';

    let loading = true;

    onMount(async () => {
        await tick();
        try {
            let resE = await fetch('/api/v2/esportsearnings-stats');
            let esportsData = await resE.json();
            
            const resC = await fetch('/api/proxy/citys-stats');
            const citysData = await resC.json();

            const moneyByYear = {};
            esportsData.forEach(d => { if(d.year) moneyByYear[d.year] = (moneyByYear[d.year] || 0) + d.total_money; });
            
            const allYears = Object.keys(moneyByYear).sort();
            const esportsV = allYears.map(y => moneyByYear[y] / 1000000);
            const citysV = allYears.map(y => citysData.filter(c => c.year == y).length);

            loading = false;
            setTimeout(() => {
                Highcharts.chart('chart-proxy', {
                    chart: { type: 'spline' },
                    title: { text: 'eSports vs Ciudades (Proxy G29)', style: { color: '#7e22ce' } },
                    xAxis: { categories: allYears },
                    series: [
                        { name: 'Dinero (M$)', data: esportsV, color: '#a855f7' },
                        { name: 'Registros Ciudades', data: citysV, color: '#0ea5e9' }
                    ]
                });
            }, 100);
        } catch (e) { loading = false; }
    });
</script>

<div class="container">
    <a href="/integrations/esportsearnings-stats" class="back-link">← Volver</a>
    <div id="chart-proxy" style="height: 500px;"></div>
    {#if loading}<p class="loading">Conectando vía Proxy...</p>{/if}
</div>

<style>
    .container { max-width: 1000px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #e9d5ff; }
    .back-link { color: #7e22ce; text-decoration: none; font-weight: bold; }
    .loading { text-align: center; color: #7e22ce; }
</style>