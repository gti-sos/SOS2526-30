<script>
    import { onMount } from 'svelte';

    let mapElement;
    let errorMessage = '';

    // Diccionario de coordenadas SOLO para los países reales
    const countryCoords = {
        "United States": [37.0902, -95.7129],
        "China": [35.8617, 104.1954],
        "Japan": [36.2048, 138.2529],
        "South Korea": [35.9078, 127.7669],
        "Spain": [40.4637, -3.7492]
    };

    onMount(async () => {
        try {
            const L = (await import('leaflet')).default;

            const res = await fetch('/api/v1/esportsgrowth-stats');
            if (!res.ok) throw new Error('Error al cargar la API');
            const data = await res.json();

            const map = L.map(mapElement).setView(, 2);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap'
            }).addTo(map);

            data.forEach(stat => {
                const coords = countryCoords[stat.country];
                
                if (coords) {
                    const radiusSize = Math.max((stat.active_player_no || 1) * 20000, 50000);

                    const circle = L.circle(coords, {
                        color: '#9333ea',       
                        fillColor: '#a855f7',   
                        fillOpacity: 0.5,
                        radius: radiusSize
                    }).addTo(map);

                    circle.bindPopup(`
                        <div style="text-align: center;">
                            <strong style="color: #7e22ce; font-size: 1.1rem;">${stat.country} (${stat.year})</strong><br>
                            <hr style="margin: 5px 0;">
                            <strong>Jugadores Activos:</strong> ${stat.active_player_no} M<br>
                            <strong>Espectadores:</strong> ${stat.viewership} M<br>
                            <strong>Género Top:</strong> ${stat.top_genre}
                        </div>
                    `);
                }
            });

        } catch (error) {
            errorMessage = error.message;
        }
    });
</script>

<svelte:head>
    <title>Mapa Geoespacial - eSports Growth</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>
</svelte:head>

<main>
    <h1>Mapa Geoespacial de eSports</h1>
    
    <div class="nav-links">
        <a href="/analytics/esportsgrowth-stats" class="btn-gray">Volver a la Gráfica</a>
        <a href="/esportsgrowth-stats" class="btn-purple">Ir a la Tabla de Datos</a>
    </div>

    {#if errorMessage}
        <p class="error">❌ {errorMessage}</p>
    {:else}
        <div bind:this={mapElement} class="map-container"></div>
    {/if}
</main>

<style>
    main {
        max-width: 1000px;
        margin: 2rem auto;
        padding: 1rem;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    h1 {
        color: #7e22ce;
        text-align: center;
        border-bottom: 2px solid #a855f7;
        padding-bottom: 0.5rem;
    }
    .nav-links {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-bottom: 2rem;
    }
    a {
        text-decoration: none;
        padding: 0.6rem 1.2rem;
        border-radius: 6px;
        font-weight: bold;
        color: white;
        transition: 0.2s;
    }
    .btn-gray { background: #6b7280; }
    .btn-gray:hover { background: #4b5563; }
    .btn-purple { background: #9333ea; }
    .btn-purple:hover { background: #7e22ce; }
    
    .map-container {
        width: 100%;
        height: 600px;
        border-radius: 12px;
        box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
        border: 2px solid #e9d5ff;
        background: #f3f4f6;
        z-index: 1;
    }
    .error {
        color: #dc2626;
        text-align: center;
        background: #fee2e2;
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid #f87171;
    }
</style>