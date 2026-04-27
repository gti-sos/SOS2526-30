<script>
    import { onMount } from 'svelte';

    let chartContainer;
    let errorMessage = '';

    onMount(async () => {
        try {
            // 1. Importamos Highcharts de forma dinámica
            const Highcharts = (await import('highcharts')).default;

            // 2. Cargamos los datos de TU API
            const response = await fetch('/api/v1/esportsearnings-stats');
            if (!response.ok) throw new Error('No se pudo conectar con la API de Earnings');
            
            const data = await response.json();

            // Ordenamos por año para que la cronología sea correcta
            data.sort((a, b) => a.year - b.year);

            // 3. Preparamos tus categorías y series de datos
            const categories = data.map(d => `${d.country} (${d.year})`);
            const earnings = data.map(d => d.earnings);
            const tournaments = data.map(d => d.tournaments);

            // 4. Configuración del Gráfico
            Highcharts.chart(chartContainer, {
                chart: {
                    type: 'bar', // Tipo Barras Horizontales: Único en el grupo
                    backgroundColor: '#ffffff'
                },
                title: {
                    text: '💰 Análisis de Ganancias y Torneos en eSports'
                },
                subtitle: {
                    text: 'Visualización individual - Mario'
                },
                xAxis: {
                    categories: categories,
                    title: { text: 'País (Año)' },
                    gridLineWidth: 1
                },
                yAxis: [
                    { // Eje para el dinero
                        title: { text: 'Ganancias Totales (M$)' },
                        labels: { format: '{value}M' }
                    },
                    { // Eje para el número de torneos
                        title: { text: 'Cantidad de Torneos' },
                        opposite: true
                    }
                ],
                tooltip: {
                    shared: true,
                    borderRadius: 10
                },
                plotOptions: {
                    bar: {
                        dataLabels: { enabled: true },
                        borderWidth: 0
                    }
                },
                series: [
                    {
                        name: 'Ganancias (Millones)',
                        data: earnings,
                        color: '#059669', // Verde esmeralda
                        tooltip: { valuePrefix: '$', valueSuffix: ' M' }
                    },
                    {
                        name: 'Nº de Torneos',
                        data: tournaments,
                        color: '#f59e0b', // Ámbar/Dorado
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
    <title>Analítica Individual - Mario</title>
</svelte:head>

<div class="analytics-wrapper">
    <div class="header-section">
        <h1>📊 Estadísticas de Ganancias (Earnings)</h1>
        <p class="desc">Comparativa de ingresos generados y torneos disputados por país.</p>
        
        <div class="nav-links">
            <a href="/analytics/esportsearnings-stats/map" class="btn-map">🌍 Ver Mapa de Ganancias</a>
        </div>
    </div>

    <div class="chart-box">
        {#if errorMessage}
            <div class="error-msg">❌ Error: {errorMessage}</div>
        {:else}
            <div bind:this={chartContainer} style="width: 100%; height: 600px;"></div>
        {/if}
    </div>

    <div class="info-footer">
        <h3>💡 Sobre esta visualización</h3>
        <ul>
            <li><strong>Tipo de Gráfico:</strong> Barras horizontales (Bar), seleccionado para no repetir el estilo de los compañeros.</li>
            <li><strong>Datos Dinámicos:</strong> Se obtienen directamente de <code>/api/v1/esportsearnings-stats</code>.</li>
            <li><strong>Doble Eje:</strong> Permite comparar el dinero ganado (verde) frente al volumen de torneos (naranja) simultáneamente.</li>
        </ul>
    </div>
</div>

<style>
    .analytics-wrapper {
        max-width: 1100px;
        margin: 2rem auto;
        padding: 2rem;
        background: #f8fafc;
        border-radius: 20px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    h1 { color: #064e3b; text-align: center; margin-bottom: 0.5rem; }
    .desc { text-align: center; color: #4b5563; margin-bottom: 2rem; }

    .nav-links { display: flex; justify-content: center; margin-bottom: 2rem; }
    .btn-map {
        background: #059669;
        color: white;
        padding: 0.7rem 1.5rem;
        border-radius: 50px;
        text-decoration: none;
        font-weight: bold;
        transition: 0.3s;
    }
    .btn-map:hover { background: #047857; transform: scale(1.05); }

    .chart-box {
        background: white;
        padding: 1.5rem;
        border-radius: 15px;
        border: 1px solid #e2e8f0;
    }

    .info-footer {
        margin-top: 2rem;
        padding: 1.5rem;
        background: #ecfdf5;
        border-radius: 12px;
        border-left: 5px solid #059669;
    }
    .info-footer h3 { color: #064e3b; margin-top: 0; }
    .info-footer ul { margin-bottom: 0; }

    .error-msg {
        color: #b91c1c;
        background: #fef2f2;
        padding: 2rem;
        text-align: center;
        border-radius: 10px;
        font-weight: bold;
    }
</style>
