<script>
    import { onMount, onDestroy } from 'svelte';
    
    let error = $state(null);
    let mapElement; // Referencia directa al contenedor (mejor que usar IDs)
    let map = null;
    
    onMount(async () => {
        await initMap();
    });

    // Limpiamos el mapa de la memoria cuando cambies de página
    onDestroy(() => {
        if (map) {
            map.remove();
        }
    });
    
    async function initMap() {
        try {
            const overlay = document.querySelector('.loading-overlay');
            if (overlay) {
                setTimeout(() => {
                    overlay.style.display = 'none';
                }, 100);
            }
            
            // Cargamos Leaflet dinámicamente
            const L = (await import('leaflet')).default;
            
            // Arreglamos los iconos
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            });
            
            // Petición a TU API
            const res = await fetch('/api/v1/esportsgrowth-stats');
            
            if (!res.ok) {
                throw new Error(`Error al cargar datos de la API: ${res.status}`);
            }
            
            let data = await res.json();
            let esportsData = Array.isArray(data) ? data : [];
            
            // Coordenadas
            const countryCoordinates = {
                'Spain': { lat: 40.4168, lon: -3.7038, name: 'España' },
                'United States': { lat: 38.8951, lon: -77.0364, name: 'Estados Unidos' },
                'USA': { lat: 38.8951, lon: -77.0364, name: 'Estados Unidos' },
                'China': { lat: 39.9042, lon: 116.4074, name: 'China' },
                'Japan': { lat: 35.6762, lon: 139.6503, name: 'Japón' },
                'South Korea': { lat: 37.5665, lon: 126.9780, name: 'Corea del Sur' },
                'Brazil': { lat: -15.8267, lon: -47.9218, name: 'Brasil' },
                'Germany': { lat: 52.5200, lon: 13.4050, name: 'Alemania' },
                'France': { lat: 48.8566, lon: 2.3522, name: 'Francia' }
            };
            
            const countryStats = {};
            
            // Agrupar datos
            esportsData.forEach(item => {
                const country = item.country;
                if (country && countryCoordinates[country]) {
                    if (!countryStats[country]) {
                        countryStats[country] = {
                            players: 0,
                            viewers: 0,
                            count: 0
                        };
                    }
                    countryStats[country].players += item.active_player_no || 0;
                    countryStats[country].viewers += item.viewership || 0;
                    countryStats[country].count++;
                }
            });
            
            // Inicializar mapa de forma segura usando bind:this
            if (!mapElement) return;
            map = L.map(mapElement).setView(, 2);
            
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CartoDB',
                subdomains: 'abcd',
                maxZoom: 19,
                minZoom: 1
            }).addTo(map);
            
            // Pintar círculos
            Object.entries(countryStats).forEach(([country, stats]) => {
                const coords = countryCoordinates[country];
                if (coords) {
                    const players = stats.players;
                    let radius = 15;
                    
                    if (players > 200) radius = 40;
                    else if (players > 100) radius = 30;
                    else if (players > 50) radius = 25;
                    else if (players > 20) radius = 20;
                    else radius = 15;
                    
                    L.circleMarker([coords.lat, coords.lon], {
                        radius: radius,
                        fillColor: '#a855f7',
                        color: '#7e22ce',
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.7
                    })
                    .bindTooltip(`
                        <b>${coords.name}</b><br/>
                        🎮 Jugadores: ${stats.players.toFixed(1)} M<br/>
                        👀 Espectadores: ${stats.viewers.toFixed(1)} M
                    `, { sticky: true })
                    .bindPopup(`
                        <div style="text-align: center; min-width: 200px;">
                            <h3 style="color: #7e22ce; margin: 0 0 10px 0;">${coords.name}</h3>
                            <hr style="margin: 5px 0;">
                            <p><strong>🎮 Jugadores:</strong> ${stats.players.toFixed(1)} M</p>
                            <p><strong>👀 Espectadores:</strong> ${stats.viewers.toFixed(1)} M</p>
                            <p><strong>📊 Registros:</strong> ${stats.count}</p>
                        </div>
                    `)
                    .addTo(map);
                }
            });
            
            setTimeout(() => {
                if (map) {
                    map.invalidateSize();
                }
            }, 500);
            
        } catch (e) {
            error = e.message;
            const overlay = document.querySelector('.loading-overlay');
            if (overlay) {
                overlay.style.display = 'none';
            }
        }
    }
</script>

<svelte:head>
    <title>Mapa Geoespacial - eSports Growth</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>
</svelte:head>

<div class="map-container">
    <div class="map-header">
        <h1>🌍 Mapa Geoespacial: eSports Growth</h1>
        <p class="subtitle">Visualización geolocalizada de jugadores y espectadores</p>
        
        <div class="nav-links">
            <a href="/analytics/esportsgrowth-stats" class="link-btn">📊 Volver a la Gráfica</a>
            <a href="/analytics/esportsgrowth-stats/map" class="link-btn active">📈 David - Esports Growth Map</a>
            <a href="/analytics/esportsearnings-stats/map" class="link-btn">💰 Mario - Esports Earnings Map</a>
            <a href="/analytics/olympics-athlete-events/map" class="link-btn">🏅 Gonzalo - Olympics Map</a>
            <a href="/analytics/cheaters-stats/map" class="link-btn">🗺️ Francisco - Cheaters Map</a>
        </div>
    </div>
    
    <div class="map-wrapper">
        <div bind:this={mapElement} style="height: 500px; width: 100%; z-index: 1; background: #f0f0f0;"></div>
    </div>
    
    <div class="loading-overlay">
        <div class="spinner"></div>
        <p>Cargando mapa geoespacial de eSports...</p>
    </div>
    
    {#if error}
        <div class="error">
            <p>❌ Error: {error}</p>
            <button onclick={() => window.location.reload()}>Reintentar</button>
        </div>
    {/if}
    
    <div class="info">
        <h3>📖 Interpretación del Mapa</h3>
        <div class="info-content">
            <div class="info-text">
                <p>Este mapa muestra la distribución geográfica del crecimiento de los eSports a nivel mundial.</p>
                <ul>
                    <li><strong>🟣 Círculos morados:</strong> El tamaño del círculo es proporcional a la cantidad de jugadores activos en cada país.</li>
                    <li><strong>💬 Tooltips:</strong> Pasa el ratón sobre cualquier círculo para ver datos básicos.</li>
                    <li><strong>📋 Popups:</strong> Haz clic en los círculos para ver información detallada.</li>
                </ul>
            </div>
            <div class="info-stats">
                <h4>📈 Datos clave</h4>
                <p><strong>🔝 Países con más jugadores:</strong> China, Estados Unidos, Corea del Sur</p>
                <p><strong>🌍 Cobertura:</strong> América, Europa y Asia</p>
            </div>
        </div>
    </div>
</div>

<style>
    .map-container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 2rem;
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 25px -5px rgba(147, 51, 234, 0.2);
        border: 1px solid #e9d5ff;
        position: relative;
        min-height: 700px;
        font-family: sans-serif;
    }
    
    .map-header {
        margin-bottom: 1.5rem;
    }
    
    h1 {
        color: #7e22ce;
        text-align: center;
        margin-bottom: 0.5rem;
    }
    
    .subtitle {
        text-align: center;
        color: #666;
        margin-bottom: 2rem;
    }
    
    .nav-links {
        display: flex;
        justify-content: center;
        gap: 1rem;
        flex-wrap: wrap;
        margin-bottom: 1rem;
    }
    
    .link-btn {
        background: #faf5ff;
        color: #7e22ce;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 500;
        border: 1px solid #e9d5ff;
        transition: all 0.2s;
    }
    
    .link-btn:hover {
        background: #a855f7;
        color: white;
        transform: translateY(-2px);
    }
    
    .link-btn.active {
        background: #a855f7;
        color: white;
        border-color: #a855f7;
    }
    
    .map-wrapper {
        position: relative;
        z-index: 1;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid #e9d5ff;
        margin-bottom: 2rem;
    }
    
    .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.95);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        border-radius: 16px;
        z-index: 100;
    }
    
    .spinner {
        border: 4px solid #e9d5ff;
        border-top: 4px solid #a855f7;
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
        color: #dc2626;
        background: #fee2e2;
        border-radius: 8px;
    }
    
    .error button {
        margin-top: 1rem;
        background: #dc2626;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
    }
    
    .info {
        margin-top: 2rem;
        padding: 1.5rem;
        background: #faf5ff;
        border-radius: 12px;
        border: 1px solid #e9d5ff;
        position: relative;
        z-index: 2;
        clear: both;
    }
    
    .info h3 {
        color: #7e22ce;
        margin-top: 0;
        margin-bottom: 1rem;
        text-align: center;
    }
    
    .info-content {
        display: flex;
        flex-wrap: wrap;
        gap: 2rem;
        justify-content: space-between;
    }
    
    .info-text {
        flex: 2;
        min-width: 250px;
    }
    
    .info-stats {
        flex: 1;
        min-width: 200px;
        background: white;
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid #e9d5ff;
    }
    
    .info-stats h4 {
        color: #7e22ce;
        margin-top: 0;
        margin-bottom: 1rem;
        text-align: center;
    }
    
    .info-stats p {
        margin: 0.5rem 0;
        font-size: 0.9rem;
    }
    
    .info ul {
        margin: 0.5rem 0;
        padding-left: 1.5rem;
    }
    
    .info li {
        margin: 0.5rem 0;
        color: #333;
    }
    
    :global(.leaflet-container) {
        z-index: 1;
    }
    
    :global(.leaflet-popup-content) {
        font-size: 14px;
        line-height: 1.4;
        min-width: 220px;
    }
    
    :global(.leaflet-popup-content h3) {
        color: #7e22ce;
        margin-top: 0;
    }
    
    @media (max-width: 768px) {
        .map-container {
            padding: 1rem;
        }
        
        .info-content {
            flex-direction: column;
            gap: 1rem;
        }
    }
</style>