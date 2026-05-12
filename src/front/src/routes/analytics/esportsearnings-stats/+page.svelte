<script>
    import { onMount, tick } from 'svelte';

    let chartContainer;
    let errorMessage = $state('');
    let loading = $state(true);

    onMount(async () => {
        await tick();
        try {
            const Highcharts = (await import('highcharts')).default;

            // 1. LLAMADA LIMPIA (Sin el ?limit= ni el ?t= que rompían tu backend)
            let response = await fetch('/api/v2/esportsearnings-stats');
            
            // Si la v2 falla, usamos la v1
            if (!response.ok) {
                console.log("La v2 falló, cambiando a la v1...");
                response = await fetch('/api/v1/esportsearnings-stats');
            }

            if (!response.ok) throw new Error('No se pudo conectar con la API (Ni v1 ni v2)');
            
            let rawData = await response.json();
            let data = Array.isArray(rawData) ? rawData : (rawData.data || []);

            // 2. SALVAVIDAS
            if (data.length === 0) {
                console.log("Base de datos vacía, rellenando...");
                // Usamos la V1 para rellenar, ya que hemos comprobado que es más estable en tu grupal
                await fetch('/api/v1/esportsearnings-stats/loadInitialData');
                
                // Llamada limpia de nuevo
                response = await fetch('/api/v1/esportsearnings-stats');
                rawData = await response.json();
                data = Array.isArray(rawData) ? rawData : (rawData.data || []);
            }

            if (data.length === 0) {
                throw new Error("No hay datos en la base de datos.");
            }

            // Ordenar por año
            data.sort((a, b) => (a.year || 0) - (b.year || 0));

            // Preparamos los datos
            const categories = data.map(d => `${d.country} (${d.year})`);
            const money = data.map(d => Number(((d.total_money || 0) / 1000000).toFixed(2)));
            const tournaments = data.map(d => d.tournament_no || 0);

            loading = false;
            await tick(); 

            // 3. Dibujamos el gráfico
            if (chartContainer) {
                Highcharts.chart(chartContainer, {
                    chart: {
                        type: 'bar', // Tu barra horizontal original
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
            console.error(error);
            errorMessage = error.message;
            loading = false;
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

    {#if loading}
        <div class="loading-box">
            <div class="spinner"></div>
            <p>Conectando con la base de datos...</p>
        </div>
    {:else if errorMessage}
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
    .error { color: #dc2626; text-align: center; background: #fee2e2; padding: 2rem; border-radius: 8px; font-weight: bold; border: 1px solid #fca5a5; margin-top: 2rem;}
    
    /* Efecto de carga */
    .loading-box { text-align: center; padding: 4rem; background: #f0fdf4; border-radius: 12px; border: 1px solid #d1fae5; color: #059669; font-weight: bold; }
    .spinner { border: 4px solid #d1fae5; border-top: 4px solid #10b981; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
