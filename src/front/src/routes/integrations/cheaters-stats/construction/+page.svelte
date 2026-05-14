<script>
    import { onMount, tick } from 'svelte';
    import { Chart } from 'frappe-charts';
    
    let loading = true;
    let error = null;
    let chart = null;
    let yearsList = [];
    
    async function loadInitialData() {
        console.log('Inicializando datos en Construction API...');
        
        try {
            const response = await fetch('https://sos2526-24.onrender.com/api/v1/international-construction-costs/LoadInitialData');
            
            if (response.status === 400) {
                const data = await response.json();
                console.log(data.message);
                return { alreadyInitialized: true };
            }
            
            if (response.ok) {
                const data = await response.json();
                console.log(data.message);
                return { initialized: true };
            }
        } catch (err) {
            console.warn('No se pudo inicializar:', err.message);
            return null;
        }
    }
    
    async function fetchConstructionData() {
        const response = await fetch('https://sos2526-24.onrender.com/api/v1/international-construction-costs?limit=200');
        return await response.json();
    }
    
    async function fetchCheatersData() {
        try {
            const response = await fetch('http://localhost:3000/api/v2/cheaters-stats?limit=200');
            if (response.ok) {
                const json = await response.json();
                return json.data || [];
            }
        } catch (err) {
            console.warn('No se pudo conectar al backend:', err.message);
        }
        
        try {
            const response = await fetch('/api/v2/cheaters-stats?limit=200');
            if (response.ok) {
                const json = await response.json();
                return json.data || [];
            }
        } catch (err) {
            console.warn('No se pudo conectar al proxy:', err.message);
        }
        
        return [];
    }
    
    function processConstructionData(constructionData) {
        const costByYear = {};
        const countByYear = {};
        
        constructionData.forEach(item => {
            const year = item.year;
            if (year && item.cost_usd_per_m2 !== undefined) {
                costByYear[year] = (costByYear[year] || 0) + item.cost_usd_per_m2;
                countByYear[year] = (countByYear[year] || 0) + 1;
            }
        });
        
        const avgCostByYear = {};
        Object.keys(costByYear).forEach(year => {
            avgCostByYear[year] = costByYear[year] / countByYear[year];
        });
        
        return avgCostByYear;
    }
    
    function processCheatersData(cheatersData) {
        const cheatersByYear = {};
        cheatersData.forEach(item => {
            const year = item.year;
            if (year) {
                cheatersByYear[year] = (cheatersByYear[year] || 0) + (item.cheater_report || 0);
            }
        });
        return cheatersByYear;
    }
    
    function prepareChartData(cheatersByYear, avgCostByYear) {
        const allYearsSet = new Set([...Object.keys(cheatersByYear), ...Object.keys(avgCostByYear)]);
        const allYears = Array.from(allYearsSet).sort((a, b) => a - b);
        
        const years = allYears.map(y => y.toString());
        const reportsData = allYears.map(y => cheatersByYear[y] || 0);
        const costData = allYears.map(y => avgCostByYear[y] || 0);
        
        return { years, reportsData, costData };
    }
    
    function renderBarChart(chartData) {
        const element = document.getElementById('chart');
        if (!element) return;
        
        if (chart) chart.destroy();
        
        chart = new Chart(element, {
            title: 'Reportes de Tramposos vs Coste de Construcción',
            data: {
                labels: chartData.years,
                datasets: [
                    {
                        name: 'Reportes de Tramposos',
                        values: chartData.reportsData,
                        chartType: 'bar',
                        color: '#7e22ce'
                    },
                    {
                        name: 'Coste Construcción (USD/m²)',
                        values: chartData.costData,
                        chartType: 'bar',
                        color: '#dc2626'
                    }
                ]
            },
            type: 'bar',
            height: 500,
            axisOptions: {
                xAxisMode: 'tick',
                yAxisMode: 'tick'
            },
            tooltipOptions: {
                formatTooltip: (x, y, datasetName) => {
                    if (datasetName.includes('Reportes')) {
                        return `${datasetName}: ${y.toLocaleString()}`;
                    } else {
                        return `${datasetName}: $${y.toFixed(0)}/m²`;
                    }
                }
            }
        });
    }
    
    onMount(async () => {
        await tick();
        
        try {
            await loadInitialData();
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const constructionData = await fetchConstructionData();
            const cheatersData = await fetchCheatersData();
            
            const avgCostByYear = processConstructionData(constructionData);
            const cheatersByYear = processCheatersData(cheatersData);
            
            const chartData = prepareChartData(cheatersByYear, avgCostByYear);
            yearsList = chartData.years;
            
            console.log('Años:', yearsList);
            console.log('Reportes:', chartData.reportsData);
            console.log('Costes:', chartData.costData);
            
            renderBarChart(chartData);
            
            loading = false;
            
        } catch (err) {
            console.error('Error:', err);
            error = err.message;
            loading = false;
        }
    });
</script>

<div class="container">
    <a href="/integrations/cheaters-stats" class="back-link">← Volver a Cheaters Stats</a>
    <h1>Construction Costs + Cheaters Stats</h1>
    <p class="subtitle">Bar Chart (Frappe Charts): Comparación de reportes vs coste de construcción por año</p>
    
    <div style="height: 550px; width: 100%;">
        <div id="chart"></div>
    </div>
    
    {#if loading}
        <div class="loading">Cargando datos...</div>
    {:else if error}
        <div class="error">Error: {error}</div>
    {:else}
        <div class="info-note">
            <p><strong>Bar Chart (Frappe Charts):</strong></p>
            <ul>
                <li><strong>Barras moradas:</strong> Reportes de tramposos</li>
                <li><strong>Barras rojas:</strong> Coste de construcción (USD/m²)</li>
                <li><strong>Eje X:</strong> Año</li>
                <li><strong>Eje Y:</strong> Cantidad de reportes / USD por m²</li>
            </ul>
            <p><strong>Años:</strong> {yearsList.length} años ({yearsList.join(', ')})</p>
            <p><strong>Coste máximo:</strong> ${Math.max(...(chartData?.costData || [0])).toFixed(0)}/m²</p>
            <p><strong>Reportes máximos:</strong> {Math.max(...(chartData?.reportsData || [0])).toLocaleString()}</p>
        </div>
    {/if}
</div>

<style>
    .container { max-width: 1000px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #fee2e2; }
    .back-link { color: #dc2626; text-decoration: none; display: inline-block; margin-bottom: 1rem; }
    .back-link:hover { text-decoration: underline; }
    h1 { color: #991b1b; margin: 0; }
    .subtitle { color: #666; margin-bottom: 1.5rem; }
    .loading { text-align: center; padding: 2rem; color: #dc2626; }
    .error { text-align: center; padding: 3rem; color: #dc2626; }
    .info-note { margin-top: 2rem; padding: 1rem; background: #fef2f2; border-radius: 8px; font-size: 0.85rem; color: #991b1b; border-left: 4px solid #dc2626; }
    .info-note ul { margin: 0.5rem 0; padding-left: 1.5rem; }
    .info-note li { margin: 0.3rem 0; }
    .info-note code { background: #fecaca; padding: 0.1rem 0.3rem; border-radius: 4px; }
</style>