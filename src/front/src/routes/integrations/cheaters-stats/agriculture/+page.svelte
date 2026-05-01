<script>
    import { onMount, tick } from 'svelte';
    import Chart from 'chart.js/auto';
    
    let loading = true;
    let error = null;
    let chart = null;
    
    onMount(async () => {
        await tick();
        
        try {
            console.log('Cargando datos...');
            
            // 1. FETCH Cheaters Stats
            const cheatersRes = await fetch('/api/v2/cheaters-stats?limit=200');
            const cheatersJson = await cheatersRes.json();
            const cheatersData = cheatersJson.data || [];
            
            // 2. FETCH Agriculture API
            const agriRes = await fetch('https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts?limit=200');
            const agricultureData = await agriRes.json();
            
            // 3. Agrupar Cheaters por AÑO
            const cheatersByYear = {};
            cheatersData.forEach(item => {
                const year = item.year;
                if (year) {
                    cheatersByYear[year] = (cheatersByYear[year] || 0) + (item.cheater_report || 0);
                }
            });
            
            // 4. Agrupar Agriculture por AÑO
            const tempByYear = {};
            const countByYear = {};
            agricultureData.forEach(item => {
                const year = item.year;
                if (year) {
                    tempByYear[year] = (tempByYear[year] || 0) + item.average_temperature_c;
                    countByYear[year] = (countByYear[year] || 0) + 1;
                }
            });
            
            // 5. Años comunes
            const commonYears = Object.keys(cheatersByYear).filter(y => tempByYear[y]);
            const sortedYears = commonYears.sort((a, b) => a - b);
            
            const years = sortedYears.map(y => y.toString());
            const reportsData = sortedYears.map(y => cheatersByYear[y]);
            const tempData = sortedYears.map(y => tempByYear[y] / countByYear[y]);
            
            console.log('Años:', years);
            console.log('Reportes:', reportsData);
            console.log('Temperaturas:', tempData);
            
            // Normalizar a escala 0-100
            const maxReports = Math.max(...reportsData);
            const maxTemp = Math.max(...tempData);
            
            const normalizedReports = reportsData.map(r => (r / maxReports) * 100);
            const normalizedTemp = tempData.map(t => (t / maxTemp) * 100);
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const canvas = document.getElementById('chart');
            if (!canvas) throw new Error('Canvas no encontrado');
            
            const ctx = canvas.getContext('2d');
            if (chart) chart.destroy();
            
            // GRÁFICO POLAR - TEMPERATURA ENCIMA (es más pequeña)
            chart = new Chart(ctx, {
                type: 'polarArea',
                data: {
                    labels: years,
                    datasets: [
                        {
                            label: '📊 Reportes de Tramposos',
                            data: normalizedReports,
                            backgroundColor: 'rgba(124,58,237,0.4)',  // Más transparente, detrás
                            borderColor: '#7e22ce',
                            borderWidth: 2,
                            hoverOffset: 15
                        },
                        {
                            label: '🌡️ Temperatura Promedio (°C)',
                            data: normalizedTemp,
                            backgroundColor: 'rgba(5,150,105,0.9)',  // Más opaco, encima
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
                            text: `📊 Reportes vs Temperatura (${commonYears.length} años)`, 
                            color: '#7e22ce', 
                            font: { size: 16 } 
                        },
                        tooltip: { 
                            callbacks: { 
                                label: (ctx) => {
                                    const index = ctx.dataIndex;
                                    const year = years[index];
                                    if (ctx.dataset.label.includes('Temperatura')) {
                                        return [
                                            `📅 Año: ${year}`,
                                            `🌡️ Temperatura real: ${tempData[index].toFixed(1)}°C`,
                                            `Normalizado: ${ctx.raw.toFixed(1)}%`
                                        ];
                                    }
                                    return [
                                        `📅 Año: ${year}`,
                                        `📊 Reportes reales: ${reportsData[index].toLocaleString()}`,
                                        `Normalizado: ${ctx.raw.toFixed(1)}%`
                                    ];
                                }
                            }
                        },
                        legend: { position: 'bottom' }
                    },
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 100,
                            ticks: { stepSize: 20, callback: (val) => `${val}%` },
                            grid: { color: '#e9d5ff' }
                        }
                    }
                }
            });
            
            loading = false;
            
        } catch (err) {
            console.error('Error:', err);
            error = err.message;
            loading = false;
        }
    });
</script>

<div class="container">
    <a href="/integrations/cheaters-stats" class="back-link">← Volver</a>
    <h1>🌾 Agriculture Climate + Cheaters Stats</h1>
    <p class="subtitle">Gráfico Polar Area: Temperatura (verde) visible encima de reportes (morado)</p>
    
    <div style="height: 600px; width: 100%;">
        <canvas id="chart" style="width: 100%; height: 100%;"></canvas>
    </div>
    
    {#if loading}<div class="loading">Cargando...</div>{/if}
    {#if error}<div class="error">Error: {error}</div>{/if}
</div>

<style>
    .container { max-width: 1000px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #e9d5ff; }
    .back-link { color: #7e22ce; text-decoration: none; display: inline-block; margin-bottom: 1rem; }
    h1 { color: #7e22ce; margin: 0; }
    .subtitle { color: #666; margin-bottom: 1.5rem; }
    .loading, .error { text-align: center; padding: 2rem; }
    .error { color: #dc2626; }
</style>