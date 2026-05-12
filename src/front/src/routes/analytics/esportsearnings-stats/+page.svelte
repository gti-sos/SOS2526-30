<script>
    import { onMount } from 'svelte';

    let chartContainer;
    let errorMessage = $state('');

    onMount(async () => {
        try {
            // 1. Importamos Highcharts
            const Highcharts = (await import('highcharts')).default;

            // 2. Pedimos los datos a tu API v2 (con el truco antiborrado)
            let response = await fetch('/api/v2/esportsearnings-stats?t=' + Date.now());
            if (!response.ok) throw new Error('Error al cargar los datos de la API');
            
            let rawData = await response.json();
            let data = Array.isArray(rawData) ? rawData : (rawData.data || []);

            // SALVAVIDAS: Si Render ha borrado la base de datos, la rellenamos
            if (data.length === 0) {
                await fetch('/api/v2/esportsearnings-stats/loadInitialData');
                response = await fetch('/api/v2/esportsearnings-stats?t=' + Date.now());
                rawData = await response.json();
                data = Array.isArray(rawData) ? rawData : (rawData.data || []);
            }

            if (data.length === 0) {
                throw new Error("No hay datos disponibles en la base de datos.");
            }

            // Ordenamos por año para que el gráfico no haga saltos raros
            data.sort((a, b) => (a.year || 0) - (b.year || 0));

            // 3. Preparamos TUS datos
            const categories = data.map(d => `${d.country || 'N/A'} (${d.year || 'N/A'})`);
            const money = data.map(d => Number(((d.total_money || 0) / 1000000).toFixed(2))); // Convertido a Millones $
            const tournaments = data.map(d => d.tournament_no || 0);

            // 4. Dibujamos TU gráfico (Tipo: bar - Barras Horizontales)
            if (chartContainer) {
                Highcharts.chart(chartContainer, {
                    chart: {
                        type: 'bar',
                        backgroundColor: '#ffffff'
                    },
                    title: { text: '💰 Ganancias y Torneos en eSports' },
                    subtitle: { text: 'Visualización Individual - Mario' },
                    xAxis: {
                        categories: categories,
                        title: { text: 'País y Año' },
                        crosshair: true
                    },
                    yAxis: [
                        { min: 0, title: { text: 'Dinero Total (Millones $)' } },
                        { min: 0, title: { text: 'Nº Torneos' }, opposite: true }
                    ],
                    tooltip: { shared: true },
                    plotOptions: {
                        bar: {
                            borderRadius: 4 // Bordes redondeados para que quede más moderno
                        }
                    },
                    series: [
                        {
                            name: 'Dinero Total',
                            data: money,
                            color: '#10b981', // Verde estilo compañero
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
            console.error(error);
            errorMessage = error.message;
        }
    });
</script>

<svelte:head>
    <title>Gráfica Analítica - eSports Earnings</title>
</svelte:head>

<main>
    <h1>📊 Analítica de eSports Earnings (V2)</h1>
    
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
    main {
        max-width: 1000px;
        margin: 2rem auto;
        padding: 1rem;
        font-family: sans-serif;
    }
    h1 {
        color: #7e22ce;
        text-align: center;
        border-bottom: 2px solid #a855f7;
        padding-bottom: 0.5rem;
    }
    .nav-links {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-bottom: 2rem;
    }
    a {
        text-decoration: none;
        padding: 0.8rem 1.5rem;
        border-radius: 8px;
        font-weight: bold;
        color: white;
        transition: 0.2s;
    }
    .btn-green { background: #10b981; }
    .btn-green:hover { background: #059669; }
    
    .chart-container {
        width: 100%;
        height: 550px;
        border-radius: 12px;
        box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
        border: 1px solid #e9d5ff;
        padding: 1rem;
        box-sizing: border-box;
    }
    .error {
        color: #dc2626;
        text-align: center;
        background: #fee2e2;
        padding: 1rem;
        border-radius: 8px;
        font-weight: bold;
    }
</style>
