<script>
    import { onMount } from 'svelte';
    import Highcharts from 'highcharts';
    
    let loading = $state(true);
    let error = $state(null);
    // @ts-ignore
    let combinedData = $state([]);
    let chartInitialized = false;
    
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
    
    // Agrupar lenguajes en 5 grupos para reducir peticiones
    const languageGroups = {
        'Group1': ['javascript', 'python'],
        'Group2': ['java', 'typescript'],
        'Group3': ['go', 'ruby'],
        'Group4': ['c++', 'rust'],
        'Group5': ['swift', 'kotlin']
    };
    
    onMount(() => {
        fetchCombinedData();
    });
    
    async function fetchCombinedData() {
        try {
            loading = true;
            
            // 1. Obtener datos de Olympics
            console.log('📡 Obteniendo datos de Olympics...');
            const olympicsRes = await fetch('/api/v1/olympics-athlete-events/loadInitialData?limit=1000');
            const olympicsData = await olympicsRes.json();
            const athletes = olympicsData.data || [];
            
            const sportCount = {};
            // @ts-ignore
            athletes.forEach(ath => {
                const sport = ath.sport;
                if (sport && sport !== 'NA') {
                    // @ts-ignore
                    sportCount[sport] = (sportCount[sport] || 0) + 1;
                }
            });
            
            // 2. Obtener datos de GitHub (SOLO 5 GRUPOS)
            const languages = {};
            let groupIndex = 0;
            const groupEntries = Object.entries(languageGroups);
            
            for (const [groupName, langList] of groupEntries) {
                groupIndex++;
                console.log(`\n📡 [Grupo ${groupIndex}/5] Consultando ${groupName}...`);
                
                for (const lang of langList) {
                    let success = false;
                    let retries = 0;
                    
                    while (!success && retries < 3) {
                        try {
                            const timestamp = Date.now();
                            const response = await fetch(`/api/github/search/repositories?q=language:${lang}&per_page=1&_=${timestamp}`);
                            
                            if (response.ok) {
                                const data = await response.json();
                                // @ts-ignore
                                languages[lang] = data.total_count || 0;
                                // @ts-ignore
                                console.log(`  ✅ ${lang}: ${languages[lang].toLocaleString()} repos`);
                                success = true;
                            } else if (response.status === 403) {
                                console.warn(`  ⚠️ ${lang}: Rate limit, esperando 8 segundos...`);
                                await new Promise(r => setTimeout(r, 8000));
                                retries++;
                            } else {
                                console.warn(`  ⚠️ ${lang}: error ${response.status}`);
                                // @ts-ignore
                                languages[lang] = 0;
                                success = true;
                            }
                        } catch (e) {
                            console.error(`  ❌ Error con ${lang}:`, e);
                            retries++;
                            await new Promise(r => setTimeout(r, 5000));
                        }
                    }
                    
                    if (!success) {
                        console.log(`  ❌ ${lang}: 0 repos después de reintentos`);
                        // @ts-ignore
                        languages[lang] = 0;
                    }
                    
                    // Esperar 2 segundos entre lenguajes del mismo grupo
                    if (langList.indexOf(lang) < langList.length - 1) {
                        await new Promise(r => setTimeout(r, 2000));
                    }
                }
                
                // Esperar 5 segundos entre grupos (excepto después del último)
                if (groupIndex < groupEntries.length) {
                    console.log(`⏳ Esperando 5 segundos antes del siguiente grupo...\n`);
                    await new Promise(r => setTimeout(r, 5000));
                }
            }
            
            // 3. Combinar datos
            combinedData = Object.entries(sportToLanguage)
                // @ts-ignore
                .filter(([sport]) => sportCount[sport] > 0)
                .map(([sport, language]) => ({
                    sport: sport,
                    language: language,
                    // @ts-ignore
                    athletes: sportCount[sport] || 0,
                    // @ts-ignore
                    repos: languages[language.toLowerCase()] || 0
                }))
                .sort((a, b) => b.athletes - a.athletes);
            
            console.log('\n✅ Datos combinados:', combinedData);
            loading = false;
            
            setTimeout(() => {
                initChart();
            }, 200);
            
            const overlay = document.querySelector('.loading-overlay');
            // @ts-ignore
            if (overlay) overlay.style.display = 'none';
            
        } catch (e) {
            console.error('❌ Error:', e);
            // @ts-ignore
            error = e.message;
            loading = false;
            const overlay = document.querySelector('.loading-overlay');
            // @ts-ignore
            if (overlay) overlay.style.display = 'none';
        }
    }
    
    async function initChart() {
        console.log('📊 Iniciando gráfico...');
        
        if (combinedData.length === 0) {
            console.log('⚠️ No hay datos para el gráfico');
            return;
        }
        
        if (chartInitialized) {
            console.log('⚠️ Gráfico ya inicializado');
            return;
        }
        
        const container = document.getElementById('chart-container');
        if (!container) {
            console.log('⚠️ Contenedor no encontrado, reintentando...');
            setTimeout(() => initChart(), 500);
            return;
        }
        
        try {
            // Preparar datos para el gráfico
            const chartData = combinedData.map(d => ({ 
                x: d.athletes, 
                y: d.repos, 
                name: d.sport,
                language: d.language 
            }));
            
            console.log('📊 Creando gráfico con datos:', chartData);
            
            // @ts-ignore
            Highcharts.chart('chart-container', {
                accessibility: { enabled: false },
                chart: { 
                    type: 'scatter', 
                    zoomType: 'xy', 
                    height: 500
                },
                title: { text: 'Relación: Atletas Olímpicos vs Repositorios GitHub' },
                xAxis: { 
                    title: { text: 'Número de Atletas' },
                    labels: { format: '{value}' }
                },
                yAxis: { 
                    title: { text: 'Repositorios GitHub' },
                    labels: { 
                        formatter: function() { 
                            // @ts-ignore
                            if (this.value >= 1000000) return (this.value / 1000000).toFixed(1) + 'M';
                            // @ts-ignore
                            if (this.value >= 1000) return (this.value / 1000).toFixed(1) + 'K';
                            return this.value;
                        } 
                    }
                },
                tooltip: { 
                    pointFormat: '<b>{point.name}</b><br/>Atletas: {point.x}<br/>Repositorios: {point.y:,.0f}' 
                },
                series: [{
                    name: 'Deportes',
                    data: chartData,
                    color: '#0284c7',
                    marker: { radius: 8, symbol: 'circle' }
                }]
            });
            
            chartInitialized = true;
            console.log('✅ Gráfico inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando el gráfico:', error);
        }
    }
    
    // @ts-ignore
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
        <p><strong>Optimización:</strong> 5 grupos de lenguajes para evitar rate limit de GitHub</p>
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
        <!-- Gráfico Scatter -->
        <div id="chart-container" style="height: 500px; width: 100%; margin-bottom: 2rem;"></div>
        
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
            <li><strong>Objetivo:</strong> Explorar correlación entre deportes populares y lenguajes de programación</li>
            <li><strong>Datos de Olympics:</strong> Número de atletas por deporte (tu API)</li>
            <li><strong>Datos de GitHub:</strong> Repositorios por lenguaje de programación (vía proxy)</li>
            <li><strong>Proxy implementado:</strong> Endpoint <code>/api/github</code> que redirige a GitHub API</li>
            <li><strong>Gráfico:</strong> Scatter (dispersión) - No es tipo "line"</li>
            <li><strong>Optimización:</strong> 5 grupos de lenguajes con delays de 5 segundos entre grupos</li>
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