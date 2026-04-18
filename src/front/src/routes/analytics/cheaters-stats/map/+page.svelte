<script>
    import { onMount } from 'svelte';
    import 'leaflet/dist/leaflet.css';
    
    let error = null;
    let map = null;
    
    onMount(async () => {
        await initMap();
    });
    
    async function initMap() {
        try {
            // Ocultar el overlay inmediatamente después de que el mapa comienza a cargarse
            const overlay = document.querySelector('.loading-overlay');
            if (overlay) {
                setTimeout(() => {
                    overlay.style.display = 'none';
                }, 100);
            }
            
            // Cargar Leaflet dinámicamente
            const L = (await import('leaflet')).default;
            
            // Solucionar problema de iconos de Leaflet
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            });
            
            // Cargar datos de Cheaters Stats
            let res = await fetch('/api/v2/cheaters-stats?limit=500');
            
            if (res.status === 404) {
                res = await fetch('/api/v1/cheaters-stats?limit=500');
            }
            
            if (!res.ok) {
                throw new Error(`Error al cargar datos: ${res.status}`);
            }
            
            let data = await res.json();
            let cheaters = data.data || data || [];
            
            if (cheaters.length === 0) {
                await fetch('/api/v2/cheaters-stats/loadInitialData');
                res = await fetch('/api/v2/cheaters-stats?limit=500');
                let newData = await res.json();
                cheaters = newData.data || newData || [];
            }
            
            console.log('Cheaters cargados para mapa:', cheaters.length);
            
            // Mapeo de países a coordenadas
            const countryCoordinates = {
                'Spain': { lat: 40.4168, lon: -3.7038, name: 'España' },
                'Brazil': { lat: -15.8267, lon: -47.9218, name: 'Brasil' },
                'Mexico': { lat: 19.4326, lon: -99.1332, name: 'México' },
                'Colombia': { lat: 4.7110, lon: -74.0721, name: 'Colombia' },
                'Peru': { lat: -12.0464, lon: -77.0428, name: 'Perú' },
                'Chile': { lat: -33.4489, lon: -70.6693, name: 'Chile' },
                'Uruguay': { lat: -34.9011, lon: -56.1645, name: 'Uruguay' },
                'Argentina': { lat: -34.6037, lon: -58.3816, name: 'Argentina' },
                'USA': { lat: 38.8951, lon: -77.0364, name: 'Estados Unidos' },
                'Canada': { lat: 45.4215, lon: -75.6972, name: 'Canadá' },
                'UK': { lat: 51.5074, lon: -0.1278, name: 'Reino Unido' },
                'Germany': { lat: 52.5200, lon: 13.4050, name: 'Alemania' },
                'France': { lat: 48.8566, lon: 2.3522, name: 'Francia' },
                'Italy': { lat: 41.9028, lon: 12.4964, name: 'Italia' },
                'Japan': { lat: 35.6762, lon: 139.6503, name: 'Japón' },
                'China': { lat: 39.9042, lon: 116.4074, name: 'China' },
                'India': { lat: 28.6139, lon: 77.2090, name: 'India' },
                'Australia': { lat: -33.8688, lon: 151.2093, name: 'Australia' },
                'Russia': { lat: 55.7558, lon: 37.6173, name: 'Rusia' }
            };
            
            // Agrupar datos por país
            const countryStats = {};
            
            cheaters.forEach(item => {
                const country = item.country;
                if (country && countryCoordinates[country]) {
                    if (!countryStats[country]) {
                        countryStats[country] = {
                            cheater_reports: 0,
                            confirmed_bans: 0,
                            estimated_cheater: 0,
                            count: 0
                        };
                    }
                    countryStats[country].cheater_reports += item.cheater_report || 0;
                    countryStats[country].confirmed_bans += item.confirmed_ban || 0;
                    countryStats[country].estimated_cheater += item.estimated_cheater || 0;
                    countryStats[country].count++;
                }
            });
            
            // Inicializar el mapa
            map = L.map('map-container').setView([20, 0], 2);
            
            // Añadir capa de mapa base
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CartoDB',
                subdomains: 'abcd',
                maxZoom: 19,
                minZoom: 1
            }).addTo(map);
            
            // Añadir marcadores
            Object.entries(countryStats).forEach(([country, stats]) => {
                const coords = countryCoordinates[country];
                if (coords) {
                    const reportes = stats.cheater_reports;
                    let radius = 15;
                    if (reportes > 5000) radius = 40;
                    else if (reportes > 2000) radius = 30;
                    else if (reportes > 1000) radius = 25;
                    else if (reportes > 500) radius = 20;
                    else radius = 15;
                    
                    L.circleMarker([coords.lat, coords.lon], {
                        radius: radius,
                        fillColor: '#dc2626',
                        color: '#7e22ce',
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.7
                    })
                    .bindTooltip(`
                        <b>${coords.name}</b><br/>
                        📊 Reportes: ${stats.cheater_reports.toLocaleString()}<br/>
                        🔨 Baneos: ${stats.confirmed_bans.toLocaleString()}<br/>
                        📈 % Estimado: ${(stats.estimated_cheater / stats.count).toFixed(2)}%
                    `, { sticky: true })
                    .bindPopup(`
                        <div style="text-align: center; min-width: 200px;">
                            <h3 style="color: #7e22ce; margin: 0 0 10px 0;">${coords.name}</h3>
                            <hr style="margin: 5px 0;">
                            <p><strong>📊 Reportes:</strong> ${stats.cheater_reports.toLocaleString()}</p>
                            <p><strong>🔨 Baneos:</strong> ${stats.confirmed_bans.toLocaleString()}</p>
                            <p><strong>📈 % Estimado:</strong> ${(stats.estimated_cheater / stats.count).toFixed(2)}%</p>
                        </div>
                    `)
                    .addTo(map);
                }
            });
            
            // Actualizar tamaño del mapa
            setTimeout(() => {
                if (map) {
                    map.invalidateSize();
                }
                // Ocultar overlay con DOM directo
                if (overlay) {
                    overlay.style.display = 'none';
                }
            }, 500);
            
        } catch (e) {
            console.error('Error:', e);
            error = e.message;
            const overlay = document.querySelector('.loading-overlay');
            if (overlay) {
                overlay.style.display = 'none';
            }
        }
    }
</script>

<div class="map-container">
    <div class="map-header">
        <h1>🌍 Mapa Geoespacial: Estadísticas de Tramposos</h1>
        <p class="subtitle">Visualización geolocalizada de reportes y baneos por país</p>
        
        <div class="nav-links">
            <a href="/analytics/cheaters-stats" class="link-btn">📊 Volver a Gráfico de Tarta</a>
            <a href="/analytics/easportsgrowth-stats/map" class="link-btn">📈 David - Esports Growth Map</a>
            <a href="/analytics/esportsearnings-stats/map" class="link-btn">💰 Mario - Esports Earnings Map</a>
            <a href="/analytics/olympics-athlete-events/map" class="link-btn">🏅 Gonzalo - Olympics Map</a>
            <a href="/analytics/cheaters-stats/map" class="link-btn active">🗺️ Francisco - Cheaters Map</a>
        </div>
    </div>
    
    <div class="map-wrapper">
        <div id="map-container"></div>
    </div>
    
    <!-- Overlay de carga - se ocultará directamente con DOM -->
    <div class="loading-overlay">
        <div class="spinner"></div>
        <p>Cargando mapa geoespacial de Cheaters Stats...</p>
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
                <p>Este mapa muestra la distribución geográfica de los reportes de tramposos en videojuegos a nivel mundial.</p>
                <ul>
                    <li><strong>🔴 Círculos rojos:</strong> El tamaño del círculo es proporcional a la cantidad de reportes de tramposos en cada país.</li>
                    <li><strong>💜 Borde morado:</strong> Representa la intensidad de baneos confirmados.</li>
                    <li><strong>📊 Números:</strong> La cifra sobre cada círculo indica el número total de reportes.</li>
                    <li><strong>💬 Tooltips:</strong> Pasa el ratón sobre cualquier círculo para ver datos básicos.</li>
                    <li><strong>📋 Popups:</strong> Haz clic en los círculos para ver información detallada.</li>
                </ul>
            </div>
            <div class="info-stats">
                <h4>📈 Datos clave</h4>
                <p><strong>🔝 Países con más reportes:</strong> Brasil, Chile, Colombia</p>
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
    
    #map-container {
        height: 500px;
        width: 100%;
        background: #f0f0f0;
        z-index: 1;
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
        
        #map-container {
            height: 400px;
        }
        
        .info-content {
            flex-direction: column;
            gap: 1rem;
        }
    }
</style>