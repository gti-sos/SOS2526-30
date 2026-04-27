<script>
    import { onMount } from 'svelte';

    let chartContainer;
    let errorMessage = '';

    onMount(async () => {
        try {
            // 1. Importamos Highcharts
            const Highcharts = (await import('highcharts')).default;

            // 2. Pedimos los datos a tu API
            const response = await fetch('/api/v1/esportsgrowth-stats');
            if (!response.ok) throw new Error('Error al cargar los datos de la API');
            
            const data = await response.json();

            // Ordenamos por año para que el gráfico no haga zig-zags raros
            data.sort((a, b) => a.year - b.year);

            // 3. Preparamos los datos
            const categories = data.map(d => `${d.country} (${d.year})`);
            const activePlayers = data.map(d => d.active_player_no);
            const viewership = data.map(d => d.viewership);

            // 4. Dibujamos el gráfico
            Highcharts.chart(chartContainer, {
                chart: {
                    type: 'area' // TIPO: Área. (Totalmente distinto al círculo de la foto)
                },
                title: {
                    text: 'Crecimiento de eSports: Jugadores vs Espectadores'
                },
                xAxis: {
                    categories: categories,
                    title: { text: 'Países y Años' },
                    crosshair: true
                },
                yAxis: {
                    min: 0,
                    title: { text: 'Millones de personas (M)' }
                },
                tooltip: {
                    shared: true,
                    valueSuffix: ' M'
                },
                plotOptions: {
                    area: {
                        fillOpacity: 0.5,
                        marker: {
                            enabled: true,
                            symbol: 'circle',
                            radius: 4
                        }
                    }
                },
                series: [
                    {
                        name: 'Jugadores Activos',
                        data: activePlayers,
                        color: '#9333ea' // Morado de tu tema
                    },
                    {
                        name: 'Espectadores',
                        data: viewership,
                        color: '#0ea5e9' // Azul claro
                    }
                ]
            });
        } catch (error) {
            errorMessage = error.message;
        }
    });
</script>

<svelte:head>
    <title>Gráfica Analítica - eSports Growth</title>
</svelte:head>

<main>
    <h1>📊 Analítica de eSports Growth</h1>
    
    <div class="nav-links">
        <a href="/analytics/esportsgrowth-stats/map" class="btn-green">🌍 Ir al Mapa Geoespacial</a>
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
        height: 500px;
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
    }
</style>