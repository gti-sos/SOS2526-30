<script>
    import { onMount } from 'svelte';
    import * as echarts from 'echarts';
    
    let loading = $state(true);
    let error = $state(null);
    let chart = $state(null);
    // @ts-ignore
    let countriesData = $state([]);
    let summaryStats = $state({
        countries: 0,
        totalProtests: 0,
        totalViolence: 0,
        totalAthletes: 0,
        avgViolenceRate: 0
    });
    
    onMount(async () => {
        await fetchData();
    });
    
    async function fetchData() {
        try {
            loading = true;
            
            // Cargar datos iniciales
            await fetch('https://sos2526-10.onrender.com/api/v2/protests/loadInitialData');
            
            // Obtener datos de protests
            const protestsRes = await fetch('https://sos2526-10.onrender.com/api/v2/protests');
            const protestsData = await protestsRes.json();
            
            // Obtener datos de Olympics
            const olympicsRes = await fetch('/api/v1/olympics-athlete-events?limit=5000');
            const olympicsData = await olympicsRes.json();
            const athletes = olympicsData.data || [];
            
            // Contar atletas por país
            const athletesByCountry = {};
            // @ts-ignore
            athletes.forEach(ath => {
                const country = ath.team;
                if (country && country !== 'NA' && country !== 'Individual' && country !== 'Mixed team') {
                    // @ts-ignore
                    athletesByCountry[country] = (athletesByCountry[country] || 0) + 1;
                }
            });
            
            // Agrupar protestas por país
            const protestsByCountry = {};
            const violenceByCountry = {};
            
            // @ts-ignore
            protestsData.forEach(protest => {
                const country = protest.country;
                if (country) {
                    // @ts-ignore
                    if (!protestsByCountry[country]) {
                        // @ts-ignore
                        protestsByCountry[country] = 0;
                        // @ts-ignore
                        violenceByCountry[country] = 0;
                    }
                    // @ts-ignore
                    protestsByCountry[country]++;
                    if (protest.protesterviolence === 1) {
                        // @ts-ignore
                        violenceByCountry[country]++;
                    }
                }
            });
            
            // Combinar datos de países
            // @ts-ignore
            const commonCountries = Object.keys(athletesByCountry).filter(c => protestsByCountry[c]);
            
            const combined = commonCountries.map(country => ({
                country: country,
                // @ts-ignore
                athletes: athletesByCountry[country] || 0,
                // @ts-ignore
                protests: protestsByCountry[country] || 0,
                // @ts-ignore
                violence: violenceByCountry[country] || 0,
                // @ts-ignore
                violenceRate: protestsByCountry[country] ? (violenceByCountry[country] / protestsByCountry[country]) * 100 : 0
            }))
            .sort((a, b) => b.protests - a.protests);
            
            // Estadísticas
            const totalProtests = combined.reduce((sum, c) => sum + c.protests, 0);
            const totalViolence = combined.reduce((sum, c) => sum + c.violence, 0);
            const totalAthletes = combined.reduce((sum, c) => sum + c.athletes, 0);
            const avgViolenceRate = totalProtests > 0 ? (totalViolence / totalProtests * 100) : 0;
            
            summaryStats = {
                countries: combined.length,
                totalProtests: totalProtests,
                totalViolence: totalViolence,
                totalAthletes: totalAthletes,
                // @ts-ignore
                avgViolenceRate: avgViolenceRate.toFixed(1)
            };
            
            countriesData = combined.slice(0, 15);
            
            // Preparar datos para Graph (relación países - protestas)
            const topCountries = combined.slice(0, 10);
            
            // Nodos: países
            // @ts-ignore
            const nodes = topCountries.map((item, index) => ({
                id: item.country,
                name: item.country,
                symbolSize: Math.min(30 + item.protests / 200, 60),
                itemStyle: {
                    color: item.violenceRate > 60 ? '#dc2626' : item.violenceRate > 30 ? '#f97316' : '#10b981'
                },
                label: {
                    show: true,
                    formatter: '{b}',
                    position: 'right'
                }
            }));
            
            // Aristas: conexión entre países y un nodo central
            // @ts-ignore
            const links = topCountries.map((item, index) => ({
                source: item.country,
                target: 'Protestas',
                value: item.protests,
                lineStyle: {
                    width: Math.min(2 + item.protests / 500, 8),
                    color: '#0284c7',
                    curveness: 0.2
                }
            }));
            
            // Nodo central
            nodes.push({
                id: 'Protestas',
                name: 'Protestas',
                symbolSize: 80,
                itemStyle: { color: '#0369a1' },
                label: { show: true, formatter: 'Protestas', position: 'bottom' }
            });
            
            setTimeout(() => {
                createGraphChart(nodes, links, avgViolenceRate);
            }, 100);
            
            loading = false;
            
            const overlay = document.querySelector('.loading-overlay');
            // @ts-ignore
            if (overlay) overlay.style.display = 'none';
            
        } catch (e) {
            // @ts-ignore
            console.error('[ERROR]', e.message);
            // @ts-ignore
            error = e.message;
            loading = false;
            const overlay = document.querySelector('.loading-overlay');
            // @ts-ignore
            if (overlay) overlay.style.display = 'none';
        }
    }
    
    // @ts-ignore
    function createGraphChart(nodes, links, violenceRate) {
        const container = document.getElementById('graph-container');
        if (!container) {
            console.error('Contenedor no encontrado');
            return;
        }
        
        if (chart) {
            // @ts-ignore
            chart.dispose();
        }
        
        // @ts-ignore
        chart = echarts.init(container);
        
        const option = {
            title: {
                text: 'Relacion Paises - Protestas',
                subtext: `Tasa global de violencia: ${violenceRate.toFixed(1)}% | Tamano del circulo = Numero de protestas | Color = Tasa de violencia`,
                left: 'center',
                top: 0,
                textStyle: { fontSize: 16, color: '#0369a1' },
                subtextStyle: { fontSize: 12, color: '#666' }
            },
            tooltip: {
                trigger: 'item',
                // @ts-ignore
                formatter: function(params) {
                    if (params.dataType === 'node') {
                        const node = params.data;
                        const countryData = countriesData.find(c => c.country === node.name);
                        if (countryData && node.name !== 'Protestas') {
                            return `<b>${node.name}</b><br/>
                                    Protestas: ${countryData.protests.toLocaleString()}<br/>
                                    Protestas violentas: ${countryData.violence}<br/>
                                    Tasa violencia: ${countryData.violenceRate.toFixed(1)}%<br/>
                                    Atletas: ${countryData.athletes}`;
                        } else if (node.name === 'Protestas') {
                            return `<b>Nodo Central</b><br/>Conexion con los paises<br/>Total protestas: ${summaryStats.totalProtests.toLocaleString()}`;
                        }
                        return `<b>${node.name}</b>`;
                    } else {
                        return `<b>${params.data.source} → ${params.data.target}</b><br/>Protestas: ${params.data.value.toLocaleString()}`;
                    }
                }
            },
            series: [{
                type: 'graph',
                layout: 'force',
                force: {
                    repulsion: 500,
                    edgeLength: 200,
                    gravity: 0.1,
                    friction: 0.1,
                    layoutAnimation: true
                },
                data: nodes,
                links: links,
                roam: true,
                draggable: true,
                focusNodeAdjacency: true,
                edgeSymbol: ['none', 'arrow'],
                edgeSymbolSize: [0, 10],
                label: {
                    show: true,
                    position: 'right',
                    fontSize: 12,
                    offset: [5, 0]
                },
                emphasis: {
                    focus: 'adjacency',
                    lineStyle: {
                        width: 3
                    }
                },
                lineStyle: {
                    color: '#0284c7',
                    curveness: 0.3,
                    width: 2,
                    opacity: 0.7
                },
                edgeLabel: {
                    show: true,
                    // @ts-ignore
                    formatter: function(params) {
                        return params.data.value;
                    },
                    fontSize: 10
                },
                itemStyle: {
                    borderColor: '#fff',
                    borderWidth: 2,
                    shadowBlur: 10,
                    shadowColor: 'rgba(0, 0, 0, 0.3)'
                }
            }]
        };
        
        // @ts-ignore
        chart.setOption(option);
        // @ts-ignore
        window.addEventListener('resize', () => chart?.resize());
    }
</script>

<div class="integration-container">
    <h1>Protestas Globales vs Atletas Olimpicos</h1>
    <p class="subtitle">Grafico de relaciones: Paises conectados a sus protestas</p>
    
    <div class="info-api">
        <p><strong>API 1 (propia):</strong> Olympics Athlete Events - Atletas por pais</p>
        <p><strong>API 2 (companera):</strong> Protests Data - Grupo 10</p>
        <p><strong>Widget:</strong> Graph con <strong>ECharts</strong></p>
        <p><strong>Combinacion:</strong> Graph + ECharts (no prohibida)</p>
        <p><strong>Interpretacion:</strong> Nodo central = Protestas | Nodos alrededor = Paises | Tamano = Numero de protestas | Color rojo = alta violencia</p>
    </div>
    
    <div class="loading-overlay">
        <div class="spinner"></div>
        <p>Cargando datos...</p>
    </div>
    
    {#if error}
        <div class="error">Error: {error}</div>
    {/if}
    
    <div class="stats-container">
        <div class="stat-card">
            <div class="stat-value">{summaryStats.countries}</div>
            <div class="stat-label">Paises</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">{summaryStats.totalProtests.toLocaleString()}</div>
            <div class="stat-label">Protestas</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">{summaryStats.avgViolenceRate}%</div>
            <div class="stat-label">Tasa violencia</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">{summaryStats.totalAthletes}</div>
            <div class="stat-label">Atletas</div>
        </div>
    </div>
    
    <div id="graph-container" style="height: 600px; width: 100%; margin-bottom: 2rem;"></div>
    
    <div class="table-container">
        <h3>Datos por pais (Top 15)</h3>
        <div class="table-wrapper">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Pais</th>
                        <th>Protestas</th>
                        <th>Protestas violentas</th>
                        <th>Tasa violencia</th>
                        <th>Atletas Olimpicos</th>
                    </tr>
                </thead>
                <tbody>
                    {#each countriesData as item}
                        <tr>
                            <td><strong>{item.country}</strong></td>
                            <td>{item.protests.toLocaleString()}</td>
                            <td>{item.violence}</td>
                            <td class="violence-cell {item.violenceRate > 60 ? 'high' : item.violenceRate > 30 ? 'medium' : 'low'}">{item.violenceRate.toFixed(1)}%</td>
                            <td>{item.athletes.toLocaleString()}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>
    
    <div class="info">
        <h3>Interpretacion</h3>
        <ul>
            <li><strong>Tipo:</strong> Graph (grafo/relaciones) con <strong>ECharts</strong></li>
            <li><strong>Nodo central:</strong> Protestas (punto de conexion)</li>
            <li><strong>Nodos alrededor:</strong> Paises</li>
            <li><strong>Tamano del circulo:</strong> Numero de protestas</li>
            <li><strong>Color:</strong> Rojo = alta violencia, Verde = baja violencia</li>
            <li><strong>Grosor de la linea:</strong> Numero de protestas</li>
            <li><strong>Combinacion:</strong> Graph + ECharts (no prohibida)</li>
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
        color: #dc2626;
        background: #fee2e2;
        border-radius: 8px;
    }
    
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
    
    .stat-value {
        font-size: 2rem;
        font-weight: bold;
        color: #0369a1;
        display: block;
    }
    
    .stat-label {
        font-size: 0.75rem;
        color: #666;
    }
    
    .table-container {
        margin-top: 2rem;
        border-top: 1px solid #e2e8f0;
        padding-top: 1rem;
    }
    
    .table-container h3 {
        color: #0369a1;
        margin-bottom: 1rem;
    }
    
    .table-wrapper {
        overflow-x: auto;
        max-height: 400px;
        overflow-y: auto;
    }
    
    .data-table {
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
    
    .violence-cell {
        font-weight: bold;
    }
    
    .violence-cell.low {
        color: #10b981;
    }
    
    .violence-cell.medium {
        color: #f97316;
    }
    
    .violence-cell.high {
        color: #dc2626;
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