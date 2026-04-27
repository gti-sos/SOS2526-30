<script>
    import { onMount } from 'svelte';
    import 'leaflet/dist/leaflet.css';
    
    let mapContainer;
    let loading = true;
    let error = null;

    onMount(async () => {
        try {
            const L = (await import('leaflet')).default;
            
            // Fix de iconos
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            });

            const res = await fetch('/api/v1/esportsearnings-stats');
            const data = await res.json();

            // Coordenadas
            const coords = {
                'Spain': [40.41, -3.70], 'USA': [38.89, -77.03], 'United States': [38.89, -77.03],
                'China': [39.90, 116.40], 'Japan': [35.67, 139.65], 'Germany': [52.52, 13.40],
                'Italy': [41.90, 12.49], 'UK': [51.50, -0.12], 'United Kingdom': [51.50, -0.12],
                'Sweden': [60.12, 18.64], 'South Korea': [35.90, 127.76]
            };

            const stats = {};
            data.forEach(d => {
                if (coords[d.country]) {
                    if (!stats[d.country]) stats[d.country] = { money: 0, tournaments: 0 };
                    stats[d.country].money += d.total_money || 0;
                    stats[d.country].tournaments += d.tournament_no || 0;
                }
            });

            const map = L.map('map').setView([20, 0], 2);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

            Object.entries(stats).forEach(([name, s]) => {
                L.circleMarker(coords[name], {
                    radius: Math.max(10, Math.min(s.money / 2, 40)),
                    fillColor: '#10b981', color: '#fbbf24', weight: 2, fillOpacity: 0.6
                })
                .bindPopup(`<b>${name}</b><br>💰 $${s.money.toFixed(2)}M<br>🏆 ${s.tournaments} Torneos`)
                .addTo(map);
            });

            loading = false;
        } catch (e) { error = e.message; loading = false; }
    });
</script>

<div class="map-page">
    <div class="header">
        <h1>🌍 Mapa de Ganancias - Mario</h1>
        <div class="nav">
            <a href="/analytics/esportsearnings-stats" class="btn">📊 Volver a Gráfico</a>
        </div>
    </div>

    <div class="wrapper">
        <div id="map"></div>
        {#if loading}<div class="overlay">Cargando...</div>{/if}
        {#if error}<div class="overlay">❌ {error}</div>{/if}
    </div>
</div>

<style>
    .map-page { max-width: 1200px; margin: 0 auto; padding: 2rem; font-family: sans-serif; }
    h1 { text-align: center; color: #064e3b; }
    .nav { display: flex; justify-content: center; margin-bottom: 1rem; }
    .btn { background: #10b981; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; }
    .wrapper { position: relative; height: 550px; border-radius: 12px; overflow: hidden; border: 2px solid #10b981; }
    #map { height: 100%; width: 100%; background: #1a1a1a; }
    .overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); color: white; display: flex; align-items: center; justify-content: center; z-index: 1000; }
</style>
