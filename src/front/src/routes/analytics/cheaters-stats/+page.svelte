<script>
    import { onMount } from 'svelte';
    
    let loading = true;
    let error = null;
    let chart = null;
    
    onMount(() => {
        initChart();
    });
    
    async function initChart() {
        try {
            // Cargar datos de Cheaters Stats (usando v2)
            let res = await fetch('/api/v2/cheaters-stats?limit=200');
            
            // Si v2 falla, probar v1
            if (res.status === 404) {
                res = await fetch('/api/v1/cheaters-stats?limit=200');
            }
            
            if (!res.ok) {
                throw new Error(`Error al cargar datos: ${res.status}`);
            }
            
            let data = await res.json();
            let cheaters = data.data || data || [];
            
            if (cheaters.length === 0) {
                // Intentar cargar datos de ejemplo
                await fetch('/api/v2/cheaters-stats/loadInitialData');
                // Recargar después de cargar datos
                res = await fetch('/api/v2/cheaters-stats?limit=200');
                let newData = await res.json();
                cheaters = newData.data || newData || [];
            }
            
            console.log('Cheaters cargados:', cheaters.length);
            
            if (cheaters.length === 0) {
                throw new Error('No hay datos disponibles');
            }
            
            // Agrupar datos por país
            const countryStats = {};
            
            cheaters.forEach(item => {
                const country = item.country;
                if (country) {
                    if (!countryStats[country]) {
                        countryStats[country] = {
                            cheater_reports: 0,
                            confirmed_bans: 0
                        };
                    }
                    countryStats[country].cheater_reports += item.cheater_report || 0;
                    countryStats[country].confirmed_bans += item.confirmed_ban || 0;
                }
            });
            
            // Top países por reportes (para no saturar el gráfico pie)
            let topCountries = Object.entries(countryStats)
                .sort((a, b) => b[1].cheater_reports - a[1].cheater_reports)
                .slice(0, 10);
            
            // Calcular "Otros" para países fuera del top 10
            let otherReports = 0;
            let otherBans = 0;
            
            Object.entries(countryStats).forEach(([country, stats]) => {
                const isInTop = topCountries.some(([c]) => c === country);
                if (!isInTop) {
                    otherReports += stats.cheater_reports;
                    otherBans += stats.confirmed_bans;
                }
            });
            
            if (otherReports > 0) {
                topCountries.push(['Otros', { cheater_reports: otherReports, confirmed_bans: otherBans }]);
            }
            
            // Preparar datos para el gráfico de pie (Reportes)
            const pieDataReports = topCountries.map(([country, stats]) => ({
                name: country,
                y: stats.cheater_reports,
                confirmedBans: stats.confirmed_bans
            }));
            
            // Importar Highcharts
            const Highcharts = await import('highcharts');
            const HC = Highcharts.default;
            
            // Destruir gráfico anterior si existe
            if (chart) {
                chart.destroy();
            }
            
            // Crear nuevo gráfico de tipo PIE
            chart = HC.chart('container', {
                chart: {
                    type: 'pie',  // ← TIPO PIE (NO es "line")
                    height: 550,
                    options3d: {
                        enabled: true,
                        alpha: 45,
                        beta: 0
                    }
                },
                title: {
                    text: '🚫 Distribución de Reportes de Tramposos por País',
                    style: { color: '#7e22ce', fontSize: '18px' }
                },
                subtitle: {
                    text: 'Basado en datos del Video Game Cheaters Dataset',
                    style: { color: '#666' }
                },
                tooltip: {
                    pointFormat: '<b>{point.name}</b><br/>' +
                                'Reportes: {point.y:,.0f}<br/>' +
                                'Baneos: {point.confirmedBans:,.0f}<br/>' +
                                'Porcentaje: {point.percentage:.1f}%'
                },
                plotOptions: {
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        dataLabels: {
                            enabled: true,
                            format: '<b>{point.name}</b><br/>{point.percentage:.1f}%',
                            style: {
                                fontSize: '11px',
                                fontWeight: 'bold'
                            },
                            distance: 20
                        },
                        showInLegend: true,
                        depth: 40,
                        size: '70%'
                    }
                },
                series: [{
                    name: 'Reportes de Tramposos',
                    data: pieDataReports,
                    colors: [
                        '#a855f7', '#9333ea', '#7e22ce', '#6b21a5', '#581c87',
                        '#c084fc', '#d8b4fe', '#e9d5ff', '#f3e8ff', '#faf5ff',
                        '#9ca3af'
                    ]
                }]
            });
            
            loading = false;
            
            const overlay = document.querySelector('.loading-overlay');
            if (overlay) {
                overlay.style.display = 'none';
            }
            
        } catch (e) {
            console.error('Error:', e);
            error = e.message;
            loading = false;
            
            const overlay = document.querySelector('.loading-overlay');
            if (overlay) {
                overlay.style.display = 'none';
            }
        }
    }
</script>

<div class="analytics-container">
    <h1>🚫 Analytics: Estadísticas de Tramposos</h1>
    <p class="subtitle">Distribución de reportes de tramposos por país (Gráfico de Tarta)</p>
    
    <div class="individual-links">
        <a href="/analytics/easportsgrowth-stats" class="link-btn">📈 David - Esports Growth</a>
        <a href="/analytics/esportsearnings-stats" class="link-btn">💰 Mario - Esports Earnings</a>
        <a href="/analytics/olympics-athlete-events" class="link-btn">🏅 Gonzalo - Olympics Athlete Events</a>
        <a href="/analytics/cheaters-stats" class="link-btn active">📊 Francisco - Cheaters Stats (Gráfico)</a>
        <a href="/analytics/cheaters-stats/map" class="link-btn map-btn">🗺️ Francisco - Cheaters Stats (Mapa)</a>
    </div>
    
    <div id="container" style="height: 550px; width: 100%; min-height: 500px;"></div>
    
    {#if loading}
        <div class="loading-overlay">
            <div class="spinner"></div>
            <p>Cargando gráfico de Cheaters Stats...</p>
        </div>
    {/if}
    
    {#if error}
        <div class="error">
            <p>❌ Error: {error}</p>
            <button onclick={() => window.location.reload()}>Reintentar</button>
        </div>
    {/if}
    
    <div class="info">
        <h3>📖 Visualización Individual - Cheaters Stats</h3>
        <ul>
            <li><strong>🥧 Tipo de gráfico:</strong> Pie (Gráfico de Tarta / Circular) - No es "line"</li>
            <li><strong>📊 Datos mostrados:</strong> Distribución de reportes de tramposos por país</li>
            <li><strong>🌍 Top 10 países:</strong> Muestra los 10 países con más reportes + categoría "Otros"</li>
            <li><strong>🔍 Tooltip interactivo:</strong> Muestra reportes, baneos y porcentaje al pasar el ratón</li>
            <li><strong>📡 API utilizada:</strong> /api/v2/cheaters-stats</li>
        </ul>
    </div>
</div>

<style>
    .analytics-container {
        max-width: 1000px;
        margin: 0 auto;
        padding: 2rem;
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 25px -5px rgba(147, 51, 234, 0.2);
        position: relative;
        min-height: 700px;
        border: 1px solid #e9d5ff;
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
    
    .individual-links {
        display: flex;
        justify-content: center;
        gap: 1rem;
        flex-wrap: wrap;
        margin-bottom: 2rem;
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
    
    /* Estilo específico para el botón del mapa */
    .link-btn.map-btn {
        background: linear-gradient(135deg, #7e22ce, #a855f7);
        color: white;
        border-color: #7e22ce;
    }
    
    .link-btn.map-btn:hover {
        background: linear-gradient(135deg, #6b21a5, #9333ea);
        transform: translateY(-2px);
    }
    
    #container {
        margin: 1rem 0;
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
    }
    
    .info h3 {
        color: #7e22ce;
        margin-top: 0;
    }
    
    .info ul {
        margin: 0.5rem 0;
        padding-left: 1.5rem;
    }
    
    .info li {
        margin: 0.5rem 0;
        color: #333;
    }
</style>