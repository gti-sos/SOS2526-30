<script>
    import { onMount } from 'svelte';

    let error = $state('');
    let loading = $state(true);
    
    // Controla qué pestaña está activa (por defecto la primera de SOS)
    let activeTab = $state('sos1'); 

    onMount(() => {
        setTimeout(async () => {
            try {
                // 1. Fetch a las APIs de SOS
                const res1 = await fetch('https://sos2526-27.onrender.com/api/v1/world-hydroelectric-plants');
                const res2 = await fetch('https://sos2526-24.onrender.com/api/v2/recreation-culture-expenditure');
                
                if (!res1.ok || !res2.ok) throw new Error("Error al contactar con las APIs externas");

                const data1 = await res1.json();
                const data2 = await res2.json();

                // Función extractora de datos
                const extractData = (data) => {
                    let labels = [];
                    let values = [];
                    let valName = 'Valor';
                    if (data && data.length > 0) {
                        let sKey = Object.keys(data[0]).find(k => typeof data[0][k] === 'string') || Object.keys(data[0])[0];
                        let nKey = Object.keys(data[0]).find(k => typeof data[0][k] === 'number' && k !== 'year' && k !== 'id') || Object.keys(data[0])[1];
                        valName = nKey;
                        data.slice(0, 8).forEach(d => {
                            labels.push(String(d[sKey]));
                            values.push(Number(d[nKey]));
                        });
                    }
                    return { labels, values, valName };
                };

                const chartData1 = extractData(data1);
                const chartData2 = extractData(data2);

                // ==========================================
                // GRÁFICA 1: TREEMAP (SOS Grupo 27)
                // ==========================================
                const treemapData = chartData1.labels.map((label, index) => ({
                    x: label,
                    y: chartData1.values[index]
                }));

                const optionsTreemap = {
                    series: [{ data: treemapData }],
                    chart: { height: 400, type: 'treemap', toolbar: { show: false } },
                    colors: ['#7e22ce', '#9333ea', '#a855f7', '#c084fc', '#d8b4fe'],
                    plotOptions: { treemap: { distributed: true, enableShades: false } },
                    tooltip: { y: { formatter: (val) => val + " " + chartData1.valName } }
                };
                // @ts-ignore
                const chart1 = new window.ApexCharts(document.querySelector("#treemap-chart"), optionsTreemap);
                chart1.render();

                // ==========================================
                // GRÁFICA 2: FUNNEL (SOS Grupo 24)
                // ==========================================
                // @ts-ignore
                const chart2 = window.echarts.init(document.getElementById('funnel-chart'));
                
                const funnelData = chartData2.labels.map((label, index) => ({
                    value: chartData2.values[index],
                    name: label
                }));

                const optionsFunnel = {
                    tooltip: { trigger: 'item', formatter: '{b} : {c}' },
                    color: ['#7e22ce', '#9333ea', '#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff'],
                    series: [{
                        name: chartData2.valName,
                        type: 'funnel',
                        left: '10%', top: 20, bottom: 20, width: '80%',
                        sort: 'descending', gap: 2,
                        label: { show: true, position: 'inside' },
                        data: funnelData
                    }]
                };
                chart2.setOption(optionsFunnel);

                loading = false;

            } catch (err) {
                console.error(err);
                error = err.message;
                loading = false;
            }
        }, 500);
    });
</script>

<svelte:head>
    <title>Integraciones APIs</title>
    <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js"></script>
</svelte:head>

<div class="integrations-page">
    <div class="header">
        <h1>🔌 Panel de Integraciones</h1>
        <p class="subtitle">Navega por las 5 APIs integradas usando el menú</p>
        <div class="nav-links">
            <a href="/analytics/esportsgrowth-stats" class="link-btn-back">Volver a mis Analíticas</a>
        </div>
    </div>

    <!-- MENÚ DE 5 BOTONES -->
    <div class="tabs-menu">
        <button class="tab-btn {activeTab === 'sos1' ? 'active' : ''}" onclick={() => activeTab = 'sos1'}>
            🎓 API SOS 27
        </button>
        <button class="tab-btn {activeTab === 'sos2' ? 'active' : ''}" onclick={() => activeTab = 'sos2'}>
            🎭 API SOS 24
        </button>
        <button class="tab-btn {activeTab === 'ext1' ? 'active' : ''}" onclick={() => activeTab = 'ext1'}>
            🌍 Externa 1 (Proxy)
        </button>
        <button class="tab-btn {activeTab === 'ext2' ? 'active' : ''}" onclick={() => activeTab = 'ext2'}>
            🌤️ Externa 2
        </button>
        <button class="tab-btn {activeTab === 'ext3' ? 'active' : ''}" onclick={() => activeTab = 'ext3'}>
            🚀 Externa 3
        </button>
    </div>

    {#if loading}
        <div class="loading">
            <div class="spinner"></div>
            <p>Cargando integraciones...</p>
        </div>
    {/if}

    {#if error}
        <div class="error">
            <p>❌ Hubo un problema: {error}</p>
        </div>
    {/if}

    <!-- CONTENEDOR DE PESTAÑAS -->
    <div class="tabs-container">
        
        <!-- PESTAÑA 1: SOS Grupo 27 -->
        <div class="tab-panel {activeTab === 'sos1' ? 'active' : ''}">
            <div class="chart-card">
                <h3>Plantas Hidroeléctricas Mundiales</h3>
                <span class="badge">API Grupo 27</span>
                <span class="badge library">ApexCharts | Treemap</span>
                <div id="treemap-chart" class="chart-container"></div>
                <p class="desc">Distribución en mapa de árbol de los valores de la API del grupo 27.</p>
            </div>
        </div>

        <!-- PESTAÑA 2: SOS Grupo 24 -->
        <div class="tab-panel {activeTab === 'sos2' ? 'active' : ''}">
            <div class="chart-card">
                <h3>Gasto en Cultura y Recreación</h3>
                <span class="badge">API Grupo 24</span>
                <span class="badge library">Apache ECharts | Funnel</span>
                <div id="funnel-chart" class="chart-container"></div>
                <p class="desc">Distribución en forma de embudo usando los datos de la API del grupo 24.</p>
            </div>
        </div>

        <!-- PESTAÑA 3: Externa 1 (Proxy) -->
        <div class="tab-panel {activeTab === 'ext1' ? 'active' : ''}">
            <div class="chart-card placeholder-card">
                <h3>🛠️ API Externa 1 (Con Proxy)</h3>
                <p>Aquí irá la integración que pasa a través de nuestro Backend.</p>
            </div>
        </div>

        <!-- PESTAÑA 4: Externa 2 -->
        <div class="tab-panel {activeTab === 'ext2' ? 'active' : ''}">
            <div class="chart-card placeholder-card">
                <h3>🛠️ API Externa 2</h3>
                <p>Aquí irá nuestra segunda API externa.</p>
            </div>
        </div>

        <!-- PESTAÑA 5: Externa 3 -->
        <div class="tab-panel {activeTab === 'ext3' ? 'active' : ''}">
            <div class="chart-card placeholder-card">
                <h3>🛠️ API Externa 3</h3>
                <p>Aquí irá nuestra tercera API externa.</p>
            </div>
        </div>

    </div>
</div>

<style>
    .integrations-page { max-width: 1000px; margin: 0 auto; padding: 2rem; font-family: sans-serif; }
    .header { text-align: center; margin-bottom: 2rem; }
    h1 { color: #7e22ce; margin-bottom: 0.5rem; }
    .subtitle { color: #64748b; font-size: 1.1rem; }
    
    .nav-links { margin-top: 1rem; }
    .link-btn-back { display: inline-block; background: #f8fafc; color: #475569; padding: 0.5rem 1rem; border-radius: 6px; text-decoration: none; font-size: 0.9rem; border: 1px solid #cbd5e1; transition: 0.2s; }
    .link-btn-back:hover { background: #e2e8f0; }

    /* ESTILOS DEL MENÚ DE BOTONES */
    .tabs-menu { display: flex; justify-content: center; gap: 0.8rem; flex-wrap: wrap; margin-bottom: 2.5rem; }
    .tab-btn { background: #ffffff; border: 2px solid #e9d5ff; color: #6b7280; padding: 0.8rem 1.5rem; border-radius: 12px; font-weight: bold; cursor: pointer; transition: all 0.2s; font-size: 1rem; }
    .tab-btn:hover { border-color: #a855f7; color: #7e22ce; }
    .tab-btn.active { background: #7e22ce; color: white; border-color: #7e22ce; box-shadow: 0 4px 6px -1px rgba(126, 34, 206, 0.3); }

    /* ESTILOS DE LOS PANELES Y TRUCO CSS */
    .tabs-container { position: relative; width: 100%; min-height: 500px; }
    .tab-panel { 
        position: absolute; 
        top: 0; left: 0; right: 0;
        visibility: hidden; 
        opacity: 0; 
        pointer-events: none; 
        transition: opacity 0.3s ease-in-out; 
    }
    .tab-panel.active { 
        position: relative; 
        visibility: visible; 
        opacity: 1; 
        pointer-events: auto; 
    }

    .chart-card { background: white; padding: 2rem; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(126, 34, 206, 0.1); border: 1px solid #e9d5ff; text-align: center; }
    .chart-card h3 { color: #334155; margin-top: 0; margin-bottom: 1rem; }
    .placeholder-card { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; background: #f8fafc; border: 2px dashed #cbd5e1; color: #64748b; }
    
    .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.8rem; font-weight: bold; background: #e2e8f0; color: #475569; margin-bottom: 1rem; margin-right: 0.5rem; }
    .badge.library { background: #d8b4fe; color: #581c87; }

    .chart-container { height: 400px; width: 100%; margin-top: 1rem; }
    .desc { font-size: 0.9rem; color: #64748b; margin-top: 1rem; border-top: 1px dashed #cbd5e1; padding-top: 1rem; }

    .loading { text-align: center; padding: 2rem; }
    .spinner { border: 4px solid #f3e8ff; border-top: 4px solid #7e22ce; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .error { background: #fee2e2; color: #dc2626; padding: 1rem; border-radius: 8px; text-align: center; font-weight: bold; margin-bottom: 2rem; }
</style>