<script>
// @ts-nocheck

    import { onMount } from 'svelte';
    
    let loading = true;
    // @ts-ignore
    let error = null;
    
    onMount(() => {
        initChart();
    });
    
    // Función para cargar datos de ejemplo si es necesario
    async function ensureDataLoaded() {
        // 1. Verificar datos de Olympics (Gonzalo)
        let res = await fetch('/api/v2/olympics-athlete-events?limit=1');
        let data = await res.json();
        let athletes = data.data || [];
        
        if (athletes.length === 0) {
            console.log('Cargando datos de ejemplo de Olympics...');
            await fetch('/api/v2/olympics-athlete-events/loadInitialData');
        }
        
        // 2. Verificar datos de Cheaters (Francisco) - Probar ambas versiones
        res = await fetch('/api/v2/cheaters-stats?limit=1');
        if (res.status === 404) {
            // Si v2 no existe, probar v1
            res = await fetch('/api/v1/cheaters-stats?limit=1');
        }
        
        if (res.ok) {
            let cheatersData = await res.json();
            let cheaters = cheatersData.data || cheatersData || [];
            
            if (cheaters.length === 0) {
                console.log('Cargando datos de ejemplo de Cheaters...');
                // Intentar cargar datos de ejemplo
                await fetch('/api/v2/cheaters-stats/loadInitialData').catch(async () => {
                    await fetch('/api/v1/cheaters-stats/loadInitialData');
                });
            }
        } else {
            console.log('No se pudo acceder a la API de Cheaters');
        }
        
        // 3. Verificar datos de Esports Earnings (Mario)
        res = await fetch('/api/v1/esportsearnings-stats?limit=1');
        let earnings = await res.json();
        
        if (!earnings || earnings.length === 0) {
            console.log('Cargando datos de ejemplo de Esports Earnings...');
            await fetch('/api/v1/esportsearnings-stats/loadInitialData').catch(() => {});
        }
        
        // 4. Verificar datos de Esports Growth (David)
        res = await fetch('/api/v1/esportsgrowth-stats?limit=1');
        let growth = await res.json();
        
        if (!growth || growth.length === 0) {
            console.log('Cargando datos de ejemplo de Esports Growth...');
            await fetch('/api/v1/esportsgrowth-stats/loadInitialData').catch(() => {});
        }
    }
    
    async function initChart() {
        try {
            // Primero, asegurar que todos los datos están cargados
            await ensureDataLoaded();
            
            // 1. GONZALO: Olympics
            const resOlympics = await fetch('/api/v2/olympics-athlete-events?limit=500');
            const olympicsData = await resOlympics.json();
            const athletes = olympicsData.data || [];
            
            const athletesByCountry = {};
            // @ts-ignore
            athletes.forEach(ath => {
                const country = ath.team;
                if (country && country !== 'NA') {
                    // @ts-ignore
                    athletesByCountry[country] = (athletesByCountry[country] || 0) + 1;
                }
            });
            
            // 2. FRANCISCO: Cheaters Stats (probar v1 y v2)
            let cheaters = [];
            let resCheaters = await fetch('/api/v2/cheaters-stats?limit=200');
            if (resCheaters.status === 404) {
                resCheaters = await fetch('/api/v1/cheaters-stats?limit=200');
            }
            
            if (resCheaters.ok) {
                const cheatersData = await resCheaters.json();
                cheaters = cheatersData.data || cheatersData || [];
                console.log('Cheaters cargados:', cheaters.length);
            }
            
            // 3. MARIO: Esports Earnings
            const resEarnings = await fetch('/api/v1/esportsearnings-stats?limit=200');
            const earnings = await resEarnings.json();
            
            // 4. DAVID: Esports Growth
            const resGrowth = await fetch('/api/v1/esportsgrowth-stats?limit=200');
            const growth = await resGrowth.json();
            
            // Agrupar por país
            const countryStats = {};
            
            // GONZALO
            Object.entries(athletesByCountry).forEach(([country, count]) => {
                // @ts-ignore
                if (!countryStats[country]) {
                    // @ts-ignore
                    countryStats[country] = { athletes: 0, cheaters: 0, tournaments: 0, viewership: 0 };
                }
                // @ts-ignore
                countryStats[country].athletes = count;
            });
            
            // FRANCISCO
            // @ts-ignore
            cheaters.forEach(item => {
                const country = item.country;
                if (country) {
                    // @ts-ignore
                    if (!countryStats[country]) {
                        // @ts-ignore
                        countryStats[country] = { athletes: 0, cheaters: 0, tournaments: 0, viewership: 0 };
                    }
                    // @ts-ignore
                    countryStats[country].cheaters += item.confirmed_ban || 0;
                }
            });
            
            // MARIO
            // @ts-ignore
            earnings.forEach(item => {
                const country = item.country;
                if (country) {
                    // @ts-ignore
                    if (!countryStats[country]) {
                        // @ts-ignore
                        countryStats[country] = { athletes: 0, cheaters: 0, tournaments: 0, viewership: 0 };
                    }
                    // @ts-ignore
                    countryStats[country].tournaments += item.tournament_no || 0;
                }
            });
            
            // DAVID
            // @ts-ignore
            growth.forEach(item => {
                const country = item.country;
                if (country) {
                    // @ts-ignore
                    if (!countryStats[country]) {
                        // @ts-ignore
                        countryStats[country] = { athletes: 0, cheaters: 0, tournaments: 0, viewership: 0 };
                    }
                    // @ts-ignore
                    countryStats[country].viewership += item.viewership || 0;
                }
            });
            
            // Calcular totales
            const totalAthletes = Object.values(countryStats).reduce((sum, s) => sum + s.athletes, 0);
            const totalCheaters = Object.values(countryStats).reduce((sum, s) => sum + s.cheaters, 0);
            const totalTournaments = Object.values(countryStats).reduce((sum, s) => sum + s.tournaments, 0);
            const totalViewership = Object.values(countryStats).reduce((sum, s) => sum + s.viewership, 0);
            
            // Top países
            let topCountries = Object.entries(countryStats)
                .filter(([_, stats]) => stats.athletes > 0)
                .sort((a, b) => b[1].athletes - a[1].athletes)
                .slice(0, 12);
            
            // Asegurar España
            const hasSpain = topCountries.some(([country]) => country === 'Spain');
            // @ts-ignore
            if (!hasSpain && countryStats['Spain']) {
                // @ts-ignore
                topCountries.push(['Spain', countryStats['Spain']]);
            } else if (!hasSpain) {
                topCountries.push(['Spain', { athletes: 0, cheaters: 0, tournaments: 0, viewership: 0 }]);
            }
            
            const categories = topCountries.map(([country]) => country);
            
            const series = [
                {
                    name: '🏅 Gonzalo - Atletas Olímpicos',
                    data: topCountries.map(([, stats]) => totalAthletes > 0 ? (stats.athletes / totalAthletes) * 100 : 0),
                    color: '#0284c7'
                },
                {
                    name: '🚫 Francisco - Baneos Cheaters',
                    data: topCountries.map(([, stats]) => totalCheaters > 0 ? (stats.cheaters / totalCheaters) * 100 : 0),
                    color: '#dc2626'
                },
                {
                    name: '🏆 Mario - Torneos Esports',
                    data: topCountries.map(([, stats]) => totalTournaments > 0 ? (stats.tournaments / totalTournaments) * 100 : 0),
                    color: '#f59e0b'
                },
                {
                    name: '👁️ David - Audiencia Esports',
                    data: topCountries.map(([, stats]) => totalViewership > 0 ? (stats.viewership / totalViewership) * 100 : 0),
                    color: '#10b981'
                }
            ];
            
            const Highcharts = await import('highcharts');
            const HC = Highcharts.default;
            
            HC.chart('container', {
                chart: { type: 'column', height: 600 },
                title: { text: '📊 Visualización Integrada del Equipo SOS' },
                subtitle: { text: totalCheaters === 0 ? '⚠️ Datos de Cheaters (Francisco) no disponibles' : 'Distribución porcentual por país' },
                xAxis: {
                    categories: categories,
                    title: { text: 'País' },
                    labels: { rotation: -45, style: { fontSize: '11px' } }
                },
                yAxis: {
                    title: { text: 'Porcentaje (%)' },
                    max: 100,
                    labels: { format: '{value}%' }
                },
                tooltip: { shared: true, valueSuffix: '%' },
                plotOptions: {
                    column: {
                        dataLabels: { enabled: true, format: '{y:.1f}%', style: { fontSize: '9px' } }
                    }
                },
                series: series
            });
            
            loading = false;
            
            const overlay = document.querySelector('.loading-overlay');
            if (overlay) {
                // @ts-ignore
                overlay.style.display = 'none';
            }
            
        } catch (e) {
            console.error('Error:', e);
            // @ts-ignore
            error = e.message;
            loading = false;
            
            const overlay = document.querySelector('.loading-overlay');
            if (overlay) {
                // @ts-ignore
                overlay.style.display = 'none';
            }
        }
    }
</script>

<!-- Resto del HTML igual -->

<div class="analytics-container">
    <h1>📊 Visualización Integrada del Equipo</h1>
    <p class="subtitle">Distribución porcentual por país (datos reales de sus APIs)</p>
    
    <div class="individual-links">
        <a href="/analytics/easportsgrowth-stats" class="link-btn">David - Esports growth stats</a>
        <a href="/analytics/esportsearnings-stats" class="link-btn">Mario - Esports earnings stats</a>
        <a href="/analytics/olympics-athlete-events" class="link-btn">Gonzalo - Olympics Athlete Events</a>
        <a href="/analytics/cheaters-stats" class="link-btn">Francisco - Cheaters Stats</a>
    </div>
    
    <div id="container" style="height: 650px; width: 100%;"></div>
    
    <div class="loading-overlay">
        <div class="spinner"></div>
        <p>Cargando gráfico grupal...</p>
    </div>
    
    {#if error}
        <div class="error">
            <p>❌ Error: {error}</p>
        </div>
    {/if}
    
    <div class="info">
        <h3>📖 Visualización Grupal</h3>
        <ul>
            <li><strong>🔵 Azul (Gonzalo):</strong> % de atletas olímpicos por país</li>
            <li><strong>🔴 Rojo (Francisco):</strong> % de baneos confirmados en cheaters</li>
            <li><strong>🟠 Naranja (Mario):</strong> % de torneos de esports por país</li>
            <li><strong>🟢 Verde (David):</strong> % de audiencia de esports por país</li>
        </ul>
    </div>
</div>

<style>
    .analytics-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        position: relative;
        min-height: 600px;
    }
    
    h1 {
        color: #0369a1;
        text-align: center;
        margin-bottom: 0.5rem;
    }
    
    .subtitle {
        text-align: center;
        color: #666;
        margin-bottom: 2rem;
    }
    
    .individual-links {
        display: flex;
        justify-content: center;
        gap: 1rem;
        flex-wrap: wrap;
        margin-bottom: 2rem;
    }
    
    .link-btn {
        background: #f0f9ff;
        color: #0369a1;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 500;
        border: 1px solid #bae6fd;
        transition: all 0.2s;
    }
    
    .link-btn:hover {
        background: #0284c7;
        color: white;
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
        z-index: 10;
    }
    
    .spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #0284c7;
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
    
    .info {
        margin-top: 2rem;
        padding: 1rem;
        background: #f0f9ff;
        border-radius: 12px;
        border: 1px solid #bae6fd;
    }
    
    .info h3 {
        color: #0369a1;
        margin-top: 0;
    }
    
    .info ul {
        margin: 0;
        padding-left: 1.5rem;
    }
    
    .info li {
        margin: 0.5rem 0;
        color: #333;
    }
</style>