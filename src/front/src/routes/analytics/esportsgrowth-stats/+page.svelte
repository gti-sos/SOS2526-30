<script>
    import { onMount } from 'svelte';

    let chartContainer;
    let errorMessage = '';

    onMount(async () => {
        try {
            // Importamos Highcharts dinámicamente para que no dé error en SvelteKit
            const Highcharts = (await import('highcharts')).default;

            // 1. Pedimos los datos a TU API
            const response = await fetch('/api/v1/esportsgrowth-stats');
            if (!response.ok) throw new Error('Error al cargar los datos de la API');
            
            const data = await response.json();

            // 2. Preparamos los datos para dárselos a Highcharts
            // Eje X: Etiqueta combinando País y Año (ej: "Spain (2019)")
            const categories = data.map(d => `${d.country} (${d.year})`);
            
            // Eje Y: Extraemos los valores que queremos pintar
            const activePlayers = data.map(d => d.active_player_no);
            const viewership = data.map(d => d.viewership);

            // 3. Dibujamos el gráfico
            Highcharts.chart(chartContainer, {
                chart: {
                    type: 'column' // ¡OJO! Cambia esto si tus compañeros ya usan 'column' (puedes usar 'area', 'bar', 'scatter'...)
                },
                title: {
                    text: 'Crecimiento de eSports: Jugadores vs Espectadores'
                },
                subtitle: {
                    text: 'Fuente: API v1 esportsgrowth-stats'
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
                    column: {
                        borderRadius: 4
                    }
                },
                series: [
                    {
                        name: 'Jugadores Activos',
                        data: activePlayers,
                        color: '#9333ea' // Morado de tu diseño
                    },
                    {
                        name: 'Espectadores',
                        data: viewership,
                        color: '#0284c7' // Azul de tu diseño
                    }
                ]
            });
        } catch (error) {
            errorMessage = error.message;
        }
    });
</script>

<svelte:head>
    <title>Analytics - eSports Growth</title>
</svelte:head>

<main>
    <h1>Analíticas: Crecimiento de eSports</h1>
    
    <div class="nav-links">
        <a href="/" class="btn-gray">Volver al Inicio</a>
        <a href="/esportsgrowth-stats" class="btn-purple">Ir a la Tabla de Datos</a>
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
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
        padding: 0.6rem 1.2rem;
        border-radius: 6px;
        font-weight: bold;
        color: white;
        transition: 0.2s;
    }
    .btn-gray { background: #6b7280; }
    .btn-gray:hover { background: #4b5563; }
    .btn-purple { background: #9333ea; }
    .btn-purple:hover { background: #7e22ce; }
    
    .chart-container {
        width: 100%;
        height: 500px;
        border-radius: 12px;
        box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
        border: 1px solid #e9d5ff;
        overflow: hidden;
        background: white;
        padding: 1rem;
        box-sizing: border-box;
    }
    .error {
        color: #dc2626;
        text-align: center;
        background: #fee2e2;
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid #f87171;
    }
</style>