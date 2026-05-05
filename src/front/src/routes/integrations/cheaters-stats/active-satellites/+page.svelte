<script>
    import { onMount, tick } from 'svelte';
    import { Chart } from 'frappe-charts';
    
    let loading = true;
    let error = null;
    let chart = null;
    let yearsList = [];
    
    async function loadInitialData() {
        console.log('🛰️ Inicializando datos en Active Satellites API...');
        
        try {
            const response = await fetch('https://sos2526-14-yjus.onrender.com/api/v1/active-satellites/LoadInitialData');
            
            if (response.status === 400) {
                const data = await response.json();
                console.log('ℹ️', data.message);
                return { alreadyInitialized: true };
            }
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅', data.message);
                return { initialized: true };
            }
        } catch (err) {
            console.warn('⚠️ No se pudo inicializar:', err.message);
            return null;
        }
    }
    
    async function fetchSatellitesData() {
        const response = await fetch('https://sos2526-14-yjus.onrender.com/api/v1/active-satellites?limit=200');
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
    
    function processSatellitesData(satellitesData) {
        const satellitesByYear = {};
        
        satellitesData.forEach(item => {
            let year = item.launch_year || item.year || item.launchYear || item.date_launch || item.launch_date;
            
            if (year && typeof year === 'string' && year.includes('-')) {
                year = year.split('-')[0];
            }
            
            if (year && !isNaN(parseInt(year))) {
                year = parseInt(year).toString();
                satellitesByYear[year] = (satellitesByYear[year] || 0) + 1;
            }
        });
        
        return satellitesByYear;
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
    
    function prepareChartData(cheatersByYear, satellitesByYear) {
        const allYearsSet = new Set([...Object.keys(cheatersByYear), ...Object.keys(satellitesByYear)]);
        const allYears = Array.from(allYearsSet).sort((a, b) => a - b);
        
        const years = allYears.map(y => y.toString());
        const reportsData = allYears.map(y => cheatersByYear[y] || 0);
        const satellitesData = allYears.map(y => satellitesByYear[y] || 0);
        
        return { years, reportsData, satellitesData };
    }
    
    function renderPieChart(chartData) {
        const element = document.getElementById('chart');
        if (!element) return;
        
        if (chart) chart.destroy();
        
        // Para pie chart, necesitamos un solo dataset con valores agregados
        // Agregamos el total de reportes y satélites
        const totalReports = chartData.reportsData.reduce((a, b) => a + b, 0);
        const totalSatellites = chartData.satellitesData.reduce((a, b) => a + b, 0);
        
        chart = new Chart(element, {
            title: '🛰️ Total Reportes vs Total Satélites Lanzados',
            data: {
                labels: ['📊 Reportes de Tramposos', '🛰️ Satélites Lanzados'],
                datasets: [
                    {
                        name: 'Totales',
                        values: [totalReports, totalSatellites],
                        chartType: 'pie',
                        colors: ['#7e22ce', '#3b82f6']
                    }
                ]
            },
            type: 'pie',
            height: 500,
            tooltipOptions: {
                formatTooltip: (x, y, datasetName) => {
                    return `${x}: ${y.toLocaleString()}`;
                }
            }
        });
    }
    
    onMount(async () => {
        await tick();
        
        try {
            await loadInitialData();
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const satellitesData = await fetchSatellitesData();
            const cheatersData = await fetchCheatersData();
            
            const satellitesByYear = processSatellitesData(satellitesData);
            const cheatersByYear = processCheatersData(cheatersData);
            
            const chartData = prepareChartData(cheatersByYear, satellitesByYear);
            yearsList = chartData.years;
            
            console.log('📅 Años:', yearsList);
            console.log('📊 Reportes:', chartData.reportsData);
            console.log('🛰️ Satélites:', chartData.satellitesData);
            
            renderPieChart(chartData);
            
            loading = false;
            
        } catch (err) {
            console.error('❌ Error:', err);
            error = err.message;
            loading = false;
        }
    });
</script>

<div class="container">
    <a href="/integrations/cheaters-stats" class="back-link">← Volver a Cheaters Stats</a>
    <h1>🛰️ Active Satellites + Cheaters Stats</h1>
    <p class="subtitle">Pie Chart (Frappe Charts): Total de reportes vs total de satélites lanzados</p>
    
    <div style="height: 550px; width: 100%;">
        <div id="chart"></div>
    </div>
    
    {#if loading}
        <div class="loading">🛰️ Cargando datos...</div>
    {:else if error}
        <div class="error">Error: {error}</div>
    {:else}
        <div class="info-note">
            <p><strong>📌 Pie Chart (Frappe Charts):</strong></p>
            <ul>
                <li><strong>🟣 Morado:</strong> Total de reportes de tramposos</li>
                <li><strong>🔵 Azul:</strong> Total de satélites lanzados</li>
                <li><strong>📊 Valores:</strong> Suma total de todos los años</li>
            </ul>
            <p><strong>📐 Años analizados:</strong> {yearsList.length} años ({yearsList.join(', ')})</p>
            <p><strong>📊 Total reportes:</strong> {chartData?.reportsData?.reduce((a,b) => a + b, 0).toLocaleString()}</p>
            <p><strong>🛰️ Total satélites:</strong> {chartData?.satellitesData?.reduce((a,b) => a + b, 0).toLocaleString()}</p>
        </div>
    {/if}
</div>

<style>
    .container { max-width: 1000px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #dbeafe; }
    .back-link { color: #2563eb; text-decoration: none; display: inline-block; margin-bottom: 1rem; }
    .back-link:hover { text-decoration: underline; }
    h1 { color: #1e3a8a; margin: 0; }
    .subtitle { color: #666; margin-bottom: 1.5rem; }
    .loading { text-align: center; padding: 2rem; color: #2563eb; }
    .error { text-align: center; padding: 3rem; color: #dc2626; }
    .info-note { margin-top: 2rem; padding: 1rem; background: #eff6ff; border-radius: 8px; font-size: 0.85rem; color: #1e40af; border-left: 4px solid #3b82f6; }
    .info-note ul { margin: 0.5rem 0; padding-left: 1.5rem; }
    .info-note li { margin: 0.3rem 0; }
    .info-note code { background: #bfdbfe; padding: 0.1rem 0.3rem; border-radius: 4px; }
</style>