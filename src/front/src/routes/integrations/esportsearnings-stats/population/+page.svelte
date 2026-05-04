<script>
    import { onMount } from 'svelte';
    
    let loading = $state(true);
    let error = $state(null);
    let combinedData = [];
    let chartContainer;

    onMount(async () => {
        try {
            // 1. Obtenemos TUS datos de eSports (v2 para no tener problemas)
            const resEsports = await fetch('/api/v2/esportsearnings-stats');
            if (!resEsports.ok) throw new Error('Error al cargar eSports');
            const esportsData = await resEsports.json();

            // Agrupamos el dinero total por país de tus datos
            const moneyByCountry = {};
            esportsData.forEach(item => {
                const country = item.country;
                if (country) {
                    moneyByCountry[country] = (moneyByCountry[country] || 0) + item.total_money;
                }
            });

            // 2. Obtenemos datos de la API externa RestCountries
            const resCountries = await fetch('https://restcountries.com/v3.1/all');
            if (!resCountries.ok) throw new Error('Error al cargar RestCountries');
            const countriesData = await resCountries.json();

            // 3. Cruzamos los datos (Tu país de eSports VS Población de ese país)
            const categories = [];
            const esportsMoney = [];
            const populations = [];

            Object.keys(moneyByCountry).forEach(esportCountry => {
                // Buscamos si el país de tu base de datos existe en la API externa
                const matchedCountry = countriesData.find(c => 
                    c.name.common.toLowerCase().includes(esportCountry.toLowerCase()) || 
                    esportCountry.toLowerCase().includes(c.name.common.toLowerCase())
                );

                if (matchedCountry) {
                    categories.push(esportCountry);
                    esportsMoney.push(moneyByCountry[esportCountry]);
                    populations.push(matchedCountry.population);
                    
                    combinedData.push({
                        country: esportCountry,
                        money: moneyByCountry[esportCountry],
                        population: matchedCountry.population
                    });
                }
            });

            if (categories.length === 0) throw new Error('No hubo coincidencias de países');

            loading = false;

            // 4. Dibujamos el gráfico
            const Highcharts = (await import('highcharts')).default;
            
            Highcharts.chart(chartContainer, {
                chart: { type: 'column', backgroundColor: '#ffffff' },
                title: { text: '🎮 eSports Earnings vs 🌍 Población Mundial' },
                subtitle: { text: 'Integración Externa 1: API RestCountries' },
                xAxis: { categories: categories, crosshair: true },
                yAxis: [
                    { 
                        title: { text: 'Dinero en eSports ($)' },
                        labels: { format: '${value}' }
                    },
                    { 
                        title: { text: 'Población Total' },
                        opposite: true // Lo ponemos a la derecha
                    }
                ],
                tooltip: { shared: true },
                series: [
                    {
                        name: 'Dinero Ganado (eSports)',
                        type: 'column',
                        yAxis: 0,
                        data: esportsMoney,
                        color: '#a855f7' // Morado de tu tema
                    },
                    {
                        name: 'Población del País',
                        type: 'spline', // Combinamos columna con línea para que quede profesional
                        yAxis: 1,
                        data: populations,
                        color: '#10b981', // Verde
                        marker: { lineWidth: 2, lineColor: '#10b981', fillColor: 'white' }
                    }
                ]
            });

        } catch (err) {
            error = err.message;
            loading = false;
        }
    });
</script>

<svelte:head>
    <title>Integración RestCountries</title>
</svelte:head>

<div class="container">
    <h1>Integración: eSports vs Población (RestCountries)</h1>

    {#if loading}
        <div class="loading">Cargando y cruzando datos de APIs...</div>
    {:else if error}
        <div class="error">❌ {error}</div>
    {:else}
        <div bind:this={chartContainer} class="chart"></div>
        
        <div class="info">
            <h3>📖 Detalles de la Integración</h3>
            <ul>
                <li><strong>API Propia:</strong> <code>/api/v2/esportsearnings-stats</code> (Dinero por país)</li>
                <li><strong>API Externa:</strong> <code>https://restcountries.com/v3.1/all</code> (Población por país)</li>
                <li><strong>Visualización:</strong> Highcharts (Columna + Línea) - Combinación permitida</li>
            </ul>
        </div>
    {/if}
</div>

<style>
    .container { max-width: 1000px; margin: 2rem auto; padding: 2rem; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    h1 { color: #7e22ce; text-align: center; border-bottom: 2px solid #a855f7; padding-bottom: 0.5rem; }
    .chart { width: 100%; height: 500px; margin-top: 2rem; }
    .loading { text-align: center; color: #a855f7; font-weight: bold; padding: 3rem; }
    .error { text-align: center; color: #dc2626; background: #fee2e2; padding: 1rem; border-radius: 8px; }
    .info { margin-top: 2rem; padding: 1rem; background: #faf5ff; border-radius: 8px; border-left: 4px solid #7e22ce; }
</style>
