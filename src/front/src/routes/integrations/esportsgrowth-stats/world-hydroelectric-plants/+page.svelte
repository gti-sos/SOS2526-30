<script>
    import { onMount } from 'svelte';

    let error = $state('');
    let loading = $state(true);

    onMount(() => {
        setTimeout(async () => {
            try {
                const res = await fetch('https://sos2526-27.onrender.com/api/v1/world-hydroelectric-plants');
                if (!res.ok) throw new Error("Error al contactar con la API del Grupo 27");
                const data = await res.json();

                let labels = [];
                let values = [];
                let valName = 'Valor';

                if (data && data.length > 0) {
                    let sKey = Object.keys(data[0]).find(k => typeof data[0][k] === 'string') || Object.keys(data[0])[0];
                    let nKey = Object.keys(data[0]).find(k => typeof data[0][k] === 'number' && k !== 'year' && k !== 'id') || Object.keys(data[0])[1];
                    valName = nKey;
                    data.slice(0, 8).forEach(d => { labels.push(String(d[sKey])); values.push(Number(d[nKey])); });
                }

                const treemapData = labels.map((label, index) => ({ x: label, y: values[index] }));

                const options = {
                    series: [{ data: treemapData }],
                    chart: { height: 450, type: 'treemap', toolbar: { show: false } },
                    colors: ['#7e22ce', '#9333ea', '#a855f7', '#c084fc', '#d8b4fe'],
                    plotOptions: { treemap: { distributed: true, enableShades: false } },
                    tooltip: { y: { formatter: (val) => val + " " + valName } }
                };
                
                // @ts-ignore
                const chart = new window.ApexCharts(document.querySelector("#treemap-chart"), options);
                chart.render();
                loading = false;

            } catch (err) {
                error = err.message;
                loading = false;
            }
        }, 500);
    });
</script>

<svelte:head>
    <title>Treemap - API Grupo 27</title>
    <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
</svelte:head>

<div class="page-container">
    <a href="/integrations/esportsgrowth-stats" class="back-btn">⬅ Volver al Menú Principal</a>
    
    <div class="content-card">
        <h2>Plantas Hidroeléctricas Mundiales</h2>
        <div class="badges">
            <span class="badge group">API Grupo 27</span>
            <span class="badge lib">ApexCharts | Treemap</span>
        </div>

        {#if loading}<p class="status">Conectando con la API y cargando datos...</p>{/if}
        {#if error}<p class="status error">❌ {error}</p>{/if}
        
        <div id="treemap-chart" class="chart-box" style="display: {loading ? 'none' : 'block'}"></div>
    </div>
</div>

<style>
    .page-container { max-width: 900px; margin: 2rem auto; padding: 0 1rem; font-family: sans-serif; }
    .back-btn { display: inline-block; margin-bottom: 2rem; color: #7e22ce; text-decoration: none; font-weight: bold; background: #f3e8ff; padding: 0.5rem 1rem; border-radius: 8px;}
    .back-btn:hover { background: #e9d5ff; }
    .content-card { background: white; padding: 2rem; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border: 1px solid #e9d5ff; }
    h2 { color: #334155; margin-top: 0; }
    .badges { margin-bottom: 2rem; }
    .badge { display: inline-block; padding: 0.3rem 0.8rem; border-radius: 999px; font-size: 0.85rem; font-weight: bold; margin-right: 0.5rem; }
    .badge.group { background: #e2e8f0; color: #475569; }
    .badge.lib { background: #f3e8ff; color: #7e22ce; }
    .chart-box { height: 450px; width: 100%; }
    .status { text-align: center; padding: 2rem; color: #64748b; }
    .status.error { color: #dc2626; background: #fee2e2; border-radius: 8px; font-weight: bold;}
</style>