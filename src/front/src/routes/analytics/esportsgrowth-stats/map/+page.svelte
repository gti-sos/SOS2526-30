<script>
    import { onMount } from 'svelte';
    import * as d3 from 'd3';
    // @ts-ignore
    import * as topojson from 'topojson';
    
    let loading = $state(true);
    let error = $state(null);
    let selectedCountry = $state(null);
    // @ts-ignore
    let statsList = $state([]);
    let showStats = $state(false);
    
    // @ts-ignore
    let width = 1000;
    let height = 500;
    let svg;
    // @ts-ignore
    let tooltip;
    
    onMount(async () => {
        await initMap();
    });
    
    async function initMap() {
        try {
            // 1. Obtener datos de TU API de eSports
            const res = await fetch('/api/v1/esportsgrowth-stats');
            if (!res.ok) throw new Error('Error al cargar la API');
            const data = await res.json();
            const stats = Array.isArray(data) ? data : [];
            
            // 2. Agrupar por país y sumar jugadores
            const countries = {};
            // @ts-ignore
            stats.forEach(stat => {
                if (stat.country) {
                    // @ts-ignore
                    if (!countries[stat.country]) {
                        // @ts-ignore
                        countries[stat.country] = {
                            totalPlayers: 0,
                            totalViewers: 0,
                            records: []
                        };
                    }
                    // @ts-ignore
                    countries[stat.country].totalPlayers += (stat.active_player_no || 0);
                    // @ts-ignore
                    countries[stat.country].totalViewers += (stat.viewership || 0);
                    // @ts-ignore
                    countries[stat.country].records.push(stat);
                }
            });
            
            // 3. Coordenadas de tus países (hemos mapeado los tuyos)
            const countryCoords = {
                'United States': [-98.5795, 39.8283], 
                'China': [104.1954, 35.8617], 
                'Spain': [-3.7492, 40.4637],
                'Japan': [138.2529, 36.2048],
                'South Korea': [127.7669, 35.9078]
            };
            
            // Preparar datos para los marcadores
            const markers = Object.entries(countries)
                // @ts-ignore
                .filter(([name]) => countryCoords[name])
                .map(([name, data]) => ({
                    name: name,
                    // @ts-ignore
                    x: countryCoords[name],
                    // @ts-ignore
                    y: countryCoords[name],
                    totalPlayers: data.totalPlayers,
                    totalViewers: data.totalViewers,
                    records: data.records,
                    // El tamaño del círculo depende de los jugadores activos
                    radius: Math.min(15 + (data.totalPlayers / 5), 45)
                }));
            
            // Colores en tonos morados (adaptados a tu diseño original)
            // @ts-ignore
            const getColor = (players) => {
                if (players > 100) return '#7e22ce'; // Morado muy oscuro
                if (players > 50) return '#9333ea';  // Morado normal
                if (players > 20) return '#a855f7';  // Morado claro
                return '#d8b4fe';                    // Lila
            };
            
            // Crear SVG
            const container = document.getElementById('map');
            // @ts-ignore
            const containerWidth = container.clientWidth;
            
            svg = d3.select('#map')
                .append('svg')
                .attr('width', containerWidth)
                .attr('height', height)
                .attr('viewBox', `0 0 ${containerWidth} ${height}`)
                .style('background', '#0f172a')
                .style('border-radius', '12px');
            
            // Proyección geográfica
            const projection = d3.geoEquirectangular()
                .scale(containerWidth / (2 * Math.PI))
                .translate([containerWidth / 2, height / 2])
                .precision(0.1);
            
            const path = d3.geoPath(projection);
            
            // Cargar datos del mapa mundial
            const world = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json').then(r => r.json());
            // @ts-ignore
            const countriesGeo = topojson.feature(world, world.objects.countries);
            
            // Dibujar países
            svg.append('g')
                .selectAll('path')
                .data(countriesGeo.features)
                .enter()
                .append('path')
                .attr('d', path)
                .attr('fill', '#1e293b')
                .attr('stroke', '#334155')
                .attr('stroke-width', 0.5);
            
            // Tooltip interactivo
            tooltip = d3.select('#map')
                .append('div')
                .attr('class', 'tooltip')
                .style('position', 'absolute')
                .style('background', '#1e293b')
                .style('color', 'white')
                .style('padding', '8px 12px')
                .style('border-radius', '8px')
                .style('border', '1px solid #334155')
                .style('pointer-events', 'none')
                .style('opacity', '0')
                .style('z-index', '100');
            
            // Dibujar los círculos de tus países
            svg.selectAll('circle')
                .data(markers)
                .enter()
                .append('circle')
                // @ts-ignore
                .attr('cx', d => projection([d.x, d.y]))
                // @ts-ignore
                .attr('cy', d => projection([d.x, d.y]))
                .attr('r', d => d.radius)
                .attr('fill', d => getColor(d.totalPlayers))
                .attr('stroke', 'white')
                .attr('stroke-width', 2)
                .attr('opacity', 0.9)
                .attr('cursor', 'pointer')
                .on('mouseover', (event, d) => {
                    // @ts-ignore
                    tooltip.transition().duration(200).style('opacity', 0.9);
                    // @ts-ignore
                    tooltip.html(`
                        <strong style="color: #a855f7;">${d.name}</strong><br/>
                        🎮 Jugadores: ${d.totalPlayers.toFixed(1)} M<br/>
                        👀 Espectadores: ${d.totalViewers.toFixed(1)} M
                    `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
                })
                .on('mouseout', () => {
                    // @ts-ignore
                    tooltip.transition().duration(500).style('opacity', 0);
                })
                // @ts-ignore
                .on('click', (event, d) => {
                    // @ts-ignore
                    selectedCountry = d.name;
                    statsList = d.records;
                    showStats = true;
                });
            
            // Etiqueta de texto (mostrando suma de jugadores en vez de count)
            svg.selectAll('text')
                .data(markers)
                .enter()
                .append('text')
                // @ts-ignore
                .attr('x', d => projection([d.x, d.y]))
                // @ts-ignore
                .attr('y', d => projection([d.x, d.y]))
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .attr('fill', 'white')
                .attr('font-size', d => Math.max(10, d.radius / 2.5) + 'px')
                .attr('font-weight', 'bold')
                .attr('pointer-events', 'none')
                .text(d => Math.round(d.totalPlayers));
            
            loading = false;
            
        } catch (e) {
            console.error('Error:', e);
            // @ts-ignore
            error = e.message;
            loading = false;
        }
    }
    
    function closeStatsModal() {
        showStats = false;
        selectedCountry = null;
        statsList = [];
    }
</script>

<svelte:head>
    <title>Mapa Geoespacial - eSports</title>
</svelte:head>

<div class="map-container">
    <h1 style="color: #a855f7;">🌍 Mapa Mundial de eSports Growth</h1>
    <p class="subtitle" style="color: #94a3b8;">Haz clic en cualquier círculo para ver las estadísticas de cada año</p>
    
    <div style="display: flex; gap: 1rem; justify-content: center; margin-bottom: 1.5rem;">
        <a href="/analytics/esportsgrowth-stats" class="btn-nav btn-gray">Volver a la Gráfica</a>
        <a href="/esportsgrowth-stats" class="btn-nav btn-purple">Ir a la Tabla de Datos</a>
    </div>

    <div id="map" style="height: 500px; width: 100%; border-radius: 12px; position: relative;"></div>
    
    {#if loading}
        <div class="loading-overlay">
            <div class="spinner"></div>
            <p style="color: white;">Cargando mapa...</p>
        </div>
    {/if}
    
    {#if error}
        <div class="error">
            <p>❌ Error: {error}</p>
        </div>
    {/if}
    
    {#if showStats}
        <div class="modal dark-modal">
            <div class="modal-content dark-modal-content">
                <div class="modal-header dark-modal-header">
                    <h2 style="color: #a855f7; margin:0;">🎮 Estadísticas de {selectedCountry}</h2>
                    <button onclick={closeStatsModal} class="close-btn dark-close-btn">✗</button>
                </div>
                <div class="modal-body dark-modal-body">
                    <p><strong>Registros anuales encontrados:</strong> {statsList.length}</p>
                    <div class="athletes-grid">
                        {#each statsList as stat}
                            <div class="athlete-item dark-athlete-item">
                                <strong style="color: #a855f7;">Año {stat.year}</strong>
                                <div class="athlete-details" style="color: #94a3b8; margin-top: 5px;">
                                    <strong>Jugadores:</strong> {stat.active_player_no} M<br>
                                    <strong>Espectadores:</strong> {stat.viewership} M<br>
                                    <strong>Género Top:</strong> {stat.top_genre}
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    {/if}
    
    <div class="info dark-info">
        <h3 style="color: #a855f7; margin-top:0;">📖 Interpretación</h3>
        <ul style="color: #94a3b8;">
            <li><strong>Mapa base:</strong> Mapa mundial (D3 & TopoJSON)</li>
            <li><strong>Tamaño del círculo:</strong> Millones de jugadores activos totales</li>
            <li><strong>Color del círculo:</strong> Más oscuro cuantos más jugadores haya</li>
            <li><strong>Clic:</strong> Haz clic en el círculo para ver el desglose por año</li>
            <li><strong>Número:</strong> Suma total de millones de jugadores</li>
        </ul>
    </div>
</div>

<style>
    .map-container { max-width: 1200px; margin: 2rem auto; padding: 2rem; background: #0f172a; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3); position: relative; min-height: 600px; font-family: sans-serif; }
    h1 { text-align: center; margin-bottom: 0.5rem; margin-top: 0; }
    .subtitle { text-align: center; margin-bottom: 1.5rem; }
    
    .btn-nav { text-decoration: none; padding: 0.6rem 1.2rem; border-radius: 6px; font-weight: bold; color: white; transition: 0.2s; }
    .btn-gray { background: #475569; } .btn-gray:hover { background: #334155; }
    .btn-purple { background: #9333ea; } .btn-purple:hover { background: #7e22ce; }

    .loading-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.95); display: flex; flex-direction: column; justify-content: center; align-items: center; border-radius: 16px; z-index: 10; }
    .spinner { border: 4px solid #334155; border-top: 4px solid #a855f7; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    
    .error { text-align: center; padding: 2rem; margin-top: 1rem; color: #f87171; background: #1e293b; border-radius: 8px; }
    
    .dark-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .dark-modal-content { background: #1e293b; border-radius: 16px; max-width: 800px; width: 90%; max-height: 80vh; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); border: 1px solid #334155; }
    .dark-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid #334155; background: #0f172a; }
    .dark-close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: #94a3b8; } .dark-close-btn:hover { color: #f87171; }
    .dark-modal-body { padding: 1.5rem; overflow-y: auto; max-height: calc(80vh - 70px); color: #e2e8f0; }
    
    .dark-athlete-item { padding: 0.75rem; background: #0f172a; border-radius: 8px; border: 1px solid #334155; }
    .athletes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem; margin-top: 1rem; }
    
    .dark-info { margin-top: 2rem; padding: 1rem; background: #1e293b; border-radius: 12px; border: 1px solid #334155; }
</style>