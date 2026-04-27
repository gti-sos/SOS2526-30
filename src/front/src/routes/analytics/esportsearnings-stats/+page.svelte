<script>
    import { onMount } from 'svelte';

    let chartContainer;
    let errorMessage = '';

    onMount(async () => {
        try {
            const Highcharts = (await import('highcharts')).default;

            // 1. Pedimos los datos a TU API
            const response = await fetch('/api/v1/esportsearnings-stats');
            if (!response.ok) throw new Error('Error al cargar los datos de la API');
            
            const data = await response.json();
            data.sort((a, b) => a.year - b.year);

            // 2. Preparamos los datos (REVISA QUE ESTOS NOMBRES SEAN LOS DE TU API)
            const categories = data.map(d => `${d.country} (${d.year})`);
            const earnings = data.map(d => d.earnings); // Cambia d.earnings si tu variable se llama distinto
            const tournaments = data.map(d => d.tournaments); // Cambia d.tournaments si tu variable se llama distinto

            // 3. Dibujamos el gráfico
            Highcharts.chart(chartContainer, {
                chart: {
                    type: 'column' // TIPO: Columnas. Cumple el requisito de ser distinto al de tu compañero
                },
                title: {
                    text: 'Ganancias en eSports por País y Año'
                },
                xAxis: {
                    categories: categories,
                    title: { text: 'Países y Años' },
                    crosshair: true
                },
                yAxis: [
                    { // Eje primario para el dinero
                        min: 0,
                        title: { text: 'Ganancias (Millones $)' }
                    },
                    { // Eje secundario para los torneos (opuesto)
                        title: { text: 'Nº de Torneos' },
                        opposite: true
                    }
                ],
                tooltip: {
                    shared: true
                },
                series: [
                    {
                        name: 'Ganancias Totales',
                        data: earnings,
                        color: '#10b981', // Verde billete
                        tooltip: { valueSuffix: ' M$' }
                    },
                    {
                        name: 'Torneos Disputados',
                        data: tournaments,
                        color: '#fbbf24', // Dorado
                        yAxis: 1 // Lo enlaza al eje secundario
                    }
                ]
            });
        } catch (error) {
            errorMessage = error.message;
        }
    });
</script>

<svelte:head>
    <title>Gráfica Analítica - eSports Earnings</title>
</svelte:head>

<main>
    <h1>💰 Analítica de eSports Earnings</h1>
    
    <div class="nav-links">
        <a href="/analytics/esportsearnings-stats/map" class="btn-green">🌍 Ir al Mapa Geoespacial</a>
    </div>

    {#if errorMessage}
        <p class="error">❌ {errorMessage}</p>
    {:else}
        <div bind:this={chartContainer} class="chart-container"></div>
    {/if}
</main>

<style>
    main { max-width: 1000px; margin: 2rem auto; padding: 1rem; font-family: sans-serif; }
    h1 { color: #047857; text-align: center; border-bottom: 2px solid #34d399; padding-bottom: 0.5rem; }
    .nav-links { display: flex; gap: 1rem; justify-content: center; margin-bottom: 2rem; }
    a { text-decoration: none; padding: 0.8rem 1.5rem; border-radius: 8px; font-weight: bold; color: white; transition: 0.2s; }
    .btn-green { background: #10b981; }
    .btn-green:hover { background: #059669; }
    .chart-container { width: 100%; height: 500px; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border: 1px solid #d1fae5; padding: 1rem; box-sizing: border-box; }
    .error { color: #dc2626; text-align: center; background: #fee2e2; padding: 1rem; border-radius: 8px; }
</style>