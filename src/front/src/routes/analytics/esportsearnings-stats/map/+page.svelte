<script>
    import { onMount } from 'svelte';
    import 'leaflet/dist/leaflet.css';
    
    let error = null;
    let map = null;
    let loading = true;

    onMount(async () => {
        await initMap();
    });

    async function initMap() {
        try {
            // 1. Cargar Leaflet dinámicamente para evitar errores en SvelteKit
            const L = (await import('leaflet')).default;
            
            // Solucionar problema típico de iconos de Leaflet
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            });

            // 2. Cargar los datos de TU API
            const res = await fetch('/api/v1/esportsearnings-stats');
            if (!res.ok) throw new Error(`Error al conectar con la API: ${res.status}`);
            
            let apiData = await res.json();
            
            // 3. Diccionario de coordenadas para mapear los países al mapa
            const countryCoordinates = {
                'USA': { lat: 38.8951, lon: -77.0364, name: 'Estados Unidos' },
                'United States': { lat: 38.8951, lon: -77.0364, name: 'Estados Unidos' },
                'China': { lat: 39.9042, lon: 116.4074, name: 'China' },
                'South Korea': { lat: 35.9078, lon: 127.7669, name: 'Corea del Sur' },
                'Korea': { lat: 35.9078, lon: 127.7669, name: 'Corea del Sur' },
                'Spain': { lat: 40.4168, lon: -3.7038, name: 'España' },
                'Brazil': { lat: -15.8267, lon: -47.9218, name: 'Brasil' },
                'France': { lat: 48.8566, lon: 2.3522, name: 'Francia' },
                'Germany': { lat: 52.5200, lon: 13.4050, name: 'Alemania' },
                'Japan': { lat: 35.6762, lon: 139.6503, name: 'Japón' },
                'UK': { lat: 51.5074, lon: -0.1278, name: 'Reino Unido' },
                'United Kingdom': { lat: 51.5074, lon: -0.1278, name: 'Reino Unido' },
                'Russia': { lat: 55.7558, lon: 37.6173, name: 'Rusia' },
                'Sweden': { lat: 60.1282, lon: 18.6435, name: 'Suecia' },
                'Canada': { lat: 45.4215, lon: -75.6972, name: 'Canadá' }
            };

            // 4. Sumar ganancias y torneos por país
            const countryStats = {};
            apiData.forEach(item => {
                const country = item.country;
                if (country && countryCoordinates[country]) {
                    if (!countryStats[country]) {
                        countryStats[country] = { earnings: 0, tournaments: 0 };
                    }
                    countryStats[country].earnings += item.earnings || 0;
                    countryStats[country].tournaments += item.tournaments || 0;
                }
            });

            // 5. Inicializar el mapa (centrado en el mapa mundi)
            map = L.map('map-container').setView([25, 0], 2);

            // Usamos un mapa oscuro (Dark Matter) para que resalte y sea distinto al de Francisco
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; CartoDB',
                subdomains: 'abcd',
                maxZoom: 19,
                minZoom: 2
            }).addTo(map);
            
            // 6. Añadir los marcadores
            Object.entries(countryStats).forEach(([country, stats]) => {
                const coords = countryCoordinates[country];
                if (coords) {
                    // Calculamos el radio en base a las ganancias
                    let radius = 10;
                    if (stats.earnings > 500) radius = 35;
                    else if (stats.earnings > 100) radius = 25;
                    else if (stats.earnings > 50) radius = 18;
                    else if (stats.earnings > 10) radius = 14;
                    
                    L.circleMarker([coords.lat, coords.lon], {
                        radius: radius,
                        fillColor: '#10b981', // Verde billete
                        color: '#fbbf24', // Borde dorado
                        weight: 3,
                        opacity: 1,
                        fillOpacity: 0.6
                    })
                    .bindTooltip(`
                        <b>${coords.name}</b><br/>
                        💰 Ganancias: $${stats.earnings.toFixed(1)} M<br/>
                        🏆 Torneos: ${stats.tournaments}
                    `, { sticky: true })
                    .bindPopup(`
                        <div style="text-align: center; min-width: 180px;">
                            <h3 style="color: #059669; margin: 0 0 10px 0;">${coords.name}</h3>
                            <hr style="border-color: #d1fae5; margin: 5px 0;">
                            <p style="font-size: 16px;"><strong>💰 $${stats.earnings.toFixed(1)} Millones</strong></p>
                            <p><strong>🏆 ${stats.tournaments} Torneos</strong> disputados</p>
                        </div>
                    `)
                    .addTo(map);
                }
            });
            
            // Ajustar el mapa al quitar el loading
            setTimeout(() => {
                if (map) map.invalidateSize();
                loading = false;
            }, 500);
            
        } catch (e) {
            console.error('Error:', e);
            error = e.message;
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>Mapa Geoespacial - eSports Earnings</title>
</svelte:head>

<div class="map-page-wrapper">
    <div class="map-header">
        <h1>🌍 Mapa Geoespacial: Ingresos en eSports</h1>
        <p class="subtitle">Distribución global de ganancias (Earnings) y torneos celebrados</p>
        
        <div class="nav-links">
            <a href="/analytics/esportsearnings-stats" class="link-btn return-btn">📊 Volver a la Gráfica de Mario</a>
            <a href="/analytics/esportsgrowth-stats/map" class="link-btn">📈 David - Growth Map</a>
            <a href="/analytics/esportsearnings-stats/map" class="link-btn active">💰 Mario - Earnings Map</a>
            <a href="/analytics/olympics-athlete-events/map" class="link-btn">🏅 Gonzalo - Olympics Map</a>
            <a href="/analytics/cheaters-stats/map" class="link-btn">🗺️ Francisco - Cheaters Map</a>
        </div>
    </div>
    
    <div class="map-wrapper">
        <div id="map-container"></div>
        
        {#if loading}
            <div class="loading-overlay">
                <div class="spinner"></div>
                <p>Cargando mapa global de ganancias...</p>
            </div>
        {/if}
        
        {#if error}
            <div class="error-overlay">
                <p>❌ Error: {error}</p>
                <button onclick={() => window.location.reload()}>Reintentar</button>
            </div>
        {/if}
    </div>
    
    <div class="info-footer">
        <div class="info-text">
            <h3>📖 Interpretación del Mapa</h3>
            <ul>
                <li><strong>Estilo de Mapa:</strong> Dark Mode (CartoDB Dark Matter) para resaltar los datos financieros.</li>
                <li><strong>🟢 Burbujas Verdes:</strong> El tamaño representa el volumen total de dinero ganado en eSports.</li>
                <li><strong>🟡 Borde Dorado:</strong> Representa el prestigio de los torneos.</li>
                <li><strong>Interacción:</strong> Pasa el ratón (Hover) para un resumen rápido o haz <strong>clic</strong> para ver los detalles exactos.</li>
            </ul>
        </div>
        <div class="info-stats">
            <h4>📈 Datos Clave</h4>
            <p><strong>Variables:</strong> Earnings (M$) y Tournaments.</p>
            <p><strong>API:</strong> <code>/api/v1/esportsearnings-stats</code></p>
        </div>
    </div>
</div>

<style>
    .map-page-wrapper {
        max-width: 1400px;
        margin: 2rem auto;
        padding: 2rem;
        background: #f8fafc;
        border-radius: 16px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .map-header { margin-bottom: 2rem; }
    h1 { color: #064e3b; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #475569; margin-bottom: 2rem; }
    
    .nav-links {
        display: flex;
        justify-content: center;
        gap: 1rem;
        flex-wrap: wrap;
        margin-bottom: 1rem;
    }
    
    .link-btn {
        background: #f1f5f9;
        color: #334155;
        padding: 0.6rem 1.2rem;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 500;
        border: 1px solid #cbd5e1;
        transition: all 0.2s;
    }
    
    .link-btn:hover { background: #e2e8f0; transform: translateY(-2px); }
    
    .link-btn.return-btn { background: #10b981; color: white; border-color: #059669; }
    .link-btn.return-btn:hover { background: #059669; }
    
    .link-btn.active {
        background: #064e3b;
        color: white;
        border-color: #064e3b;
        font-weight: bold;
    }
    
    .map-wrapper {
        position: relative;
        border-radius: 12px;
        overflow: hidden;
        border: 2px solid #10b981;
        margin-bottom: 2rem;
        box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);
    }
    
    #map-container {
        height: 600px;
        width: 100%;
        background: #1a1a1a;
        z-index: 1;
    }
    
    .loading-overlay, .error-overlay {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(15, 23, 42, 0.9);
        color: white;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 100;
    }
    
    .spinner {
        border: 4px solid #334155;
        border-top: 4px solid #10b981;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
    }
    
    @keyframes spin { 100% { transform: rotate(360deg); } }
    
    .error-overlay button {
        margin-top: 1rem;
        background: #ef4444;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
    }
    
    .info-footer {
        display: flex;
        gap: 2rem;
        padding: 1.5rem;
        background: #ecfdf5;
        border-radius: 12px;
        border-left: 5px solid #10b981;
    }
    
    .info-text { flex: 2; }
    .info-stats {
        flex: 1;
        background: white;
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid #d1fae5;
    }
    
    .info-footer h3, .info-stats h4 { color: #064e3b; margin-top: 0; }
    .info-footer ul { padding-left: 1.2rem; color: #334155; }
    .info-stats p { margin: 0.5rem 0; font-size: 0.95rem; color: #334155; }
    
    @media (max-width: 768px) {
        .info-footer { flex-direction: column; }
        #map-container { height: 450px; }
    }
</style>
