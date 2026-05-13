<script>
    import { onMount } from 'svelte';
    import * as echarts from 'echarts';
    
    let loading = $state(true);
    let error = $state(null);
    let chart = $state(null);
    let combinedData = [];
    let summaryStats = $state({
        totalYears: 0,
        totalAthletes: 0,
        totalLaunches: 0,
        avgAthletes: 0,
        avgLaunches: 0
    });
    
    onMount(async () => {
        await fetchData();
    });
    
    async function fetchData() {
        try {
            loading = true;
            
            // 1. Obtener datos de Olympics
            console.log('[PASO 1] Cargando datos de Olympics...');
            const olympicsRes = await fetch('/api/v1/olympics-athlete-events?limit=5000');
            const olympicsData = await olympicsRes.json();
            const athletes = olympicsData.data || [];
            console.log('[PASO 1.1] Atletas recibidos:', athletes.length);
            
            const athletesByYear = {};
            athletes.forEach(ath => {
                const year = ath.year;
                if (year && year >= 2000 && year <= 2024) {
                    athletesByYear[year] = (athletesByYear[year] || 0) + 1;
                }
            });
            console.log('[PASO 1.2] Atletas por año:', athletesByYear);
            
            // 2. Obtener datos de SpaceX
            console.log('[PASO 2] Cargando datos de SpaceX...');
            const spacexRes = await fetch('https://api.spacexdata.com/v4/launches');
            const launches = await spacexRes.json();
            console.log('[PASO 2.1] Lanzamientos recibidos:', launches.length);
            
            const launchesByYear = {};
            launches.forEach(launch => {
                const date = new Date(launch.date_utc);
                const year = date.getFullYear();
                if (year >= 2000 && year <= 2024) {
                    launchesByYear[year] = (launchesByYear[year] || 0) + 1;
                }
            });
            console.log('[PASO 2.2] Lanzamientos por año:', launchesByYear);
            
            // 3. Combinar datos
            const allYears = new Set([...Object.keys(athletesByYear), ...Object.keys(launchesByYear)]);
            
            combinedData = Array.from(allYears)
                .map(year => ({
                    year: parseInt(year),
                    athletes: athletesByYear[year] || 0,
                    launches: launchesByYear[year] || 0
                }))
                .sort((a, b) => a.year - b.year);
            
            console.log('[PASO 3.1] Datos combinados:', combinedData.length, 'años');
            
            // 4. Estadísticas
            const totalAthletes = combinedData.reduce((sum, d) => sum + d.athletes, 0);
            const totalLaunches = combinedData.reduce((sum, d) => sum + d.launches, 0);
            
            summaryStats = {
                totalYears: combinedData.length,
                totalAthletes: totalAthletes,
                totalLaunches: totalLaunches,
                avgAthletes: (totalAthletes / combinedData.length).toFixed(0),
                avgLaunches: (totalLaunches / combinedData.length).toFixed(1)
            };
            
            setTimeout(() => {
                createSunburstChart();
            }, 100);
            
            loading = false;
            
            const overlay = document.querySelector('.loading-overlay');
            if (overlay) overlay.style.display = 'none';
            
        } catch (e) {
            console.error('[ERROR]', e.message);
            error = e.message;
            loading = false;
            const overlay = document.querySelector('.loading-overlay');
            if (overlay) overlay.style.display = 'none';
        }
    }
    
    function createSunburstChart() {
        const container = document.getElementById('sunburst-container');
        if (!container) return;
        
        if (chart) {
            chart.dispose();
        }
        
        // Agrupar por décadas para el sunburst
        const decadesData = {
            '2000-2004': { years: [2000, 2001, 2002, 2003, 2004], athletes: 0, launches: 0 },
            '2005-2009': { years: [2005, 2006, 2007, 2008, 2009], athletes: 0, launches: 0 },
            '2010-2014': { years: [2010, 2011, 2012, 2013, 2014], athletes: 0, launches: 0 },
            '2015-2019': { years: [2015, 2016, 2017, 2018, 2019], athletes: 0, launches: 0 },
            '2020-2024': { years: [2020, 2021, 2022, 2023, 2024], athletes: 0, launches: 0 }
        };
        
        // Calcular totales por década
        combinedData.forEach(item => {
            for (const [decade, data] of Object.entries(decadesData)) {
                if (data.years.includes(item.year)) {
                    data.athletes += item.athletes;
                    data.launches += item.launches;
                    break;
                }
            }
        });
        
        // Construir datos para Sunburst
        const sunburstData = [];
        
        for (const [decade, data] of Object.entries(decadesData)) {
            if (data.athletes > 0 || data.launches > 0) {
                // Obtener años de esa década
                const yearsChildren = [];
                const decadeYears = combinedData.filter(item => decadesData[decade].years.includes(item.year));
                
                for (const yearData of decadeYears) {
                    if (yearData.athletes > 0 || yearData.launches > 0) {
                        yearsChildren.push({
                            name: `${yearData.year}`,
                            value: yearData.athletes + yearData.launches,
                            athletes: yearData.athletes,
                            launches: yearData.launches,
                            itemStyle: {
                                color: yearData.launches > 10 ? '#f97316' : 
                                       yearData.launches > 5 ? '#fde047' : '#0284c7'
                            }
                        });
                    }
                }
                
                sunburstData.push({
                    name: decade,
                    value: data.athletes + data.launches,
                    athletes: data.athletes,
                    launches: data.launches,
                    children: yearsChildren.sort((a, b) => b.value - a.value)
                });
            }
        }
        
        chart = echarts.init(container);
        
        const option = {
            title: {
                text: 'Atletas Olimpicos vs Lanzamientos SpaceX',
                subtext: 'Gráfico Sunburst | Tamaño = Total (Atletas + Lanzamientos) | Color naranja = muchos lanzamientos',
                left: 'center',
                top: 5,
                textStyle: { fontSize: 16, color: '#0369a1', fontFamily: 'Arial, sans-serif' },
                subtextStyle: { fontSize: 12, color: '#666', fontFamily: 'Arial, sans-serif' }
            },
            tooltip: {
                trigger: 'item',
                formatter: function(params) {
                    if (params.treePathInfo && params.treePathInfo.length === 3) {
                        const data = params.data;
                        return `<b>Año: ${params.name}</b><br/>
                                Atletas: ${data.athletes?.toLocaleString() || 0}<br/>
                                Lanzamientos SpaceX: ${data.launches || 0}<br/>
                                Total: ${params.value.toLocaleString()}`;
                    } else if (params.treePathInfo && params.treePathInfo.length === 2) {
                        const data = params.data;
                        return `<b>${params.name}</b><br/>
                                Atletas: ${data.athletes?.toLocaleString() || 0}<br/>
                                Lanzamientos: ${data.launches || 0}<br/>
                                Total: ${params.value.toLocaleString()}`;
                    }
                    return `<b>${params.name}</b><br/>Total: ${params.value.toLocaleString()}`;
                }
            },
            series: [{
                type: 'sunburst',
                data: sunburstData,
                radius: [0, '90%'],
                center: ['50%', '55%'],
                emphasis: {
                    focus: 'descendant',
                    scale: true
                },
                label: {
                    rotate: 0,
                    fontSize: 11,
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: 'normal',
                    color: '#333',
                    textShadow: 'none'
                },
                levels: [
                    {
                        r0: '0%',
                        r: '30%',
                        itemStyle: {
                            borderRadius: 8,
                            borderWidth: 2,
                            borderColor: '#fff'
                        },
                        label: {
                            fontSize: 13,
                            fontWeight: 'bold',
                            color: '#0369a1'
                        }
                    },
                    {
                        r0: '30%',
                        r: '60%',
                        label: { fontSize: 10 },
                        itemStyle: { borderWidth: 1, borderColor: '#fff' }
                    },
                    {
                        r0: '60%',
                        r: '100%',
                        label: { fontSize: 9 },
                        itemStyle: { borderWidth: 1, borderColor: '#fff' }
                    }
                ],
                itemStyle: {
                    borderRadius: 6,
                    borderColor: '#fff',
                    borderWidth: 2,
                    shadowBlur: 10,
                    shadowColor: 'rgba(0, 0, 0, 0.1)'
                }
            }]
        };
        
        chart.setOption(option);
        window.addEventListener('resize', () => chart?.resize());
    }
</script>

<div class="integration-container">
    <h1>Atletas Olimpicos vs Lanzamientos SpaceX</h1>
    <p class="subtitle">Sunburst: Distribucion de atletas y lanzamientos por decada y año</p>
    
    <div class="info-api">
        <p><strong>API 1 (propia):</strong> Olympics Athlete Events - Atletas por año</p>
        <p><strong>API 2 (externa):</strong> SpaceX API - Lanzamientos por año</p>
        <p><strong>Widget:</strong> Sunburst con <strong>ECharts</strong></p>
        <p><strong>Combinacion:</strong> Sunburst + ECharts (no prohibida)</p>
        <p><strong>Interpretacion:</strong> Anillo interior = Decadas | Anillo exterior = Años | Tamano = Total (atletas + lanzamientos)</p>
    </div>
    
    <div class="loading-overlay">
        <div class="spinner"></div>
        <p>Cargando datos historicos...</p>
    </div>
    
    {#if error}
        <div class="error">Error: {error}</div>
    {/if}
    
    <div class="stats-container">
        <div class="stat-card">
            <div class="stat-value">{summaryStats.totalYears}</div>
            <div class="stat-label">Años analizados</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">{summaryStats.totalAthletes.toLocaleString()}</div>
            <div class="stat-label">Atletas totales</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">{summaryStats.totalLaunches}</div>
            <div class="stat-label">Lanzamientos totales</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">{summaryStats.avgLaunches}</div>
            <div class="stat-label">Avg lanzamientos/año</div>
        </div>
    </div>
    
    <div id="sunburst-container" style="height: 600px; width: 100%; margin-bottom: 2rem;"></div>
    

    
    <div class="info">
        <h3>Interpretacion</h3>
        <ul>
            <li><strong>Tipo:</strong> Sunburst (grafico de anillos) con <strong>ECharts</strong></li>
            <li><strong>Anillo interior:</strong> Decadas (2000-2004, 2005-2009, etc.)</li>
            <li><strong>Anillo exterior:</strong> Años especificos</li>
            <li><strong>Tamano del sector:</strong> Suma de atletas + lanzamientos</li>
            <li><strong>Color naranja:</strong> Años con muchos lanzamientos (>10)</li>
            <li><strong>Click:</strong> Haz click en cualquier sector para explorar</li>
            <li><strong>Combinacion:</strong> Sunburst + ECharts (no prohibida)</li>
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
    
    h1 { color: #0369a1; text-align: center; margin-bottom: 0.5rem; font-family: Arial, sans-serif; }
    .subtitle { text-align: center; color: #666; margin-bottom: 1rem; font-family: Arial, sans-serif; }
    
    .info-api {
        background: #f0f9ff;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
        font-size: 0.85rem;
        border-left: 4px solid #0284c7;
        font-family: Arial, sans-serif;
    }
    
    .loading-overlay {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
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
    
    .error { text-align: center; padding: 2rem; color: #dc2626; background: #fee2e2; border-radius: 8px; font-family: Arial, sans-serif; }
    
    .stats-container {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
    }
    
    .stat-card {
        background: white;
        border-radius: 12px;
        padding: 1rem 2rem;
        text-align: center;
        border: 1px solid #e2e8f0;
        min-width: 120px;
    }
    
    .stat-value { font-size: 2rem; font-weight: bold; color: #0369a1; display: block; font-family: Arial, sans-serif; }
    .stat-label { font-size: 0.75rem; color: #666; font-family: Arial, sans-serif; }
    
    .table-container {
        margin-top: 2rem;
        border-top: 1px solid #e2e8f0;
        padding-top: 1rem;
    }
    
    .table-container h3 { color: #0369a1; margin-bottom: 1rem; font-family: Arial, sans-serif; }
    .table-wrapper { overflow-x: auto; max-height: 400px; overflow-y: auto; }
    
    .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.85rem;
        font-family: Arial, sans-serif;
    }
    
    th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; font-weight: 600; color: #0369a1; position: sticky; top: 0; }
    tr:hover { background: #f0f9ff; }
    
    .has-launches { background: #fef3c7; }
    .launches-value { font-weight: bold; color: #f97316; }
    
    .info {
        margin-top: 2rem;
        padding: 1rem;
        background: #f0f9ff;
        border-radius: 12px;
        border: 1px solid #bae6fd;
    }
    
    .info h3 { color: #0369a1; margin-top: 0; font-family: Arial, sans-serif; }
    .info ul { margin: 0; padding-left: 1.5rem; }
    .info li { margin: 0.5rem 0; color: #333; font-family: Arial, sans-serif; }
</style>