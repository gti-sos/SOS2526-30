<script>
    import { onMount, tick } from 'svelte';
    import Chart from 'chart.js/auto';
    
    let loading = true;
    let error = null;
    let chart = null;
    let yearsList = [];
    
    // Función para inicializar datos en la API externa (Agriculture)
    async function loadInitialData() {
        console.log('🌾 Inicializando datos en Agriculture API...');
        
        try {
            const response = await fetch('https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts/LoadInitialData');
            
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
    
    // Función para obtener datos de agricultura después de inicializar
    async function fetchAgricultureData() {
        console.log('🌾 Obteniendo datos de agricultura...');
        
        const response = await fetch('https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts?limit=200');
        const data = await response.json();
        console.log(`✅ Agriculture: ${data.length} registros`);
        
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
    
    // Función para procesar datos de Agricultura
    function processAgricultureData(agricultureData) {
        const tempByYear = {};
        const countByYear = {};
        
        agricultureData.forEach(item => {
            const year = item.year;
            if (year && item.average_temperature_c !== undefined) {
                tempByYear[year] = (tempByYear[year] || 0) + item.average_temperature_c;
                countByYear[year] = (countByYear[year] || 0) + 1;
            }
        });
        
        // Calcular promedio por año
        const avgTempByYear = {};
        Object.keys(tempByYear).forEach(year => {
            avgTempByYear[year] = tempByYear[year] / countByYear[year];
        });
        
        console.log('🌾 Temperatura promedio por año:', avgTempByYear);
        return avgTempByYear;
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
    function prepareChartData(cheatersByYear, avgTempByYear) {
        // Años comunes que existen en ambos datasets
        const commonYears = Object.keys(cheatersByYear).filter(y => avgTempByYear[y]);
        const sortedYears = commonYears.sort((a, b) => a - b);
        
        const years = sortedYears.map(y => y.toString());
        const reportsData = sortedYears.map(y => cheatersByYear[y]);
        const tempData = sortedYears.map(y => avgTempByYear[y]);
        
        const maxReports = Math.max(...reportsData);
        const maxTemp = Math.max(...tempData);
        
        const normalizedReports = reportsData.map(r => maxReports > 0 ? (r / maxReports) * 100 : 0);
        const normalizedTemp = tempData.map(t => (t / maxTemp) * 100);
        
        return {
            years,
            reportsData,
            tempData,
            normalizedReports,
            normalizedTemp,
            maxReports,
            maxTemp
        };
    }
    
    // Función para renderizar el gráfico polar
    function renderChart(chartData) {
        const canvas = document.getElementById('chart');
        if (!canvas) throw new Error('Canvas no encontrado');
        
        const ctx = canvas.getContext('2d');
        if (chart) chart.destroy();
        
        chart = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: chartData.years,
                datasets: [
                    {
                        label: '📊 Reportes de Tramposos',
                        data: chartData.normalizedReports,
                        backgroundColor: 'rgba(124,58,237,0.4)',
                        borderColor: '#7e22ce',
                        borderWidth: 2,
                        hoverOffset: 15
                    },
                    {
                        label: '🌡️ Temperatura Promedio (°C)',
                        data: chartData.normalizedTemp,
                        backgroundColor: 'rgba(5,150,105,0.9)',
                        borderColor: '#059669',
                        borderWidth: 2,
                        hoverOffset: 15
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { 
                        display: true, 
                        text: `🌾 Reportes vs Temperatura (${chartData.years.length} años)`, 
                        color: '#7e22ce', 
                        font: { size: 16, weight: 'bold' } 
                    },
                    subtitle: {
                        display: true,
                        text: 'Gráfico Polar Area - Datos obtenidos en tiempo real'
                    },
                    tooltip: { 
                        callbacks: { 
                            label: (ctx) => {
                                const index = ctx.dataIndex;
                                const year = chartData.years[index];
                                if (ctx.dataset.label.includes('Temperatura')) {
                                    return [
                                        `📅 Año: ${year}`,
                                        `🌡️ Temperatura real: ${chartData.tempData[index].toFixed(1)}°C`,
                                        `📈 Valor normalizado: ${ctx.raw.toFixed(1)}%`
                                    ];
                                }
                                return [
                                    `📅 Año: ${year}`,
                                    `📊 Reportes reales: ${chartData.reportsData[index].toLocaleString()}`,
                                    `📈 Valor normalizado: ${ctx.raw.toFixed(1)}%`
                                ];
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
                        grid: { color: '#e9d5ff' },
                        title: { display: true, text: 'Valor normalizado (%)', font: { size: 11 } }
                    }
                }
            }
        });
    }
    
    onMount(async () => {
        await tick();
        
        try {
            console.log('🚀 Iniciando proceso para Agriculture Climate...');
            
            // PASO 1: Llamar a LoadInitialData en la API externa
            const initResult = await loadInitialData();
            console.log('📦 Inicialización completada:', initResult);
            
            // Pequeña pausa para asegurar que los datos se inicializaron
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // PASO 2: Obtener datos de agricultura (ya inicializados)
            const agricultureData = await fetchAgricultureData();
            
            // PASO 3: Obtener datos de Cheaters Stats
            const cheatersData = await fetchCheatersData();
            
            // PASO 4: Procesar datos
            const avgTempByYear = processAgricultureData(agricultureData);
            const cheatersByYear = processCheatersData(cheatersData);
            
            // PASO 5: Preparar datos para el gráfico
            const chartData = prepareChartData(cheatersByYear, avgTempByYear);
            yearsList = chartData.years;
            console.log('📅 Años a mostrar:', yearsList);
            console.log('📊 Reportes:', chartData.reportsData);
            console.log('🌡️ Temperaturas:', chartData.tempData);
            
            // PASO 6: Renderizar gráfico
            renderChart(chartData);
            
            loading = false;
            console.log('✅ Gráfico Polar Area creado exitosamente');
            
        } catch (err) {
            console.error('❌ Error:', err);
            error = err.message;
            loading = false;
        }
    });
</script>

<div class="container">
    <a href="/integrations/cheaters-stats" class="back-link">← Volver a Cheaters Stats</a>
    <h1>🌾 Agriculture Climate + Cheaters Stats</h1>
    <p class="subtitle">Gráfico Polar Area: Temperatura (verde) visible encima de reportes (morado)</p>
    
    <div style="height: 600px; width: 100%;">
        <canvas id="chart" style="width: 100%; height: 100%;"></canvas>
    </div>
    
    {#if loading}
        <div class="loading">🌾 Cargando datos de las APIs... (LoadInitialData → Fetch datos → Procesamiento → Gráfico)</div>
    {:else if error}
        <div class="error">Error: {error}</div>
    {:else}
        <div class="info-note">
            <p><strong>📌 Interpretación del gráfico Polar Area:</strong></p>
            <ul>
                <li><strong>🟣 Área morada (fondo):</strong> Reportes de tramposos (Cheaters Stats)</li>
                <li><strong>🟢 Área verde (encima):</strong> Temperatura promedio por año (Agriculture API)</li>
                <li><strong>📅 Cada segmento:</strong> Representa un año disponible en ambas APIs</li>
                <li><strong>📈 Valores normalizados:</strong> Ambos datasets escalados a 0-100%</li>
            </ul>
            <p><strong>📐 Años representados:</strong> {yearsList.length} años ({yearsList.join(', ')})</p>
            <p><strong>🔗 API de Agricultura:</strong> Celia Leal Salvago - <code>https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts</code></p>
            <p><strong>🔄 Flujo de datos:</strong> LoadInitialData (inicializa API Agriculture) → Fetch Agriculture → Fetch Cheaters → Procesamiento → Renderizado</p>
        </div>
    {/if}
</div>

<style>
    .container { max-width: 1000px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #e9d5ff; }
    .back-link { color: #7e22ce; text-decoration: none; display: inline-block; margin-bottom: 1rem; }
    .back-link:hover { text-decoration: underline; }
    h1 { color: #7e22ce; margin: 0; }
    .subtitle { color: #666; margin-bottom: 1.5rem; }
    .loading { text-align: center; padding: 2rem; color: #7e22ce; }
    .error { text-align: center; padding: 3rem; color: #dc2626; }
    .info-note { margin-top: 2rem; padding: 1rem; background: #faf5ff; border-radius: 8px; font-size: 0.85rem; color: #666; border-left: 4px solid #7e22ce; }
    .info-note ul { margin: 0.5rem 0; padding-left: 1.5rem; }
    .info-note li { margin: 0.3rem 0; }
    .info-note code { background: #e9d5ff; padding: 0.1rem 0.3rem; border-radius: 4px; }
</style>