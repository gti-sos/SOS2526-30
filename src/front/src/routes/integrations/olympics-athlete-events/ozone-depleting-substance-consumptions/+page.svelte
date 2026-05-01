<script>
// @ts-nocheck

    import { onMount } from 'svelte';
    
    let loading = true;
    let error = null;
    let combinedData = [];
    let selectedSubstance = 'hcfc';
    let chart = null;
    
    const substances = [
        { value: 'methyl_chloroform', label: 'Metil Cloroformo', color: '#ef4444' },
        { value: 'methyl_bromide', label: 'Bromuro de Metilo', color: '#f97316' },
        { value: 'hcfc', label: 'HCFC', color: '#eab308' },
        { value: 'carbon_tetrachloride', label: 'Tetracloruro de Carbono', color: '#22c55e' },
        { value: 'halon', label: 'Halón', color: '#06b6d4' },
        { value: 'cfc', label: 'CFC', color: '#8b5cf6' }
    ];
    
    onMount(() => {
        fetchData();
    });
    
    async function fetchData() {
        try {
            loading = true;
            
            // 1. Obtener datos de Olympics (tus datos) - atletas por año
            console.log('Obteniendo datos de Olympics...');
            const resOlympics = await fetch('/api/v1/olympics-athlete-events?limit=2000');
            const olympicsData = await resOlympics.json();
            const athletes = olympicsData.data || [];
            console.log('Atletas recibidos:', athletes.length);
            
            // Contar atletas por año
            const athletesByYear = {};
            athletes.forEach(ath => {
                const year = ath.year;
                if (year && year >= 1900 && year <= 2020) {
                    athletesByYear[year] = (athletesByYear[year] || 0) + 1;
                }
            });
            console.log('Atletas por año:', athletesByYear);
            
            // 2. Obtener datos de Ozone (compañera)
            console.log('Obteniendo datos de Ozone...');
            const resOzone = await fetch('https://sos2526-22.onrender.com/api/v1/ozone-depleting-substance-consumptions/loadInitialData');
            const ozoneData = await resOzone.json();
            console.log('Datos Ozone recibidos:', ozoneData.length);
            
            // 3. Agrupar consumo por año
            const substanceByYear = {};
            ozoneData.forEach(item => {
                const year = item.year;
                if (year) {
                    if (!substanceByYear[year]) {
                        substanceByYear[year] = {};
                        substances.forEach(s => substanceByYear[year][s.value] = 0);
                    }
                    substances.forEach(sub => {
                        const value = item[sub.value];
                        if (value !== undefined && value !== null && !isNaN(value)) {
                            substanceByYear[year][sub.value] += value;
                        }
                    });
                }
            });
            console.log('Sustancias por año:', substanceByYear);
            
            // 4. Combinar datos por año
            const allYears = new Set([...Object.keys(athletesByYear), ...Object.keys(substanceByYear)]);
            combinedData = Array.from(allYears)
                .map(year => ({
                    year: parseInt(year),
                    athletes: athletesByYear[year] || 0,
                    substances: substanceByYear[year] || {}
                }))
                .sort((a, b) => a.year - b.year);
            
            console.log('Datos combinados:', combinedData);
            
            await createChart();
            
            // FORZAR CIERRE DEL OVERLAY
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
    
    async function createChart() {
        const currentSubstance = substances.find(s => s.value === selectedSubstance);
        
        // Preparar datos para scatter - SOLO años que tienen datos de sustancias
        const scatterData = combinedData
            .filter(item => item.substances[selectedSubstance] !== undefined && 
                   item.substances[selectedSubstance] !== null &&
                   item.substances[selectedSubstance] !== 0)
            .map(item => ({
                x: item.year,
                y: item.substances[selectedSubstance],
                athletes: item.athletes,
                year: item.year
            }));
        
        console.log('Datos para scatter:', scatterData);
        
        if (scatterData.length === 0) {
            console.warn('No hay datos para mostrar');
            return;
        }
        
        const Highcharts = await import('highcharts');
        const HC = Highcharts.default;
        
        if (chart) {
            chart.destroy();
        }
        
        chart = HC.chart('scatter-container', {
            chart: {
                type: 'scatter',
                zoomType: 'xy',
                height: 500,
                backgroundColor: '#ffffff'
            },
            title: {
                text: `Relación: Años vs Consumo de ${currentSubstance?.label}`,
                style: { fontSize: '16px' }
            },
            subtitle: {
                text: 'Cada punto representa un año | El tamaño del punto indica número de atletas',
                style: { fontSize: '12px' }
            },
            xAxis: {
                title: { text: 'Año' },
                tickInterval: 10,
                gridLineWidth: 1,
                gridLineColor: '#e2e8f0'
            },
            yAxis: {
                title: { text: `Consumo de ${currentSubstance?.label} (toneladas)` },
                gridLineWidth: 1,
                gridLineColor: '#e2e8f0'
            },
            tooltip: {
                pointFormat: `
                    <b>Año: {point.year}</b><br/>
                    Consumo: {point.y} t<br/>
                    Atletas Olímpicos: {point.athletes}
                `
            },
            plotOptions: {
                scatter: {
                    marker: {
                        radius: 8,
                        symbol: 'circle',
                        states: {
                            hover: {
                                enabled: true,
                                lineColor: 'black',
                                lineWidth: 2
                            }
                        }
                    }
                }
            },
            series: [{
                name: currentSubstance?.label,
                data: scatterData,
                color: currentSubstance?.color
            }]
        });
    }
    
    async function updateChart() {
        await createChart();
    }
    
    function formatNumber(num) {
        if (num === undefined || num === null) return 'N/A';
        if (num > 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num > 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toLocaleString();
    }
</script>

<div class="integration-container">
    <h1>🏅 Atletas Olímpicos vs 🌍 Sustancias Agotadoras de Ozono</h1>
    <p class="subtitle">Relación por año entre consumo de sustancias contaminantes y número de atletas</p>
    
    <div class="info-api">
        <p><strong>API 1 (propia):</strong> Olympics Athlete Events - <code>/api/v2/olympics-athlete-events</code></p>
        <p><strong>API 2 (compañera):</strong> Ozone Depleting Substance - <code>https://sos2526-22.onrender.com/api/v1/...</code></p>
        <p><strong>Integración:</strong> Datos combinados por año</p>
    </div>
    
    <!-- Overlay de carga -->
    <div class="loading-overlay">
        <div class="spinner"></div>
        <p>Cargando y combinando datos...</p>
    </div>
    
    {#if error}
        <div class="error">
            <p>❌ Error: {error}</p>
        </div>
    {:else}
        <div class="selector">
            <label>Seleccionar sustancia contaminante:</label>
            <div class="substance-buttons">
                {#each substances as s}
                    <button
                        class="substance-btn {selectedSubstance === s.value ? 'active' : ''}"
                        style="border-bottom-color: {s.color}"
                        onclick={() => { selectedSubstance = s.value; updateChart(); }}>
                        {s.label}
                    </button>
                {/each}
            </div>
        </div>
        
        <div id="scatter-container" style="height: 550px; width: 100%; margin-bottom: 2rem;"></div>
        
        <div class="table-container">
            <h3>📋 Datos combinados por año</h3>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Año</th>
                            <th>Atletas Olímpicos</th>
                            <th>HCFC (t)</th>
                            <th>CFC (t)</th>
                            <th>Halón (t)</th>
                            <th>Metil Cloroformo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each combinedData as item}
                            <tr>
                                <td><strong>{item.year}</strong></td>
                                <td>{item.athletes}</td>
                                <td>{formatNumber(item.substances.hcfc)}</td>
                                <td>{formatNumber(item.substances.cfc)}</td>
                                <td>{formatNumber(item.substances.halon)}</td>
                                <td>{formatNumber(item.substances.methyl_chloroform)}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
            <p class="table-info">Total de años: {combinedData.length}</p>
        </div>
    {/if}
    
    <div class="info">
        <h3>📖 Interpretación de la integración</h3>
        <ul>
            <li><strong>Tipo de gráfico:</strong> Scatter (dispersión) con <strong>Highcharts</strong></li>
            <li><strong>Cada punto:</strong> Representa un año específico</li>
            <li><strong>Eje X:</strong> Año (1900-2020)</li>
            <li><strong>Eje Y:</strong> Consumo de sustancia contaminante (toneladas)</li>
            <li><strong>Tooltip:</strong> Muestra también el número de atletas de ese año</li>
            <li><strong>Datos combinados:</strong> Se agruparon por año desde ambas fuentes</li>
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
    
    .selector {
        margin-bottom: 1.5rem;
    }
    
    .selector label {
        display: block;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: #0369a1;
    }
    
    .substance-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }
    
    .substance-btn {
        padding: 0.5rem 1rem;
        border: none;
        background: #f1f5f9;
        cursor: pointer;
        border-radius: 6px;
        font-size: 0.85rem;
        transition: all 0.2s;
        border-bottom: 3px solid transparent;
    }
    
    .substance-btn:hover {
        background: #e2e8f0;
    }
    
    .substance-btn.active {
        background: #e0f2fe;
        font-weight: bold;
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
    
    .table-container h3 {
        color: #0369a1;
        margin-bottom: 1rem;
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
    
    .table-info {
        margin-top: 1rem;
        font-size: 0.85rem;
        color: #666;
        text-align: right;
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