<script>
    import { onMount } from 'svelte';
    import maplibregl from 'maplibre-gl';
    import 'maplibre-gl/dist/maplibre-gl.css';
    
    let loading = $state(true);
    let error = $state(null);
    let map = null;
    let selectedCountry = $state(null);
    let athletesList = $state([]);
    let showAthletes = $state(false);
    
    onMount(async () => {
        setTimeout(() => {
            initMap();
        }, 200);
        
        return () => {
            if (map) {
                map.remove();
                map = null;
            }
        };
    });
    
    async function initMap() {
        try {
            const container = document.getElementById('map');
            if (!container) {
                throw new Error('Map container not found');
            }
            
            // Obtener datos de atletas
            const res = await fetch('/api/v2/olympics-athlete-events?limit=1000&t=' + Date.now());
            const data = await res.json();
            const athletes = data.data || [];
            
            // Agrupar por país
            const countries = {};
            athletes.forEach(athlete => {
                if (athlete.team && athlete.team !== 'NA') {
                    if (!countries[athlete.team]) {
                        countries[athlete.team] = {
                            count: 0,
                            medals: { Gold: 0, Silver: 0, Bronze: 0 },
                            athletes: []
                        };
                    }
                    countries[athlete.team].count++;
                    countries[athlete.team].athletes.push(athlete);
                    if (athlete.medal && athlete.medal !== 'NA') {
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
                'Jamaica': [-77.2975, 18.1096], 'Ethiopia': [40.4897, 9.1450], 'Iran': [53.6880, 32.4279],
                'Chile': [-71.5430, -35.6751], 'Colombia': [-74.2973, 4.5709], 'Peru': [-75.0152, -9.1900],
                'Venezuela': [-66.5897, 6.4238], 'Ecuador': [-78.1834, -1.8312], 'Uruguay': [-56.1645, -32.5228],
                'Paraguay': [-58.4438, -23.4425], 'Bolivia': [-63.5887, -16.2902], 'Costa Rica': [-83.7534, 9.7489],
                'Panama': [-80.7821, 8.5380], 'Dominican Republic': [-70.6667, 18.7357], 'Puerto Rico': [-66.5901, 18.2208],
                'Trinidad and Tobago': [-61.2225, 10.6918], 'Bahamas': [-77.3963, 25.0343], 'Barbados': [-59.5432, 13.1939]
            };
            
            // Inicializar mapa con estilo gratuito (sin API key)
            map = new maplibregl.Map({
                container: 'map',
                style: 'https://tiles.stadiamaps.com/styles/stamen_toner_lite.json', // Estilo oscuro gratuito
                center: [0, 20],
                zoom: 1.5,
                pitch: 45,
                bearing: 0,
                antialias: true
            });
            
            // Colores según cantidad de atletas
            const getColor = (count) => {
                if (count > 100) return '#ef4444';
                if (count > 50) return '#f97316';
                if (count > 20) return '#22c55e';
                return '#3b82f6';
            };
            
            map.on('load', () => {
                // Añadir marcadores 3D (círculos con altura)
                Object.entries(countries).forEach(([country, data]) => {
                    const coords = countryCoords[country];
                    if (!coords) return;
                    
                    const size = Math.min(20 + data.count / 5, 50);
                    const height = size * 2; // Altura 3D
                    const color = getColor(data.count);
                    
                    // Crear círculo 3D
                    map.addSource(`source-${country}`, {
                        type: 'geojson',
                        data: {
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: [coords[0], coords[1]]
                            },
                            properties: {
                                name: country,
                                count: data.count,
                                medals: data.medals,
                                athletes: data.athletes
                            }
                        }
                    });
                    
                    map.addLayer({
                        id: `circle-${country}`,
                        type: 'circle',
                        source: `source-${country}`,
                        paint: {
                            'circle-radius': size / 2,
                            'circle-color': color,
                            'circle-stroke-width': 2,
                            'circle-stroke-color': '#ffffff',
                            'circle-opacity': 0.9
                        }
                    });
                    
                    // Añadir texto con el número
                    map.addLayer({
                        id: `text-${country}`,
                        type: 'symbol',
                        source: `source-${country}`,
                        layout: {
                            'text-field': data.count.toString(),
                            'text-font': ['Open Sans Bold'],
                            'text-size': Math.max(10, size / 3),
                            'text-offset': [0, 0]
                        },
                        paint: {
                            'text-color': '#ffffff',
                            'text-halo-color': '#000000',
                            'text-halo-width': 1
                        }
                    });
                    
                    // Tooltip al pasar el ratón
                    const popup = new maplibregl.Popup({ offset: 25 })
                        .setHTML(`
                            <div style="min-width: 150px;">
                                <strong style="color: #60a5fa;">${country}</strong><br/>
                                Atletas: ${data.count}<br/>
                                🥇 ${data.medals.Gold} | 🥈 ${data.medals.Silver} | 🥉 ${data.medals.Bronze}
                            </div>
                        `);
                    
                    map.on('mouseenter', `circle-${country}`, () => {
                        map.getCanvas().style.cursor = 'pointer';
                        popup.setLngLat([coords[0], coords[1]]).addTo(map);
                    });
                    
                    map.on('mouseleave', `circle-${country}`, () => {
                        map.getCanvas().style.cursor = '';
                        popup.remove();
                    });
                    
                    // Clic para mostrar atletas
                    map.on('click', `circle-${country}`, () => {
                        selectedCountry = country;
                        athletesList = data.athletes;
                        showAthletes = true;
                    });
                });
                
                loading = false;
            });
            
        } catch (e) {
            console.error('Error:', e);
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
    <h1 style="color: #60a5fa;">🗺️ Mapa 3D de Atletas Olímpicos</h1>
    <p class="subtitle" style="color: #94a3b8;">Haz clic en cualquier círculo para ver los atletas de ese país</p>
    
    <div id="map" style="height: 600px; width: 100%; border-radius: 12px;"></div>
    
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
            <li><strong>Tamaño del círculo:</strong> Número de atletas de ese país</li>
            <li><strong>Color del círculo:</strong> 🔴 >100 | 🟠 >50 | 🟢 >20 | 🔵 ≤20 atletas</li>
            <li><strong>Clic:</strong> Haz clic en el círculo para ver todos los atletas</li>
            <li><strong>Zoom:</strong> Usa la rueda del ratón</li>
            <li><strong>Arrastrar:</strong> Mueve el mapa con el ratón</li>
            <li><strong>Inclinación:</strong> Arrastra con botón derecho o Ctrl + arrastrar</li>
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