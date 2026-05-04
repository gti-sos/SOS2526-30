<script>
    import { onMount } from 'svelte';

    let chartContainer;
    let errorMessage = '';

    onMount(async () => {
        try {
            const Highcharts = (await import('highcharts')).default;

            // ¡LA CLAVE ESTÁ AQUÍ! Usamos la v2 y añadimos el Date.now() para reventar la caché
            const response = await fetch('/api/v2/esportsearnings-stats?t=' + Date.now());
            
            if (!response.ok) throw new Error('No se pudo conectar con la API v2');
            
            const data = await response.json();
            
            // Ordenamos por año
            data.sort((a, b) => a.year - b.year);

            // Preparamos los datos
            const categories = data.map(d => `${d.country} (${d.year})`);
            const money = data.map(d => d.total_money);
            const tournaments = data.map(d => d.tournament_no);

            // Dibujamos el gráfico
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
                    { title: { text: 'Dinero Total (M$)' } },
                    { title: { text: 'Nº Torneos' }, opposite: true }
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
        } catch (error) {
            errorMessage = error.message;
        }
    });
</script>

<svelte:head>
    <title>Analítica - Mario</title>
</svelte:head>

<main class="container">
    <h1>📊 Mi Análisis de eSports Earnings (V2)</h1>
    
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
