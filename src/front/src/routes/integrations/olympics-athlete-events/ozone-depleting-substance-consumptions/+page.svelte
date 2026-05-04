<script>
    import { onMount } from 'svelte';
    
    let loading = true;
    let error = null;
    let chart = null;
    let c3 = null;
    let chartData = { decades: [], consumption: [], athletes: [] };
    let selectedSubstance = 'hcfc';
    
    const substances = [
        { value: 'methyl_chloroform', label: 'Metil Cloroformo', color: '#ef4444' },
        { value: 'methyl_bromide', label: 'Bromuro de Metilo', color: '#f97316' },
        { value: 'hcfc', label: 'HCFC', color: '#eab308' },
        { value: 'carbon_tetrachloride', label: 'Tetracloruro de Carbono', color: '#22c55e' },
        { value: 'halon', label: 'Halón', color: '#06b6d4' },
        { value: 'cfc', label: 'CFC', color: '#8b5cf6' }
    ];
    
    onMount(async () => {
        const c3Module = await import('c3');
        c3 = c3Module.default || c3Module;
        await import('c3/c3.css');
        await fetchData();
    });
    
    async function fetchData() {
        try {
            loading = true;
            
            // 1. Obtener datos de Olympics
            console.log('Obteniendo datos de Olympics...');
            const resOlympics = await fetch('/api/v1/olympics-athlete-events?limit=2000');
            const olympicsData = await resOlympics.json();
            const athletes = olympicsData.data || [];
            console.log('Atletas recibidos:', athletes.length);
            
            // Contar atletas por decada
            const athletesByDecade = {};
            athletes.forEach(ath => {
                const year = ath.year;
                if (year && year >= 1900 && year <= 2020) {
                    const decade = Math.floor(year / 10) * 10;
                    athletesByDecade[decade] = (athletesByDecade[decade] || 0) + 1;
                }
            });
            console.log('Atletas por decada:', athletesByDecade);
            
            // 2. Obtener datos de Ozone
            console.log('Obteniendo datos de Ozone...');
            const resOzone = await fetch('https://sos2526-22.onrender.com/api/v1/ozone-depleting-substance-consumptions/loadInitialData');
            const ozoneData = await resOzone.json();
            console.log('Datos Ozone recibidos:', ozoneData.length);
            
            // 3. Agrupar consumo por decada
            const substanceByDecade = {};
            ozoneData.forEach(item => {
                const year = item.year;
                if (year) {
                    const decade = Math.floor(year / 10) * 10;
                    if (!substanceByDecade[decade]) {
                        substanceByDecade[decade] = {};
                        substances.forEach(s => substanceByDecade[decade][s.value] = 0);
                    }
                    substances.forEach(sub => {
                        const value = item[sub.value];
                        if (value !== undefined && value !== null && !isNaN(value)) {
                            substanceByDecade[decade][sub.value] += value;
                        }
                    });
                }
            });
            
            // 4. Preparar datos
            const sortedDecades = Object.keys(substanceByDecade)
                .map(Number)
                .sort((a, b) => a - b);
            
            chartData = {
                decades: sortedDecades.map(d => `${d}s`),
                consumption: sortedDecades.map(d => substanceByDecade[d][selectedSubstance] || 0),
                athletes: sortedDecades.map(d => athletesByDecade[d] || 0)
            };
            
            console.log('Datos:', chartData);
            
            await createChart();
            
            loading = false;
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
    
    async function createChart() {
        if (!c3 || chartData.decades.length === 0) return;
        
        const currentSubstance = substances.find(s => s.value === selectedSubstance);
        
        // Normalizar datos para mostrar ambos en misma escala
        const maxConsumption = Math.max(...chartData.consumption, 1);
        const maxAthletes = Math.max(...chartData.athletes, 1);
        
        const consumptionPercent = chartData.consumption.map(v => (v / maxConsumption) * 100);
        const athletesPercent = chartData.athletes.map(v => (v / maxAthletes) * 100);
        
        if (chart) {
            chart.destroy();
        }
        
        chart = c3.generate({
            bindto: '#step-chart',
            data: {
                columns: [
                    [`Consumo ${currentSubstance?.label} (%)`, ...consumptionPercent],
                    ['Atletas Olimpicos (%)', ...athletesPercent]
                ],
                type: 'step',
                colors: {
                    [`Consumo ${currentSubstance?.label} (%)`]: currentSubstance?.color || '#eab308',
                    'Atletas Olimpicos (%)': '#0284c7'
                },
                labels: false
            },
            axis: {
                x: {
                    type: 'category',
                    categories: chartData.decades,
                    label: { text: 'Decada', position: 'outer-center' },
                    tick: {
                        rotate: 45,
                        multiline: false,
                        culling: { max: 10 }
                    }
                },
                y: {
                    label: { text: 'Porcentaje del valor maximo (%)', position: 'outer-middle' },
                    min: 0,
                    max: 110,
                    padding: { top: 10, bottom: 0 }
                }
            },
            tooltip: {
                format: {
                    title: function(x) { return `Decada: ${chartData.decades[x]}`; },
                    value: function(value, ratio, id, index) {
                        if (id.includes('Consumo')) {
                            const realValue = chartData.consumption[index];
                            return `${value.toFixed(1)}% (${realValue.toLocaleString()} t)`;
                        } else {
                            const realValue = chartData.athletes[index];
                            return `${value.toFixed(1)}% (${realValue.toLocaleString()} atletas)`;
                        }
                    }
                }
            },
            grid: {
                y: { show: true }
            },
            legend: {
                position: 'bottom'
            },
            size: {
                height: 500
            }
        });
    }
    
    async function updateChart() {
        if (!chartData.decades.length || !c3) return;
        
        const currentSubstance = substances.find(s => s.value === selectedSubstance);
        
        const maxConsumption = Math.max(...chartData.consumption, 1);
        const maxAthletes = Math.max(...chartData.athletes, 1);
        
        const consumptionPercent = chartData.consumption.map(v => (v / maxConsumption) * 100);
        const athletesPercent = chartData.athletes.map(v => (v / maxAthletes) * 100);
        
        if (chart) {
            chart.load({
                columns: [
                    [`Consumo ${currentSubstance?.label} (%)`, ...consumptionPercent],
                    ['Atletas Olimpicos (%)', ...athletesPercent]
                ],
                colors: {
                    [`Consumo ${currentSubstance?.label} (%)`]: currentSubstance?.color || '#eab308',
                    'Atletas Olimpicos (%)': '#0284c7'
                }
            });
        }
    }
</script>

<div class="integration-container">
    <h1>Atletas Olimpicos vs Sustancias Agotadoras de Ozono</h1>
    <p class="subtitle">Step Chart: Evolucion escalonada del consumo por decada vs Numero de atletas</p>
    
    <div class="info-api">
        <p><strong>API 1 (propia):</strong> Olympics Athlete Events - Numero de atletas por decada</p>
        <p><strong>API 2 (companera):</strong> Ozone Depleting Substance - Grupo 22</p>
        <p><strong>Widget:</strong> Step Chart con <strong>C3.js</strong></p>
    </div>
    
    <div class="loading-overlay">
        <div class="spinner"></div>
        <p>Cargando datos...</p>
    </div>
    
    {#if error}
        <div class="error">
            <p>Error: {error}</p>
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
        
        <div id="step-chart" style="min-height: 550px; width: 100%; margin-bottom: 2rem;"></div>
        
        <div class="table-container">
            <h3>Datos combinados por decada</h3>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Decada</th>
                            <th>Atletas Olimpicos</th>
                            <th>Consumo ({substances.find(s => s.value === selectedSubstance)?.label})</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each chartData.decades as decade, i}
                            <tr>
                                <td><strong>{decade}</strong></td>
                                <td>{chartData.athletes[i].toLocaleString()} </td>
                                <td>{chartData.consumption[i].toLocaleString()} t</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    {/if}
    
    <div class="info">
        <h3>Interpretacion</h3>
        <ul>
            <li><strong>Tipo de grafico:</strong> Step Chart (escalonado) con <strong>C3.js</strong></li>
            <li><strong>Linea naranja escalonada:</strong> Consumo de la sustancia (%)</li>
            <li><strong>Linea azul escalonada:</strong> Numero de atletas olimpicos (%)</li>
            <li><strong>Forma escalonada:</strong> Muestra cambios bruscos entre decadas</li>
            <li><strong>Eje X:</strong> Decadas</li>
            <li><strong>Eje Y:</strong> Porcentaje del valor maximo (%)</li>
            <li><strong>Tooltip:</strong> Muestra valores reales (toneladas y atletas)</li>
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