<script>
    import { onMount } from 'svelte';

    let mapContainer;
    let errorMessage = '';

    onMount(async () => {
        try {
            const HighchartsModule = await import('highcharts/highmaps');
            const Highcharts = HighchartsModule.default || HighchartsModule;

            const topology = await fetch('https://code.highcharts.com/mapdata/custom/world.topo.json').then(r => r.json());

            // 1. Obtenemos TU API
            const response = await fetch('/api/v1/esportsearnings-stats');
            if (!response.ok) throw new Error('Error al cargar la API');
            const apiData = await response.json();

            // 2. Sumamos las ganancias por país
            const countryTotals = {};
            apiData.forEach(item => {
                const country = item.country;
                if (country) {
                    if (!countryTotals[country]) {
                        countryTotals[country] = { earnings: 0, count: 0 };
                    }
                    // REVISA: Cambia item.earnings por el nombre real de tu variable de dinero
                    countryTotals[country].earnings += item.earnings || 0; 
                    countryTotals[country].count++;
                }
            });

            // Códigos de países (Puedes añadir más si en tu API hay otros distintos)
            const countryCodes = {
                'Spain': 'es', 'United States': 'us', 'USA': 'us', 'China': 'cn',
                'Japan': 'jp', 'South Korea': 'kr', 'Brazil': 'br', 'Germany': 'de', 'France': 'fr'
            };

            const mapData = Object.entries(countryTotals).map(([name, stats]) => ({
                'hc-key': countryCodes[name],
                name: name,
                value: stats.earnings, // El color dependerá del dinero
                records: stats.count
            })).filter(d => d['hc-key']);

            // 3. Dibujamos el mapa
            Highcharts.mapChart(mapContainer, {
                chart: { map: topology, backgroundColor: '#ffffff', borderRadius: 12 },
                title: { text: '' }, 
                mapNavigation: { enabled: true, buttonOptions: { verticalAlign: 'bottom' } },
                colorAxis: {
                    min: 0,
                    stops: [
                        [0, '#d1fae5'],   // Verde clarito
                        [0.5, '#10b981'], // Verde medio
                        [1, '#047857']    // Verde oscuro
                    ]
                },
                tooltip: {
                    headerFormat: '<strong style="color: #047857; font-size: 14px;">{point.point.name}</strong><br><hr style="margin:5px 0;">',
                    pointFormat: '💰 Ganancias: <b>{point.value} M$</b><br>📊 Registros: <b>{point.records}</b>'
                },
                series: [{
                    data: mapData,
                    name: 'Ganancias',
                    states: { hover: { color: '#6ee7b7' } },
                    dataLabels: { enabled: true, format: '{point.name}' }
                }]
            });
        } catch (error) {
            errorMessage = error.message;
        }
    });
</script>

<svelte:head>
    <title>Mapa Geoespacial - eSports Earnings</title>
</svelte:head>

<div class="map-page-wrapper">
    <div class="map-header">
        <h1>🌍 Mapa Geoespacial: eSports Earnings</h1>
        <p class="subtitle">Visualización de ganancias en eSports por país</p>
        
        <div class="nav-links">
            <a href="/analytics/esportsearnings-stats" class="link-btn">📊 Volver a la Gráfica</a>
            <a href="/analytics/esportsgrowth-stats/map" class="link-btn">📈 David - Esports Growth Map</a>
            <a href="/analytics/esportsearnings-stats/map" class="link-btn active">💰 Mario - Esports Earnings Map</a>
            <a href="/analytics/olympics-athlete-events/map" class="link-btn">🏅 Gonzalo - Olympics Map</a>
            <a href="/analytics/cheaters-stats/map" class="link-btn">🗺️ Francisco - Cheaters Map</a>
        </div>
    </div>
    
    <div class="map-wrapper">
        {#if errorMessage}
            <div class="error"><p>❌ Error: {errorMessage}</p></div>
        {:else}
            <div bind:this={mapContainer} style="height: 500px; width: 100%;"></div>
        {/if}
    </div>
</div>

<style>
    .map-page-wrapper { max-width: 1400px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(16, 185, 129, 0.2); border: 1px solid #d1fae5; position: relative; min-height: 700px; font-family: sans-serif; }
    .map-header { margin-bottom: 1.5rem; }
    h1 { color: #047857; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #666; margin-bottom: 2rem; }
    .nav-links { display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
    .link-btn { background: #f0fdf4; color: #047857; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; font-weight: 500; border: 1px solid #d1fae5; transition: all 0.2s; }
    .link-btn:hover { background: #10b981; color: white; transform: translateY(-2px); }
    .link-btn.active { background: #10b981; color: white; border-color: #10b981; }
    .map-wrapper { border-radius: 12px; overflow: hidden; border: 1px solid #d1fae5; margin-bottom: 2rem; background: #f8fafc; }
    .error { text-align: center; padding: 2rem; margin: 1rem; color: #dc2626; background: #fee2e2; border-radius: 8px; font-weight: bold; }
</style>