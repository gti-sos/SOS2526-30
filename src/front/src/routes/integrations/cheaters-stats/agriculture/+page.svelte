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
            
            // 3. Agrupar Cheaters por PAÍS
            const cheatersByCountry = {};
            cheatersData.forEach(item => {
                const country = item.country?.toLowerCase();
                if (country) {
                    cheatersByCountry[country] = (cheatersByCountry[country] || 0) + (item.cheater_report || 0);
                }
            });
            
            // 4. Agrupar Agriculture por PAÍS
            const tempByCountry = {};
            const countByCountry = {};
            agricultureData.forEach(item => {
                const country = item.country?.toLowerCase();
                if (country) {
                    tempByCountry[country] = (tempByCountry[country] || 0) + item.average_temperature_c;
                    countByCountry[country] = (countByCountry[country] || 0) + 1;
                }
            });
            
            // 5. Países comunes
            const commonCountries = Object.keys(cheatersByCountry).filter(c => tempByCountry[c]);
            const sortedCountries = commonCountries.sort((a,b) => cheatersByCountry[b] - cheatersByCountry[a]);
            
            const countries = sortedCountries.map(c => c.toUpperCase());
            const reportsData = sortedCountries.map(c => cheatersByCountry[c]);
            const tempData = sortedCountries.map(c => tempByCountry[c] / countByCountry[c]);
            
            console.log('Países:', countries);
            console.log('Reportes (absoluto):', reportsData);
            console.log('Temperaturas (absoluto):', tempData);
            
            // 6. ESCALADO: Cheaters x1, Temperatura x100 (INVERTIDO)
            const SCALE_CHEATERS = 1;
            const SCALE_TEMP = 100;
            
            const scaledReports = reportsData.map(r => r / SCALE_CHEATERS);
            const scaledTemp = tempData.map(t => t * SCALE_TEMP);
            
            // Normalizar a máximo 100 para el gráfico polar
            const maxReports = Math.max(...scaledReports);
            const maxTemp = Math.max(...scaledTemp);
            const globalMax = Math.max(maxReports, maxTemp);
            
            const normalizedReports = scaledReports.map(r => (r / globalMax) * 100);
            const normalizedTemp = scaledTemp.map(t => (t / globalMax) * 100);
            
            console.log('Temperatura escalada (x100):', scaledTemp);
            console.log('Cheaters normalizado (%):', normalizedReports.map(n => n.toFixed(1)));
            console.log('Agriculture normalizado (%):', normalizedTemp.map(n => n.toFixed(1)));
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const canvas = document.getElementById('chart');
            if (!canvas) {
                console.error('Canvas no encontrado');
                loading = false;
                return;
            }
            
            const ctx = canvas.getContext('2d');
            if (chart) chart.destroy();
            
            // GRÁFICO POLAR AREA - TEMPERATURA ESCALADA X100
            chart = new Chart(ctx, {
                type: 'polarArea',
                data: {
                    labels: countries,
                    datasets: [
                        {
                            label: '🌡️ Temperatura Promedio (escalado x100)',
                            data: normalizedTemp,
                            backgroundColor: 'rgba(5,150,105,0.85)',
                            borderColor: '#059669',
                            borderWidth: 2,
                            hoverOffset: 15
                        },
                        {
                            label: '📊 Reportes de Tramposos (valor real)',
                            data: normalizedReports,
                            backgroundColor: 'rgba(124,58,237,0.5)',
                            borderColor: '#7e22ce',
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
                            text: '📊 Comparativa Polar: Reportes vs Temperatura (T° escalada x100)', 
                            color: '#7e22ce', 
                            font: { size: 16, weight: 'bold' } 
                        },
                        subtitle: { 
                            display: true, 
                            text: 'Temperatura escalada x100 para visualización - Ver valores reales en tooltip' 
                        },
                        tooltip: { 
                            callbacks: { 
                                label: (ctx) => {
                                    const index = ctx.dataIndex;
                                    if (ctx.dataset.label.includes('Temperatura')) {
                                        return [
                                            `🌡️ ${ctx.label}`,
                                            `Temperatura real: ${tempData[index].toFixed(1)}°C`,
                                            `Escalado x100: ${(tempData[index] * SCALE_TEMP).toFixed(1)}`,
                                            `Visual: ${ctx.raw.toFixed(1)}%`
                                        ];
                                    }
                                    return [
                                        `📊 ${ctx.label}`,
                                        `Reportes reales: ${reportsData[index].toLocaleString()}`,
                                        `Visual: ${ctx.raw.toFixed(1)}%`
                                    ];
                                }
                            }
                        },
                        legend: { 
                            position: 'bottom',
                            labels: { 
                                usePointStyle: true, 
                                boxWidth: 15, 
                                font: { size: 11 },
                                padding: 15
                            }
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
                            title: { display: true, text: 'Valor visual (%)', font: { size: 11 } }
                        }
                    }
                }
            });
            
            loading = false;
            console.log('Gráfico Polar Area creado - Temperatura escalada x100');
            
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
    <p class="subtitle">Gráfico Polar Area: Temperatura (escalada x100) vs Reportes</p>
    
    <div style="height: 600px; width: 100%;">
        <canvas id="chart" style="width: 100%; height: 100%;"></canvas>
    </div>
    
    {#if loading}
        <div class="loading">Cargando datos de las APIs...</div>
    {/if}
    
    {#if error}
        <div class="error">Error: {error}</div>
    {/if}
    
    <div class="info-note">
        <p><strong>📌 Interpretación del gráfico:</strong></p>
        <ul>
            <li><strong>🟢 Área verde:</strong> Temperatura media (escalada x100 para visibilidad)</li>
            <li><strong>🟣 Área morada:</strong> Reportes de tramposos (valores reales)</li>
            <li><strong>Escalado aplicado:</strong> Temperatura ×100 para equiparar magnitudes</li>
            <li><strong>Tooltip:</strong> Muestra los valores reales al pasar el ratón</li>
        </ul>
        <p><strong>📐 Ejemplo de escalado:</strong> Chile con 18°C → se muestra como 1800 en la escala interna (18 × 100)</p>
        <p><strong>🎨 Orden de capas:</strong> La temperatura (verde) se muestra por encima de los reportes (morado)</p>
    </div>
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