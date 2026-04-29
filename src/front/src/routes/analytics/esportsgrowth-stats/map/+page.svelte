<script>
    import { onMount } from 'svelte';

    let mapContainer;
    let errorMessage = $state('');

    onMount(async () => {
        try {
            // SOLUCIÓN: Importamos directamente 'highmaps' para que Render no rompa la función al minificar
            const HighchartsModule = await import('highcharts/highmaps');
            const Highcharts = HighchartsModule.default || HighchartsModule;

            // Cargamos el mapa del mundo topológico
            const topology = await fetch('https://code.highcharts.com/mapdata/custom/world.topo.json').then(r => r.json());

            // Obtenemos los datos de TU API
            const response = await fetch('/api/v1/esportsgrowth-stats');
            if (!response.ok) throw new Error('Error al cargar la API');
            const apiData = await response.json();

            // Sumamos los jugadores y espectadores por país
            const countryTotals = {};
            apiData.forEach(item => {
                const country = item.country;
                if (country) {
                    if (!countryTotals[country]) {
                        countryTotals[country] = { players: 0, viewers: 0, count: 0 };
                    }
                    countryTotals[country].players += item.active_player_no || 0;
                    countryTotals[country].viewers += item.viewership || 0;
                    countryTotals[country].count++;
                }
            });

            // Mapeamos tus países a los códigos de Highcharts (hc-key)
            const countryCodes = {
                'Spain': 'es',
                'United States': 'us',
                'USA': 'us',
                'China': 'cn',
                'Japan': 'jp',
                'South Korea': 'kr',
                'Brazil': 'br',
                'Germany': 'de',
                'France': 'fr'
            };

            // Preparamos los datos finales para el mapa
            const mapData = Object.entries(countryTotals).map(([name, stats]) => ({
                'hc-key': countryCodes[name],
                name: name,
                value: stats.players, // El color dependerá de los jugadores activos
                viewers: stats.viewers,
                records: stats.count
            })).filter(d => d['hc-key']);

            // Dibujamos el mapa
            Highcharts.mapChart(mapContainer, {
                chart: {
                    map: topology,
                    backgroundColor: '#ffffff',
                    borderRadius: 12
                },
                title: { text: '' }, 
                mapNavigation: {
                    enabled: true,
                    buttonOptions: { verticalAlign: 'bottom' }
                },
                colorAxis: {
                    min: 0,
                    stops: [
                        [0, '#f3e8ff'],   // Morado muy clarito
                        [0.5, '#a855f7'], // Morado medio
                        [1, '#7e22ce']    // Morado oscuro
                    ]
                },
                tooltip: {
                    headerFormat: '<strong style="color: #7e22ce; font-size: 14px;">{point.point.name}</strong><br><hr style="margin:5px 0;">',
                    pointFormat: '🎮 Jugadores: <b>{point.value} M</b><br>👀 Espectadores: <b>{point.viewers} M</b><br>📊 Registros: <b>{point.records}</b>'
                },
                series: [{
                    data: mapData,
                    name: 'Jugadores Activos',
                    states: {
                        hover: { color: '#d8b4fe' }
                    },
                    dataLabels: {
                        enabled: true,
                        format: '{point.name}'
                    }
                }]
            });
        } catch (error) {
            errorMessage = error.message;
        }
    });
</script>

<svelte:head>
    <title>Mapa Geoespacial - eSports Growth</title>
</svelte:head>

<div class="map-page-wrapper">
    <div class="map-header">
        <h1>🌍 Mapa Geoespacial: eSports Growth</h1>
        <p class="subtitle">Visualización de jugadores y espectadores por país</p>
        
        <div class="nav-links">
            <a href="/analytics/esportsgrowth-stats" class="link-btn">📊 Volver a la Gráfica</a>
            <a href="/analytics/esportsgrowth-stats/map" class="link-btn active">📈 David - Esports Growth Map</a>
            <a href="/analytics/esportsearnings-stats/map" class="link-btn">💰 Mario - Esports Earnings Map</a>
            <a href="/analytics/olympics-athlete-events/map" class="link-btn">🏅 Gonzalo - Olympics Map</a>
            <a href="/analytics/cheaters-stats/map" class="link-btn">🗺️ Francisco - Cheaters Map</a>
        </div>
    </div>
    
    <div class="map-wrapper">
        {#if errorMessage}
            <div class="error">
                <p>❌ Error: {errorMessage}</p>
            </div>
        {:else}
            <div bind:this={mapContainer} style="height: 500px; width: 100%;"></div>
        {/if}
    </div>
    
    <div class="info">
        <h3>📖 Interpretación del Mapa</h3>
        <div class="info-content">
            <div class="info-text">
                <p>Este mapa muestra la distribución geográfica del crecimiento de los eSports a nivel mundial.</p>
                <ul>
                    <li><strong>💜 Color de los países:</strong> La intensidad del color morado es proporcional a la cantidad de jugadores activos (en millones) de cada país. Cuanto más oscuro, más jugadores.</li>
                    <li><strong>💬 Tooltips interactivos:</strong> Pasa el ratón sobre los países coloreados para ver el desglose exacto de millones de jugadores y espectadores.</li>
                    <li><strong>🔍 Navegación:</strong> Puedes usar los botones de zoom (+ / -) en la esquina inferior izquierda.</li>
                </ul>
            </div>
            <div class="info-stats">
                <h4>📈 Datos clave</h4>
                <p><strong>🔝 Países principales:</strong> China, Estados Unidos, Corea del Sur y Japón.</p>
                <p><strong>🌍 Tecnología:</strong> Highcharts Maps (Highmaps)</p>
            </div>
        </div>
    </div>
</div>

<style>
    .map-page-wrapper { max-width: 1400px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(147, 51, 234, 0.2); border: 1px solid #e9d5ff; position: relative; min-height: 700px; font-family: sans-serif; }
    .map-header { margin-bottom: 1.5rem; }
    h1 { color: #7e22ce; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #666; margin-bottom: 2rem; }
    .nav-links { display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
    .link-btn { background: #faf5ff; color: #7e22ce; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; font-weight: 500; border: 1px solid #e9d5ff; transition: all 0.2s; }
    .link-btn:hover { background: #a855f7; color: white; transform: translateY(-2px); }
    .link-btn.active { background: #a855f7; color: white; border-color: #a855f7; }
    .map-wrapper { border-radius: 12px; overflow: hidden; border: 1px solid #e9d5ff; margin-bottom: 2rem; background: #f8fafc; }
    
    .error { text-align: center; padding: 2rem; margin: 1rem; color: #dc2626; background: #fee2e2; border-radius: 8px; font-weight: bold; }
    
    .info { padding: 1.5rem; background: #faf5ff; border-radius: 12px; border: 1px solid #e9d5ff; }
    .info h3 { color: #7e22ce; margin-top: 0; margin-bottom: 1rem; text-align: center; }
    .info-content { display: flex; flex-wrap: wrap; gap: 2rem; justify-content: space-between; }
    .info-text { flex: 2; min-width: 250px; }
    .info-stats { flex: 1; min-width: 200px; background: white; padding: 1rem; border-radius: 8px; border: 1px solid #e9d5ff; }
    .info-stats h4 { color: #7e22ce; margin-top: 0; margin-bottom: 1rem; text-align: center; }
    .info-stats p { margin: 0.5rem 0; font-size: 0.9rem; }
    .info ul { margin: 0.5rem 0; padding-left: 1.5rem; }
    .info li { margin: 0.5rem 0; color: #333; line-height: 1.5; }
    
    @media (max-width: 768px) {
        .map-page-wrapper { padding: 1rem; }
        .info-content { flex-direction: column; gap: 1rem; }
    }
</style>