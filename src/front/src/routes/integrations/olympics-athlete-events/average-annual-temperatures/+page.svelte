<script>
    import { onMount } from 'svelte';
    import * as echarts from 'echarts';
    
    let loading = $state(true);
    let error = $state(null);
    // @ts-ignore
    let chart = null;
    // @ts-ignore
    let combinedData = $state([]);
    
    onMount(() => {
        fetchCombinedData();
    });
    
    async function fetchCombinedData() {
        try {
            loading = true;
            
            const olympicsRes = await fetch('/api/v1/olympics-athlete-events?limit=2000');
            const olympicsData = await olympicsRes.json();
            const athletes = olympicsData.data || [];
            
            const athletesByCountry = {};
            // @ts-ignore
            athletes.forEach(ath => {
                const country = ath.team;
                if (country && country !== 'NA') {
                    // @ts-ignore
                    athletesByCountry[country] = (athletesByCountry[country] || 0) + 1;
                }
            });
            
            const tempRes = await fetch('https://sos2526-25.onrender.com/api/v1/average-annual-temperatures');
            const tempData = await tempRes.json();
            
            const tempByCountry = {};
            // @ts-ignore
            tempData.forEach(item => {
                const country = item.country;
                // @ts-ignore
                if (country && !tempByCountry[country]) {
                    // @ts-ignore
                    tempByCountry[country] = {
                        temperature: item.temperature
                    };
                }
            });
            
            combinedData = Object.keys(athletesByCountry)
                // @ts-ignore
                .filter(country => tempByCountry[country])
                .map(country => ({
                    country: country,
                    // @ts-ignore
                    athletes: athletesByCountry[country] || 0,
                    // @ts-ignore
                    temperature: tempByCountry[country].temperature || 0
                }))
                .sort((a, b) => b.athletes - a.athletes)
                .slice(0, 10);
            
            setTimeout(() => {
                createBarChart();
            }, 200);
            
            loading = false;
            
            const overlay = document.querySelector('.loading-overlay');
            // @ts-ignore
            if (overlay) overlay.style.display = 'none';
            
        } catch (e) {
            console.error('Error:', e);
            // @ts-ignore
            error = e.message;
            loading = false;
            const overlay = document.querySelector('.loading-overlay');
            // @ts-ignore
            if (overlay) overlay.style.display = 'none';
        }
    }
    
    function createBarChart() {
        const container = document.getElementById('chart-container');
        if (!container || combinedData.length === 0) return;
        
        // @ts-ignore
        if (chart) {
            chart.dispose();
        }
        
        const countries = combinedData.map(d => d.country);
        const athletesData = combinedData.map(d => d.athletes);
        const tempData = combinedData.map(d => d.temperature);
        
        chart = echarts.init(container);
        
        const option = {
            title: {
                text: 'Atletas Olímpicos vs Temperatura media por país',
                subtext: 'Barras: Atletas | Círculos: Temperatura',
                left: 'center',
                top: 5,
                textStyle: { fontSize: 16, color: '#0369a1' },
                subtextStyle: { fontSize: 12, color: '#666' }
            },
            tooltip: {
                trigger: 'axis',
                // @ts-ignore
                formatter: function(params) {
                    let result = `<b>${params[0].axisValue}</b><br/>`;
                    // @ts-ignore
                    params.forEach(p => {
                        if (p.seriesName === 'Atletas') {
                            result += `🏅 Atletas: ${p.value.toLocaleString()}<br/>`;
                        } else {
                            result += `🌡️ Temperatura: ${p.value.toFixed(1)}°C<br/>`;
                        }
                    });
                    return result;
                }
            },
            xAxis: {
                type: 'category',
                data: countries,
                name: 'País',
                axisLabel: { rotate: 45, fontSize: 10, interval: 0 }
            },
            yAxis: [
                {
                    type: 'value',
                    name: 'Atletas Olímpicos',
                    nameLocation: 'middle',
                    nameGap: 50
                },
                {
                    type: 'value',
                    name: 'Temperatura (°C)',
                    nameLocation: 'middle',
                    nameGap: 50
                }
            ],
            series: [
                {
                    name: 'Atletas',
                    type: 'bar',
                    data: athletesData,
                    itemStyle: { color: '#0284c7', borderRadius: [4, 4, 0, 0] },
                    barWidth: '50%'
                },
                {
                    name: 'Temperatura',
                    type: 'scatter',
                    data: tempData,
                    itemStyle: { color: '#f59e0b' },
                    symbolSize: 12,
                    yAxisIndex: 1,
                    // @ts-ignore
                    tooltip: { valueFormatter: (value) => value.toFixed(1) + '°C' }
                }
            ],
            grid: {
                containLabel: true,
                top: 70,
                bottom: 40,
                left: 60,
                right: 60
            }
        };
        
        chart.setOption(option);
        // @ts-ignore
        window.addEventListener('resize', () => chart?.resize());
    }
    
    // @ts-ignore
    function formatNumber(num) {
        if (num > 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num > 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }
</script>

<div class="integration-container">
    <h1>Atletas Olímpicos vs Temperatura media por país</h1>
    <p class="subtitle">Barras azules = Atletas | Círculos naranjas = Temperatura media (°C)</p>
    
    <div class="info-api">
        <p><strong>API 1 (propia):</strong> Olympics Athlete Events - Número de atletas por país</p>
        <p><strong>API 2 (compañero):</strong> Average Annual Temperatures - Temperatura media por país</p>
        <p><strong>Widget:</strong> Bar + Scatter con <strong>ECharts</strong></p>
    </div>
    
    <div class="loading-overlay">
        <div class="spinner"></div>
        <p>Cargando datos...</p>
    </div>
    
    {#if error}
        <div class="error">Error: {error}</div>
    {/if}
    
    {#if !loading}
        <div id="chart-container" style="height: 550px; width: 100%; margin-bottom: 2rem;"></div>
        
        <div class="table-container">
            <h3>Datos combinados</h3>
            <div class="table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>País</th>
                            <th>Atletas Olímpicos</th>
                            <th>Temperatura media (°C)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each combinedData as item}
                            <tr>
                                <td><strong>{item.country}</strong></td>
                                <td>{item.athletes.toLocaleString()}</td>
                                <td>{item.temperature.toFixed(1)}°C</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    {/if}
    
    <div class="info">
        <h3>Interpretación</h3>
        <ul>
            <li><strong>Barras azules:</strong> Número de atletas olímpicos por país</li>
            <li><strong>Círculos naranjas:</strong> Temperatura media del país (°C)</li>
            <li><strong>Librería:</strong> ECharts</li>
            <li><strong>Eje Y izquierdo:</strong> Atletas | <strong>Eje Y derecho:</strong> Temperatura</li>
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
    
    h1 { color: #0369a1; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #666; margin-bottom: 1rem; }
    
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
    
    .error {
        text-align: center;
        padding: 2rem;
        color: #dc2626;
        background: #fee2e2;
        border-radius: 8px;
    }
    
    .table-container {
        margin-top: 2rem;
        border-top: 1px solid #e2e8f0;
        padding-top: 1rem;
    }
    
    .table-container h3 { color: #0369a1; margin-bottom: 1rem; }
    .table-wrapper { overflow-x: auto; max-height: 400px; overflow-y: auto; }
    
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
    
    tr:hover { background: #f0f9ff; }
    
    .info {
        margin-top: 2rem;
        padding: 1rem;
        background: #f0f9ff;
        border-radius: 12px;
        border: 1px solid #bae6fd;
    }
    
    .info h3 { color: #0369a1; margin-top: 0; }
    .info ul { margin: 0; padding-left: 1.5rem; }
    .info li { margin: 0.5rem 0; color: #333; }
</style>