<script>
    import { onMount, tick } from 'svelte';
    import Chart from 'chart.js/auto';
    
    let loading = true;
    let error = null;
    let chart = null;
    let yearsList = [];
    let patStatus = null;
    let allSports = [];
    let topLeagues = [];
    let cheatersDataRaw = [];
    let sportsYearlyStats = {};
    
    onMount(async () => {
        await tick();
        await loadSportsIntegration();
    });
    
    async function loadSportsIntegration() {
        try {
            loading = true;
            console.log('⚽ Cargando integración: Cheaters Stats + SportsDB API...');
            
            // 1. FETCH Cheaters Stats
            const cheatersRes = await fetch('/api/v2/cheaters-stats?limit=200');
            const cheatersJson = await cheatersRes.json();
            const cheatersData = cheatersJson.data || [];
            cheatersDataRaw = cheatersData;
            console.log(`✅ Cheaters: ${cheatersData.length} registros`);
            
            // 2. FETCH SportsDB API status
            const patStatusRes = await fetch('/api/sports/status');
            patStatus = await patStatusRes.json();
            console.log('✅ SportsDB Status:', patStatus);
            
            // 3. FETCH deportes
            const sportsRes = await fetch('/api/sports/sports');
            const sportsJson = await sportsRes.json();
            if (sportsJson.success) {
                allSports = sportsJson.sports || [];
                console.log(`✅ Deportes: ${allSports.length}`);
            }
            
            // 4. FETCH ligas españolas
            const leaguesRes = await fetch('/api/sports/leagues?country=Spain');
            const leaguesJson = await leaguesRes.json();
            if (leaguesJson.success) {
                topLeagues = leaguesJson.leagues || [];
                console.log(`✅ Ligas españolas: ${topLeagues.length}`);
            }
            
            // 5. FETCH estadísticas anuales
            const statsRes = await fetch('/api/sports/yearly-stats');
            const statsJson = await statsRes.json();
            if (statsJson.success) {
                sportsYearlyStats = statsJson.years;
                console.log('✅ Estadísticas anuales cargadas');
            }
            
            // 6. Agrupar Cheaters por año
            const cheatersByYear = {};
            cheatersData.forEach(item => {
                if (item.year) {
                    cheatersByYear[item.year] = (cheatersByYear[item.year] || 0) + (item.cheater_report || 0);
                }
            });
            
            const years = Object.keys(cheatersByYear).sort();
            yearsList = years;
            
            const reportsData = years.map(y => cheatersByYear[y] || 0);
            const sportsData = years.map(y => sportsYearlyStats[y] || 1000);
            
            // Normalizar datos
            const maxReports = Math.max(...reportsData);
            const maxSports = Math.max(...sportsData);
            
            const normalizedReports = reportsData.map(r => maxReports > 0 ? (r / maxReports) * 100 : 0);
            const normalizedSports = sportsData.map(s => (s / maxSports) * 100);
            
            console.log('📊 Años:', years);
            console.log('📊 Reportes:', reportsData);
            console.log('⚽ Eventos deportivos:', sportsData);
            
            // Renderizar gráfico
            const canvas = document.getElementById('chart');
            if (!canvas) throw new Error('Canvas no encontrado');
            
            const ctx = canvas.getContext('2d');
            if (chart) chart.destroy();
            
            chart = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: years,
                    datasets: [
                        {
                            label: '📊 Reportes de Tramposos',
                            data: normalizedReports,
                            backgroundColor: 'rgba(124,58,237,0.2)',
                            borderColor: '#7e22ce',
                            borderWidth: 3,
                            pointBackgroundColor: '#7e22ce',
                            pointBorderColor: 'white',
                            pointRadius: 5,
                            fill: true
                        },
                        {
                            label: '⚽ Actividad Deportiva (Eventos Globales)',
                            data: normalizedSports,
                            backgroundColor: 'rgba(34,197,94,0.2)',
                            borderColor: '#22c55e',
                            borderWidth: 3,
                            pointBackgroundColor: '#22c55e',
                            pointBorderColor: 'white',
                            pointRadius: 5,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: { 
                            display: true, 
                            text: '⚽ Reportes de Tramposos vs Actividad Deportiva Global', 
                            color: '#166534', 
                            font: { size: 16, weight: 'bold' } 
                        },
                        subtitle: { 
                            display: true, 
                            text: 'Datos de The Sports DB (PAT 123) - Eventos deportivos mundiales' 
                        },
                        tooltip: { 
                            callbacks: { 
                                label: (ctx) => {
                                    const index = ctx.dataIndex;
                                    const year = years[index];
                                    const reportsReal = reportsData[index];
                                    const sportsReal = sportsData[index];
                                    
                                    if (ctx.dataset.label.includes('Reportes')) {
                                        return `📊 Reportes ${year}: ${reportsReal.toLocaleString()}`;
                                    } else {
                                        return `⚽ Eventos deportivos ${year}: ${sportsReal.toLocaleString()}`;
                                    }
                                }
                            }
                        }
                    },
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 100,
                            ticks: { stepSize: 20, callback: (val) => `${val}%` }
                        }
                    }
                }
            });
            
            loading = false;
            console.log('✅ Gráfico creado correctamente');
            
        } catch (err) {
            console.error('❌ Error:', err);
            error = err.message;
            loading = false;
        }
    }
</script>

<div class="container">
    <a href="/integrations/cheaters-stats" class="back-link">← Volver a Cheaters Stats</a>
    <h1>⚽ SportsDB API + Cheaters Stats</h1>
    <p class="subtitle">Datos obtenidos en tiempo real mediante fetch a ambas APIs</p>
    
    <div style="height: 500px; width: 100%; margin-bottom: 2rem;">
        <canvas id="chart" style="width: 100%; height: 100%;"></canvas>
    </div>
    
    {#if loading}
        <div class="loading">⚽ Cargando datos desde las APIs...</div>
    {:else if error}
        <div class="error">Error: {error}</div>
    {:else}
        <div class="pat-status {patStatus?.authenticated ? 'success' : 'error'}">
            <strong>🔐 PAT (SportsDB API Key 123):</strong> 
            {patStatus?.authenticated ? '✅ Autenticado' : '❌ No autenticado'}
            <span> - {patStatus?.leagues_found || 0} ligas encontradas</span>
        </div>
        
        <div class="info-grid">
            <div class="info-card">
                <h3>⚽ Deportes</h3>
                <p class="big-number">{allSports.length}</p>
                <p>desde SportsDB</p>
            </div>
            <div class="info-card">
                <h3>🏆 Ligas (España)</h3>
                <p class="big-number">{topLeagues.length}</p>
                <p>en La Liga, Segunda, etc</p>
            </div>
            <div class="info-card">
                <h3>📊 Años</h3>
                <p class="big-number">{yearsList.length}</p>
                <p>{yearsList.join(', ')}</p>
            </div>
        </div>
        
        <div class="info-note">
            <p><strong>📌 Datos en tiempo real:</strong></p>
            <ul>
                <li><strong>Cheaters Stats:</strong> <code>fetch('/api/v2/cheaters-stats')</code></li>
                <li><strong>SportsDB API:</strong> <code>fetch('/api/sports/yearly-stats')</code> con PAT 123</li>
                <li><strong>Actividad deportiva:</strong> Basada en eventos reales (Mundiales, Juegos Olímpicos)</li>
            </ul>
            <p><strong>📊 Eventos destacados por año:</strong></p>
            <ul>
                <li>2010: Mundial Sudáfrica | 2012: Juegos Olímpicos Londres</li>
                <li>2014: Mundial Brasil | 2016: Juegos Olímpicos Río</li>
                <li>2018: Mundial Rusia | 2020: Pandemia (menos eventos)</li>
                <li>2021: Eurocopa + Juegos Olímpicos Tokio | 2022: Mundial Qatar</li>
            </ul>
        </div>
    {/if}
</div>

<style>
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #dcfce7; }
    .back-link { color: #16a34a; text-decoration: none; display: inline-block; margin-bottom: 1rem; }
    .back-link:hover { text-decoration: underline; }
    h1 { color: #166534; margin: 0; }
    .subtitle { color: #666; margin-bottom: 1.5rem; }
    .loading { text-align: center; padding: 2rem; color: #16a34a; }
    .error { text-align: center; padding: 3rem; color: #dc2626; }
    
    .pat-status { 
        padding: 0.75rem; 
        border-radius: 8px; 
        margin-bottom: 1.5rem;
        text-align: center;
    }
    .pat-status.success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
    .pat-status.error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
    
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .info-card { background: #f0fdf4; padding: 1rem; border-radius: 12px; text-align: center; }
    .info-card h3 { color: #166534; margin: 0 0 0.5rem 0; font-size: 1rem; }
    .big-number { font-size: 2rem; font-weight: bold; color: #16a34a; margin: 0.5rem 0; }
    
    .info-note { margin-top: 1rem; padding: 1rem; background: #f0fdf4; border-radius: 8px; font-size: 0.85rem; color: #166534; border-left: 4px solid #22c55e; }
    .info-note code { background: #dcfce7; padding: 0.1rem 0.3rem; border-radius: 4px; }
</style>