<script>
    import { onMount } from 'svelte';
    import * as d3 from 'd3';
    // @ts-ignore
    import * as topojson from 'topojson';
    
    let loading = $state(true);
    let error = $state(null);
    let selectedCountry = $state(null);
    // @ts-ignore
    let athletesList = $state([]);
    let showAthletes = $state(false);
    
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
            // Obtener datos de atletas
            const res = await fetch('/api/v2/olympics-athlete-events?limit=1000&t=' + Date.now());
            const data = await res.json();
            const athletes = data.data || [];
            
            // Agrupar por país
            const countries = {};
            // @ts-ignore
            athletes.forEach(athlete => {
                if (athlete.team && athlete.team !== 'NA') {
                    // @ts-ignore
                    if (!countries[athlete.team]) {
                        // @ts-ignore
                        countries[athlete.team] = {
                            count: 0,
                            medals: { Gold: 0, Silver: 0, Bronze: 0 },
                            athletes: []
                        };
                    }
                    // @ts-ignore
                    countries[athlete.team].count++;
                    // @ts-ignore
                    countries[athlete.team].athletes.push(athlete);
                    if (athlete.medal && athlete.medal !== 'NA') {
                        // @ts-ignore
                        countries[athlete.team].medals[athlete.medal]++;
                    }
                }
            });
            
            // Coordenadas por país
            const countryCoords = {
                'USA': [-98.5795, 39.8283], 'China': [104.1954, 35.8617], 'Spain': [-3.7492, 40.4637],
                'France': [2.2137, 46.2276], 'Germany': [10.4515, 51.1657], 'United Kingdom': [-3.436, 55.3781],
                'Italy': [12.5674, 41.8719], 'Australia': [133.7751, -25.2744], 'Japan': [138.2529, 36.2048],
                'Brazil': [-51.9253, -14.2350], 'Russia': [105.3188, 61.5240], 'Canada': [-106.3468, 56.1304],
                'Argentina': [-63.6167, -38.4161], 'Mexico': [-102.5528, 23.6345], 'India': [78.9629, 20.5937],
                'South Korea': [127.7669, 35.9078], 'Netherlands': [5.2913, 52.1326], 'Sweden': [18.6435, 60.1282],
                'Norway': [8.4689, 60.4720], 'Finland': [25.7482, 61.9241], 'Poland': [19.1451, 51.9194],
                'Ukraine': [31.1656, 48.3794], 'Romania': [24.9668, 45.9432], 'Hungary': [19.5033, 47.1625],
                'Belgium': [4.4699, 50.5039], 'Portugal': [-8.2245, 39.3999], 'Greece': [21.8243, 39.0742],
                'Turkey': [35.2433, 38.9637], 'Egypt': [30.8025, 26.8206], 'South Africa': [22.9375, -30.5595],
                'New Zealand': [174.8860, -40.9006], 'Cuba': [-77.7812, 21.5218], 'Kenya': [37.9062, -0.0236],
                'Jamaica': [-77.2975, 18.1096], 'Ethiopia': [40.4897, 9.1450], 'Iran': [53.6880, 32.4279]
            };
            
            // Preparar datos para marcadores
            const markers = Object.entries(countries)
                // @ts-ignore
                .filter(([name]) => countryCoords[name])
                .map(([name, data]) => ({
                    name: name,
                    // @ts-ignore
                    x: countryCoords[name][0],
                    // @ts-ignore
                    y: countryCoords[name][1],
                    count: data.count,
                    medals: data.medals,
                    athletes: data.athletes,
                    radius: Math.min(15 + data.count / 10, 40)
                }));
            
            // Colores según cantidad
            // @ts-ignore
            const getColor = (count) => {
                if (count > 100) return '#ef4444';
                if (count > 50) return '#f97316';
                if (count > 20) return '#22c55e';
                return '#3b82f6';
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
            
            // Proyección geográfica (equirectangular)
            const projection = d3.geoEquirectangular()
                .scale(containerWidth / (2 * Math.PI))
                .translate([containerWidth / 2, height / 2])
                .precision(0.1);
            
            // Generador de rutas geográficas
            const path = d3.geoPath(projection);
            
            // Cargar datos del mapa mundial (TopoJSON)
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
            
            // Tooltip
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
            
            // Dibujar marcadores
            svg.selectAll('circle')
                .data(markers)
                .enter()
                .append('circle')
                // @ts-ignore
                .attr('cx', d => projection([d.x, d.y])[0])
                // @ts-ignore
                .attr('cy', d => projection([d.x, d.y])[1])
                .attr('r', d => d.radius)
                .attr('fill', d => getColor(d.count))
                .attr('stroke', 'white')
                .attr('stroke-width', 2)
                .attr('opacity', 0.9)
                .attr('cursor', 'pointer')
                .on('mouseover', (event, d) => {
                    // @ts-ignore
                    tooltip.transition().duration(200).style('opacity', 0.9);
                    // @ts-ignore
                    tooltip.html(`
                        <strong style="color: #60a5fa;">${d.name}</strong><br/>
                        Atletas: ${d.count}<br/>
                        🥇 ${d.medals.Gold} | 🥈 ${d.medals.Silver} | 🥉 ${d.medals.Bronze}
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
                    athletesList = d.athletes;
                    showAthletes = true;
                });
            
            // Dibujar texto con número
            svg.selectAll('text')
                .data(markers)
                .enter()
                .append('text')
                // @ts-ignore
                .attr('x', d => projection([d.x, d.y])[0])
                // @ts-ignore
                .attr('y', d => projection([d.x, d.y])[1])
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .attr('fill', 'white')
                .attr('font-size', d => Math.max(10, d.radius / 2.5) + 'px')
                .attr('font-weight', 'bold')
                .attr('pointer-events', 'none')
                .text(d => d.count);
            
            loading = false;
            
        } catch (e) {
            console.error('Error:', e);
            // @ts-ignore
            error = e.message;
            loading = false;
        }
    }
    
    function closeAthletesModal() {
        showAthletes = false;
        selectedCountry = null;
        athletesList = [];
    }
</script>

<div class="map-container">
    <h1 style="color: #60a5fa;">🌍 Mapa Mundial de Atletas Olímpicos</h1>
    <p class="subtitle" style="color: #94a3b8;">Haz clic en cualquier círculo para ver los atletas de ese país</p>
    
    <div id="map" style="height: 500px; width: 100%; border-radius: 12px; position: relative;"></div>
    
    {#if loading}
        <div class="loading-overlay">
            <div class="spinner"></div>
            <p>Cargando mapa...</p>
        </div>
    {/if}
    
    {#if error}
        <div class="error">
            <p>❌ Error: {error}</p>
        </div>
    {/if}
    
    <!-- Modal para mostrar atletas -->
    {#if showAthletes}
        <div class="modal dark-modal">
            <div class="modal-content dark-modal-content">
                <div class="modal-header dark-modal-header">
                    <h2 style="color: #60a5fa;">🏅 Atletas de {selectedCountry}</h2>
                    <button onclick={closeAthletesModal} class="close-btn dark-close-btn">✗</button>
                </div>
                <div class="modal-body dark-modal-body">
                    <p><strong>Total de atletas:</strong> {athletesList.length}</p>
                    <div class="athletes-grid">
                        {#each athletesList as athlete}
                            <div class="athlete-item dark-athlete-item">
                                <strong style="color: #60a5fa;">{athlete.name}</strong>
                                <div class="athlete-details" style="color: #94a3b8;">
                                    {athlete.year} - {athlete.sport} - {athlete.event}
                                    {#if athlete.medal && athlete.medal !== 'NA'}
                                        <span class="medal">
                                            {athlete.medal === 'Gold' ? '🥇' : athlete.medal === 'Silver' ? '🥈' : '🥉'}
                                        </span>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    {/if}
    
    <div class="info dark-info">
        <h3 style="color: #60a5fa;">📖 Interpretación</h3>
        <ul style="color: #94a3b8;">
            <li><strong>Mapa base:</strong> Mapa mundial real con países</li>
            <li><strong>Tamaño del círculo:</strong> Número de atletas de ese país</li>
            <li><strong>Color del círculo:</strong> 🔴 >100 | 🟠 >50 | 🟢 >20 | 🔵 ≤20 atletas</li>
            <li><strong>Clic:</strong> Haz clic en el círculo para ver todos los atletas</li>
            <li><strong>Tooltip:</strong> Pasa el ratón sobre el círculo para ver un resumen</li>
        </ul>
    </div>
</div>

<style>
    .map-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
        background: #0f172a;
        border-radius: 16px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
        position: relative;
        min-height: 600px;
    }
    
    h1 {
        text-align: center;
        margin-bottom: 0.5rem;
    }
    
    .subtitle {
        text-align: center;
        margin-bottom: 2rem;
    }
    
    .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(15, 23, 42, 0.95);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        border-radius: 16px;
        z-index: 10;
    }
    
    .spinner {
        border: 4px solid #334155;
        border-top: 4px solid #60a5fa;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .error {
        text-align: center;
        padding: 2rem;
        margin-top: 1rem;
        color: #f87171;
        background: #1e293b;
        border-radius: 8px;
    }
    
    /* Modal Dark Mode */
    .dark-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
    
    .dark-modal-content {
        background: #1e293b;
        border-radius: 16px;
        max-width: 800px;
        width: 90%;
        max-height: 80vh;
        overflow: hidden;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
        border: 1px solid #334155;
    }
    
    .dark-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #334155;
        background: #0f172a;
    }
    
    .dark-close-btn {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #94a3b8;
    }
    
    .dark-close-btn:hover {
        color: #f87171;
    }
    
    .dark-modal-body {
        padding: 1.5rem;
        overflow-y: auto;
        max-height: calc(80vh - 70px);
        color: #e2e8f0;
    }
    
    .dark-athlete-item {
        padding: 0.75rem;
        background: #0f172a;
        border-radius: 8px;
        border: 1px solid #334155;
    }
    
    .athletes-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 0.75rem;
        margin-top: 1rem;
    }
    
    .dark-info {
        margin-top: 2rem;
        padding: 1rem;
        background: #1e293b;
        border-radius: 12px;
        border: 1px solid #334155;
    }
</style>