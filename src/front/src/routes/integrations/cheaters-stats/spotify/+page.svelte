<script>
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';
    
    let loading = true;
    let error = null;
    let chart = null;
    let artists = [];
    let popularityData = [];
    let countries = [];
    let reportsData = [];
    
    onMount(() => {
        loadData();
    });
    
    async function loadData() {
        try {
            console.log('Cargando Cheaters Stats...');
            
            // 1. Cheaters Stats
            const cheatersRes = await fetch('/api/v2/cheaters-stats?limit=200');
            const cheatersJson = await cheatersRes.json();
            const cheatersData = cheatersJson.data || [];
            
            const cheatersByCountry = {};
            cheatersData.forEach(item => {
                const country = item.country?.toLowerCase();
                if (country) {
                    cheatersByCountry[country] = (cheatersByCountry[country] || 0) + (item.cheater_report || 0);
                }
            });
            
            const topCountries = Object.entries(cheatersByCountry)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([country, reports]) => ({ country: country.toUpperCase(), reports }));
            
            countries = topCountries.map(c => c.country);
            reportsData = topCountries.map(c => c.reports);
            
            console.log('Cargando artistas de Spotify...');
            
            // 2. Spotify API
            const spotifyRes = await fetch('/api/spotify/search?q=videogame&limit=8');
            
            if (!spotifyRes.ok) {
                throw new Error(`Error en Spotify: ${spotifyRes.status}`);
            }
            
            const spotifyData = await spotifyRes.json();
            artists = spotifyData.artists || [];
            popularityData = artists.map(a => a.popularity);
            
            console.log('Artistas:', artists.map(a => a.name));
            
            // Normalizar
            const maxReports = Math.max(...reportsData);
            const maxPopularity = Math.max(...popularityData);
            const normReports = reportsData.map(r => (r / maxReports) * 100);
            const normPopularity = popularityData.map(p => (p / maxPopularity) * 100);
            
            const canvas = document.getElementById('chart');
            if (!canvas) throw new Error('Canvas no encontrado');
            const ctx = canvas.getContext('2d');
            if (chart) chart.destroy();
            
            chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: artists.map(a => a.name.length > 15 ? a.name.substring(0, 12) + '...' : a.name),
                    datasets: [
                        {
                            label: '🎵 Popularidad (Spotify)',
                            data: normPopularity,
                            backgroundColor: '#1DB954',
                            borderRadius: 8
                        },
                        {
                            label: '📊 Reportes de Tramposos (ref)',
                            data: normReports.slice(0, 8),
                            backgroundColor: '#7e22ce',
                            borderRadius: 8
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: { display: true, text: '🎵 Spotify vs Reportes de Tramposos', color: '#7e22ce', font: { size: 16 } },
                        tooltip: { callbacks: { label: (ctx) => {
                            const idx = ctx.dataIndex;
                            if (ctx.dataset.label.includes('Spotify')) {
                                return `🎵 ${artists[idx]?.name}: popularidad ${popularityData[idx]}/100`;
                            }
                            return `📊 Reportes: ${reportsData[idx]?.toLocaleString()}`;
                        } } },
                        legend: { position: 'top' }
                    },
                    scales: {
                        y: { title: { display: true, text: 'Normalizado (%)' }, beginAtZero: true, max: 100, ticks: { callback: (val) => `${val}%` } },
                        x: { ticks: { rotate: -45 } }
                    }
                }
            });
            
            loading = false;
            
        } catch (err) {
            console.error('Error:', err);
            error = err.message;
            loading = false;
        }
    }
</script>

<div class="container">
    <a href="/integrations/cheaters-stats" class="back-link">← Volver</a>
    <h1>🎵 Spotify API + Cheaters Stats</h1>
    <p class="subtitle">Autenticación OAuth con Spotify</p>
    
    <div style="height: 500px; width: 100%;">
        <canvas id="chart" style="width: 100%; height: 100%;"></canvas>
    </div>
    
    {#if loading}
        <div class="loading">Cargando datos...</div>
    {/if}
    {#if error}
        <div class="error">Error: {error}</div>
    {/if}
</div>

<style>
    .container { max-width: 1000px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #e9d5ff; }
    .back-link { color: #7e22ce; text-decoration: none; }
    h1 { color: #1DB954; margin: 0; }
    .subtitle { color: #666; margin-bottom: 1.5rem; }
    .loading, .error { text-align: center; padding: 2rem; }
</style>