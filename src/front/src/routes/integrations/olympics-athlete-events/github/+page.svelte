<script>
    import { onMount } from 'svelte';
    
    let loading = $state(true);
    let error = $state(null);
    let combinedData = $state([]);
    let chartInitialized = false;
    
    // Relación deporte → lenguaje de programación
    const sportToLanguage = {
        'Basketball': 'JavaScript',
        'Swimming': 'Python', 
        'Athletics': 'Java',
        'Gymnastics': 'TypeScript',
        'Football': 'Go',
        'Volleyball': 'Ruby',
        'Judo': 'C++',
        'Weightlifting': 'Rust',
        'Tennis': 'Swift',
        'Cycling': 'Kotlin'
    };
    
    onMount(() => {
        fetchCombinedData();
    });
    
    async function fetchCombinedData() {
        try {
            loading = true;
            
            // 1. Obtener datos de Olympics
            const olympicsRes = await fetch('/api/v1/olympics-athlete-events?limit=1000');
            const olympicsData = await olympicsRes.json();
            const athletes = olympicsData.data || [];
            
            // Contar atletas por deporte
            const sportCount = {};
            athletes.forEach(ath => {
                const sport = ath.sport;
                if (sport && sport !== 'NA') {
                    sportCount[sport] = (sportCount[sport] || 0) + 1;
                }
            });
            
            // 2. Obtener datos de GitHub
            const languages = {};
            
            for (const [sport, language] of Object.entries(sportToLanguage)) {
                if (language) {
                    try {
                        const repoRes = await fetch(`/api/github/search/repositories?q=language:${language.toLowerCase()}&per_page=1`);
                        const repoData = await repoRes.json();
                        languages[language] = repoData.total_count || 0;
                    } catch (e) {
                        languages[language] = 0;
                    }
                    await new Promise(r => setTimeout(r, 100));
                }
            }
            
            // 3. Combinar datos
            combinedData = Object.entries(sportToLanguage)
                .filter(([sport]) => sportCount[sport] > 0)
                .map(([sport, language]) => ({
                    sport: sport,
                    language: language,
                    athletes: sportCount[sport] || 0,
                    repos: languages[language] || 0
                }))
                .sort((a, b) => b.athletes - a.athletes);
            
            loading = false;
            
            setTimeout(() => {
                initChart();
            }, 200);
            
            const overlay = document.querySelector('.loading-overlay');
            if (overlay) overlay.style.display = 'none';
            
        } catch (e) {
            console.error('Error:', e);
            error = e.message;
            loading = false;
            const overlay = document.querySelector('.loading-overlay');
            if (overlay) overlay.style.display = 'none';
        }
    }
    
    async function initChart() {
        if (combinedData.length === 0 || chartInitialized) return;
        
        const container = document.getElementById('chart-container');
        if (!container) {
            console.log('Esperando contenedor...');
            setTimeout(() => initChart(), 100);
            return;
        }
        
        const Highcharts = await import('highcharts');
        const HC = Highcharts.default;
        
        const maxAthletes = Math.max(...combinedData.map(d => d.athletes));
        const maxRepos = Math.max(...combinedData.map(d => d.repos));
        
        // Normalizar repositorios para que quepa en el gráfico (escala relativa)
        const normalizedRepos = combinedData.map(d => (d.repos / maxRepos) * maxAthletes);
        
        HC.chart('chart-container', {
            chart: { 
                type: 'bar',  // ← Barras horizontales (no está en tu lista de usados)
                height: 500 
            },
            title: { 
                text: 'Relación: Atletas Olímpicos vs Repositorios GitHub',
                style: { fontSize: '16px' }
            },
            subtitle: {
                text: 'Las barras azules representan atletas | Las barras amarillas representan repositorios (escala ajustada)',
                style: { fontSize: '12px' }
            },
            xAxis: { 
                categories: combinedData.map(d => d.sport),
                title: { text: 'Deporte Olímpico' },
                labels: { style: { fontSize: '11px' } }
            },
            yAxis: { 
                title: { text: 'Número de Atletas' },
                labels: { format: '{value}' }
            },
            tooltip: { 
                shared: true,
                pointFormat: '<b>{point.category}</b><br/>{series.name}: {point.y:,.0f}'
            },
            plotOptions: {
                bar: {
                    dataLabels: {
                        enabled: true,
                        format: '{point.y:,.0f}',
                        style: { fontSize: '9px' }
                    }
                }
            },
            series: [
                {
                    name: 'Atletas Olímpicos',
                    data: combinedData.map(d => d.athletes),
                    color: '#0284c7'
                },
                {
                    name: 'Repositorios GitHub (normalizado)',
                    data: normalizedRepos,
                    color: '#eab308'
                }
            ]
        });
        
        chartInitialized = true;
    }
    
    function formatNumber(num) {
        if (num > 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num > 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }
</script>

<div class="integration-container">
    <h1>🏅 Deportes Olímpicos vs 💻 Lenguajes de Programación</h1>
    <p class="subtitle">Relación entre atletas por deporte y repositorios de GitHub por lenguaje</p>
    
    <div class="info-api">
        <p><strong>API 1 (propia):</strong> Olympics Athlete Events - Número de atletas por deporte</p>
        <p><strong>API 2 (GitHub):</strong> GitHub API - Número de repositorios por lenguaje de programación</p>
        <p><strong>Proxy:</strong> Endpoint propio <code>/api/github</code></p>
    </div>
    
    <div class="loading-overlay">
        <div class="spinner"></div>
        <p>Cargando datos combinados...</p>
    </div>
    
    {#if error}
        <div class="error">
            <p>❌ Error: {error}</p>
        </div>
    {:else}
        <!-- Gráfico de Barras Horizontales -->
        <div id="chart-container" style="height: 550px; width: 100%; margin-bottom: 2rem;"></div>
        
        <!-- Tabla de datos combinados -->
        <div class="table-container">
            <h3>📋 Datos combinados</h3>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Deporte Olímpico</th>
                            <th>Lenguaje de Programación</th>
                            <th>Atletas</th>
                            <th>Repositorios GitHub</th>
                            <th>Repositorios/Atleta</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each combinedData as item}
                            <tr>
                                <td><strong>{item.sport}</strong></td>
                                <td>{item.language}</td>
                                <td>{item.athletes.toLocaleString()}</td>
                                <td>{formatNumber(item.repos)}</td>
                                <td>{(item.repos / item.athletes).toFixed(1)}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    {/if}
    
    <div class="info">
        <h3>📖 Interpretación</h3>
        <ul>
            <li><strong>Tipo de gráfico:</strong> Bar (barras horizontales) con <strong>Highcharts</strong></li>
            <li><strong>Objetivo:</strong> Explorar correlación entre deportes populares y lenguajes de programación</li>
            <li><strong>Datos de Olympics:</strong> Número de atletas por deporte (tu API)</li>
            <li><strong>Datos de GitHub:</strong> Repositorios por lenguaje de programación (vía proxy)</li>
            <li><strong>Proxy implementado:</strong> Endpoint <code>/api/github</code> que redirige a GitHub API</li>
            <li><strong>Nota:</strong> Los repositorios están normalizados a la escala de atletas para visualización</li>
        </ul>
    </div>
</div>

<style>
    .integration-container {
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
        margin-bottom: 1rem;
    }
    
    .info-api {
        background: #f0f9ff;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
        font-size: 0.85rem;
        border-left: 4px solid #0284c7;
    }
    
    .info-api code {
        background: #e2e8f0;
        padding: 0.2rem 0.4rem;
        border-radius: 4px;
        font-size: 0.8rem;
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
        border: 4px solid #f3f3f3;
        border-top: 4px solid #0284c7;
        border-radius: 50%;
        width: 50px;
        height: 50px;
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
    
    .table-container {
        margin-top: 2rem;
        border-top: 1px solid #e2e8f0;
        padding-top: 1rem;
    }
    
    .table-wrapper {
        overflow-x: auto;
    }
    
    table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.85rem;
    }
    
    th, td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid #e2e8f0;
    }
    
    th {
        background: #f8fafc;
        font-weight: 600;
        color: #0369a1;
        position: sticky;
        top: 0;
    }
    
    tr:hover {
        background: #f0f9ff;
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