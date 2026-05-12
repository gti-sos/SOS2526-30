<script>
    import { onMount } from 'svelte';

    let chartContainer;
    let errorMessage = '';

    onMount(async () => {
        try {
            const Highcharts = (await import('highcharts')).default;

            // 1. Cargamos los datos de TU API en la V2 (con anti-caché)
            let response = await fetch('/api/v2/esportsearnings-stats?t=' + Date.now());
            if (!response.ok) throw new Error('No se pudo conectar con la API v2');
            
            let rawData = await response.json();
            let data = Array.isArray(rawData) ? rawData : (rawData.data || []);

            // SALVAVIDAS: Si el servidor de Render ha borrado los datos, los recuperamos
            if (data.length === 0) {
                await fetch('/api/v2/esportsearnings-stats/loadInitialData');
                response = await fetch('/api/v2/esportsearnings-stats?t=' + Date.now());
                rawData = await response.json();
                data = Array.isArray(rawData) ? rawData : (rawData.data || []);
            }

            if (data.length === 0) {
                throw new Error("No hay datos en la base de datos.");
            }

            data.sort((a, b) => a.year - b.year);

            // 2. Preparamos los datos usando tus nombres de variable (total_money, tournament_no)
            const categories = data.map(d => `${d.country} (${d.year})`);
            
            // Dividimos entre 1 millón para que cuadre con tu etiqueta "M$" en el eje
            const money = data.map(d => Number(((d.total_money || 0) / 1000000).toFixed(2))); 
            const tournaments = data.map(d => d.tournament_no || 0);

            // 3. Dibujamos el gráfico
            if (chartContainer) {
                Highcharts.chart(chartContainer, {
                    chart: {
                        type: 'bar', // Único en el grupo
                        backgroundColor: '#ffffff'
                    },
                    title: { text: '💰 Ganancias y Torneos en eSports' },
                    subtitle: { text: 'Visualización Individual - Mario' },
                    xAxis: {
                        categories: categories,
                        title: { text: 'País y Año' }
                    },
                    yAxis: [
                        { title: { text: 'Dinero Total (M$)' }, min: 0 },
                        { title: { text: 'Nº Torneos' }, opposite: true, min: 0 }
                    ],
                    tooltip: { shared: true },
                    series: [
                        {
                            name: 'Dinero Total',
                            data: money,
                            color: '#10b981', // Verde
                            tooltip: { valueSuffix: ' M$' }
                        },
                        {
                            name: 'Torneos',
                            data: tournaments,
                            color: '#fbbf24', // Dorado
                            yAxis: 1
                        }
                    ]
                });
            }
        } catch (error) {
            errorMessage = error.message;
        }
    });
</script>

<svelte:head>
    <title>Analítica - Mario</title>
</svelte:head>

<main class="container">
    <h1>📊 Mi Análisis de eSports Earnings</h1>
    
    <div class="nav">
        <a href="/analytics/esportsearnings-stats/map" class="btn">🌍 Ir al Mapa</a>
    </div>

    {#if errorMessage}
        <div class="error">❌ {errorMessage}</div>
    {:else}
        <div bind:this={chartContainer} class="chart"></div>
    {/if}
</main>

<style>
    .container { max-width: 1000px; margin: 2rem auto; padding: 1rem; font-family: sans-serif; }
    h1 { color: #064e3b; text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
    .nav { display: flex; justify-content: center; margin-bottom: 2rem; }
    .btn { background: #10b981; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; }
    .chart { width: 100%; height: 550px; border-radius: 12px; border: 1px solid #d1fae5; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .error { color: #dc2626; text-align: center; background: #fee2e2; padding: 1rem; border-radius: 8px; }
</style>
