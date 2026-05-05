<script>
    import { onMount, tick } from 'svelte';
    import Chart from 'chart.js/auto';
    
    let loading = true;
    let error = null;
    let chart = null;
    let yearsList = [];
    
    // Función para inicializar datos en la API externa (Deaths)
    async function loadInitialData() {
        console.log('💀 Inicializando datos en Deaths API...');
        
        try {
            const response = await fetch('https://sos2526-10.onrender.com/api/v2/deaths-by-risk-factors/LoadInitialData');
            
            // 400 significa que ya estaba inicializado (no es un error real)
            if (response.status === 400) {
                const data = await response.json();
                console.log('ℹ️', data.message);
                return { alreadyInitialized: true, message: data.message };
            }
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅', data.message);
                return { initialized: true, message: data.message };
            }
            
            throw new Error(`HTTP ${response.status}`);
            
        } catch (err) {
            console.warn('⚠️ No se pudo inicializar (puede que ya lo esté):', err.message);
            return null;
        }
    }
    
    // Función para obtener datos de deaths después de inicializar
    async function fetchDeathsData() {
        console.log('💀 Obteniendo datos de muertes...');
        
        const response = await fetch('https://sos2526-10.onrender.com/api/v2/deaths-by-risk-factors?limit=200');
        const data = await response.json();
        console.log(`✅ Deaths: ${data.length} registros`);
        
        return data;
    }
    
    // Función para cargar datos de Cheaters Stats
    async function fetchCheatersData() {
        console.log('📊 Cargando datos de Cheaters Stats...');
        
        const response = await fetch('/api/v2/cheaters-stats?limit=200');
        const json = await response.json();
        const data = json.data || [];
        console.log(`✅ Cheaters: ${data.length} registros`);
        
        return data;
    }
    
    // Función para procesar datos de Deaths
    function processDeathsData(deathsData) {
        const deathsByYear = {};
        
        deathsData.forEach(item => {
            let year = null;
            let deaths = null;
            
            // Buscar campo de año
            const possibleYearFields = ['year', 'Year', 'YEAR', 'ano', 'Año', 'date', 'Date', 'fecha', 'period', 'year_id'];
            for (const field of possibleYearFields) {
                if (item[field] !== undefined && item[field] !== null) {
                    year = item[field];
                    break;
                }
            }
            
            // Si es una fecha, extraer año
            if (year && typeof year === 'string' && year.includes('-')) {
                year = year.split('-')[0];
            }
            
            // Buscar campo de muertes
            const possibleDeathFields = ['deaths', 'Deaths', 'value', 'Value', 'total', 'Total', 'count', 'Count', 'deaths_count', 'risk_deaths'];
            for (const field of possibleDeathFields) {
                if (item[field] !== undefined && item[field] !== null) {
                    deaths = item[field];
                    break;
                }
            }
            
            // Si no encontró campo específico, tomar el primer valor numérico
            if (!deaths) {
                for (let key in item) {
                    const value = item[key];
                    if (typeof value === 'number' && value !== year && value > 0) {
                        deaths = value;
                        break;
                    }
                }
            }
            
            if (year && deaths) {
                const yearStr = year.toString();
                deathsByYear[yearStr] = (deathsByYear[yearStr] || 0) + (typeof deaths === 'number' ? deaths : parseFloat(deaths) || 0);
            }
        });
        
        console.log('💀 Muertes por año:', deathsByYear);
        return deathsByYear;
    }
    
    // Función para procesar datos de Cheaters
    function processCheatersData(cheatersData) {
        const cheatersByYear = {};
        cheatersData.forEach(item => {
            const year = item.year;
            if (year) {
                cheatersByYear[year] = (cheatersByYear[year] || 0) + (item.cheater_report || 0);
            }
        });
        console.log('📊 Cheaters por año:', cheatersByYear);
        return cheatersByYear;
    }
    
    // Función para preparar datos del gráfico
    function prepareChartData(cheatersByYear, deathsByYear) {
        const allYearsSet = new Set([...Object.keys(cheatersByYear), ...Object.keys(deathsByYear)]);
        const allYears = Array.from(allYearsSet).sort((a, b) => a - b);
        
        const years = allYears.map(y => y.toString());
        const reportsData = allYears.map(y => cheatersByYear[y] || 0);
        const deathsDataMapped = allYears.map(y => deathsByYear[y] || 0);
        
        const maxReports = Math.max(...reportsData);
        const maxDeaths = Math.max(...deathsDataMapped);
        
        const normalizedReports = reportsData.map(r => maxReports > 0 ? (r / maxReports) * 100 : 0);
        const normalizedDeaths = deathsDataMapped.map(d => maxDeaths > 0 ? (d / maxDeaths) * 100 : 0);
        
        return {
            years,
            reportsData,
            deathsData: deathsDataMapped,
            normalizedReports,
            normalizedDeaths,
            maxReports,
            maxDeaths
        };
    }
    
    // Función para renderizar el gráfico de radar
    function renderChart(chartData) {
        const canvas = document.getElementById('chart');
        if (!canvas) throw new Error('Canvas no encontrado');
        
        const ctx = canvas.getContext('2d');
        if (chart) chart.destroy();
        
        chart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: chartData.years,
                datasets: [
                    {
                        label: '📊 Reportes de Tramposos (Cheaters)',
                        data: chartData.normalizedReports,
                        backgroundColor: 'rgba(124,58,237,0.2)',
                        borderColor: '#7e22ce',
                        borderWidth: 3,
                        pointBackgroundColor: (ctx) => {
                            const value = chartData.normalizedReports[ctx.dataIndex];
                            return value > 0 ? '#7e22ce' : '#c084fc';
                        },
                        pointBorderColor: 'white',
                        pointRadius: (ctx) => {
                            const value = chartData.normalizedReports[ctx.dataIndex];
                            return value > 0 ? 6 : 3;
                        },
                        pointHoverRadius: 8,
                        fill: true
                    },
                    {
                        label: '💀 Muertes por Factores de Riesgo',
                        data: chartData.normalizedDeaths,
                        backgroundColor: 'rgba(239,68,68,0.2)',
                        borderColor: '#ef4444',
                        borderWidth: 3,
                        pointBackgroundColor: (ctx) => {
                            const value = chartData.normalizedDeaths[ctx.dataIndex];
                            return value > 0 ? '#ef4444' : '#fca5a5';
                        },
                        pointBorderColor: 'white',
                        pointRadius: (ctx) => {
                            const value = chartData.normalizedDeaths[ctx.dataIndex];
                            return value > 0 ? 6 : 3;
                        },
                        pointHoverRadius: 8,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { 
                        display: true, 
                        text: '💀 Reportes de Tramposos vs Muertes por Factores de Riesgo', 
                        color: '#991b1b', 
                        font: { size: 16, weight: 'bold' } 
                    },
                    subtitle: { 
                        display: true, 
                        text: chartData.maxDeaths === 0 ? '⚠️ No se encontraron años con datos de muertes' : 'Gráfico de Radar - Normalizado a escala 0-100' 
                    },
                    tooltip: { 
                        callbacks: { 
                            label: (ctx) => {
                                const index = ctx.dataIndex;
                                const year = chartData.years[index];
                                const reportsReal = chartData.reportsData[index];
                                const deathsReal = chartData.deathsData[index];
                                
                                if (ctx.dataset.label.includes('Reportes')) {
                                    if (reportsReal > 0) {
                                        return `📊 Reportes ${year}: ${reportsReal.toLocaleString()}`;
                                    } else {
                                        return `📅 ${year}: Sin datos de reportes`;
                                    }
                                } else {
                                    if (deathsReal > 0) {
                                        return `💀 Muertes ${year}: ${deathsReal.toLocaleString()}`;
                                    } else {
                                        return `📅 ${year}: Sin datos de muertes`;
                                    }
                                }
                            }
                        }
                    },
                    legend: { 
                        position: 'bottom',
                        labels: { usePointStyle: true, boxWidth: 15, font: { size: 12 } }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { 
                            stepSize: 20,
                            backdropColor: 'transparent',
                            callback: (val) => `${val}%`
                        },
                        grid: { color: '#fee2e2' },
                        title: { display: true, text: 'Valor normalizado (%)', font: { size: 11 } }
                    }
                }
            }
        });
    }
    
    onMount(async () => {
        await tick();
        
        try {
            console.log('🚀 Iniciando proceso para Deaths by Risk Factors...');
            
            // PASO 1: Llamar a LoadInitialData en la API externa
            const initResult = await loadInitialData();
            console.log('📦 Inicialización completada:', initResult);
            
            // Pequeña pausa para asegurar que los datos se inicializaron
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // PASO 2: Obtener datos de muertes (ya inicializados)
            const deathsData = await fetchDeathsData();
            
            // PASO 3: Obtener datos de Cheaters Stats
            const cheatersData = await fetchCheatersData();
            
            // PASO 4: Procesar datos
            const deathsByYear = processDeathsData(deathsData);
            const cheatersByYear = processCheatersData(cheatersData);
            
            // PASO 5: Preparar datos para el gráfico
            const chartData = prepareChartData(cheatersByYear, deathsByYear);
            yearsList = chartData.years;
            console.log('📅 Años a mostrar:', yearsList);
            console.log('📊 Reportes:', chartData.reportsData);
            console.log('💀 Muertes:', chartData.deathsData);
            
            // PASO 6: Renderizar gráfico
            renderChart(chartData);
            
            loading = false;
            console.log('✅ Gráfico de Radar creado exitosamente');
            
        } catch (err) {
            console.error('❌ Error:', err);
            error = err.message;
            loading = false;
        }
    });
</script>

<div class="container">
    <a href="/integrations/cheaters-stats" class="back-link">← Volver a Cheaters Stats</a>
    <h1>💀 Deaths by Risk Factors + Cheaters Stats</h1>
    <p class="subtitle">Gráfico de Radar: Evolución anual de reportes vs muertes por factores de riesgo</p>
    
    <div style="height: 600px; width: 100%;">
        <canvas id="chart" style="width: 100%; height: 100%;"></canvas>
    </div>
    
    {#if loading}
        <div class="loading">💀 Cargando datos de las APIs... (LoadInitialData → Fetch datos → Procesamiento → Gráfico)</div>
    {:else if error}
        <div class="error">Error: {error}</div>
    {:else}
        <div class="info-note">
            <p><strong>📌 Interpretación del gráfico de Radar:</strong></p>
            <ul>
                <li><strong>🟣 Línea morada:</strong> Reportes de tramposos (Cheaters Stats)</li>
                <li><strong>🔴 Línea roja:</strong> Muertes por factores de riesgo (Deaths API)</li>
                <li><strong>📅 Eje radial:</strong> Años disponibles en las APIs</li>
                <li><strong>📈 Valores normalizados:</strong> Ambos datasets escalados a 0-100%</li>
                <li><strong>🔘 Puntos pequeños:</strong> Indican datos solo en una API ese año</li>
            </ul>
            <p><strong>📐 Años representados:</strong> {yearsList.length} años ({yearsList.join(', ')})</p>
            <p><strong>🔗 API de Muertes:</strong> <code>https://sos2526-10.onrender.com/api/v2/deaths-by-risk-factors</code></p>
            <p><strong>🔄 Flujo de datos:</strong> LoadInitialData (inicializa API Deaths) → Fetch Deaths → Fetch Cheaters → Procesamiento → Renderizado</p>
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
    .info-note { margin-top: 2rem; padding: 1rem; background: #fef2f2; border-radius: 8px; font-size: 0.85rem; color: #991b1b; border-left: 4px solid #ef4444; }
    .info-note ul { margin: 0.5rem 0; padding-left: 1.5rem; }
    .info-note li { margin: 0.3rem 0; }
    .info-note code { background: #fecaca; padding: 0.1rem 0.3rem; border-radius: 4px; }
</style>