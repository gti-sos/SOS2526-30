<script>
    import { onMount, tick } from 'svelte';
    import Chart from 'chart.js/auto';
    
    let loading = true;
    let error = null;
    let chart = null;
    let yearsList = [];
    
    onMount(async () => {
        await tick();
        
        try {
            console.log('Cargando datos de Construction por años...');
            
            // 1. FETCH Cheaters Stats
            const cheatersRes = await fetch('/api/v2/cheaters-stats?limit=200');
            const cheatersJson = await cheatersRes.json();
            const cheatersData = cheatersJson.data || [];
            console.log(`Cheaters: ${cheatersData.length} registros`);
            
            // 2. FETCH Construction API (Isaac - Grupo 24)
            const constRes = await fetch('https://sos2526-24.onrender.com/api/v1/international-construction-costs?limit=200');
            const constructionData = await constRes.json();
            console.log(`Construction: ${constructionData.length} registros`);
            
            // 3. Agrupar Cheaters por AÑO (todos los años)
            const cheatersByYear = {};
            cheatersData.forEach(item => {
                const year = item.year;
                if (year) {
                    cheatersByYear[year] = (cheatersByYear[year] || 0) + (item.cheater_report || 0);
                }
            });
            console.log('Años en Cheaters:', Object.keys(cheatersByYear).sort());
            
            // 4. Agrupar Construction por AÑO (coste promedio)
            const costByYear = {};
            const countByYear = {};
            constructionData.forEach(item => {
                const year = item.year;
                if (year) {
                    costByYear[year] = (costByYear[year] || 0) + (item.cost_usd_per_m2 || 0);
                    countByYear[year] = (countByYear[year] || 0) + 1;
                }
            });
            console.log('Años en Construction:', Object.keys(costByYear).sort());
            
            // 5. TODOS los años (unión de ambas APIs)
            const allYearsSet = new Set([...Object.keys(cheatersByYear), ...Object.keys(costByYear)]);
            const allYears = Array.from(allYearsSet).sort((a,b) => a - b);
            
            console.log('Todos los años:', allYears);
            
            if (allYears.length === 0) {
                loading = false;
                error = 'No hay datos disponibles.';
                return;
            }
            
            // 6. Preparar datos para el gráfico de radar
            const years = allYears.map(y => y.toString());
            yearsList = years;
            
            const reportsData = allYears.map(y => cheatersByYear[y] || 0);
            const costData = allYears.map(y => costByYear[y] ? (costByYear[y] / countByYear[y]).toFixed(2) : 0);
            
            // Normalizar datos para el radar (escala 0-100)
            const maxReports = Math.max(...reportsData);
            const maxCost = Math.max(...costData.filter(c => c > 0));
            
            const normalizedReports = reportsData.map(r => maxReports > 0 ? (r / maxReports) * 100 : 0);
            const normalizedCost = costData.map(c => maxCost > 0 ? (c / maxCost) * 100 : 0);
            
            console.log('Años:', years);
            console.log('Reportes reales:', reportsData);
            console.log('Costes reales:', costData);
            console.log('Reportes normalizados:', normalizedReports.map(n => n.toFixed(1)));
            console.log('Costes normalizados:', normalizedCost.map(n => n.toFixed(1)));
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const canvas = document.getElementById('chart');
            if (!canvas) throw new Error('Canvas no encontrado');
            
            const ctx = canvas.getContext('2d');
            if (chart) chart.destroy();
            
            // GRÁFICO DE RADAR
            chart = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: years,
                    datasets: [
                        {
                            label: '📊 Reportes de Tramposos (Cheaters)',
                            data: normalizedReports,
                            backgroundColor: 'rgba(124,58,237,0.2)',
                            borderColor: '#7e22ce',
                            borderWidth: 3,
                            pointBackgroundColor: (ctx) => {
                                const value = normalizedReports[ctx.dataIndex];
                                return value > 0 ? '#7e22ce' : '#c084fc';
                            },
                            pointBorderColor: 'white',
                            pointRadius: (ctx) => {
                                const value = normalizedReports[ctx.dataIndex];
                                return value > 0 ? 6 : 3;
                            },
                            pointHoverRadius: 8,
                            fill: true
                        },
                        {
                            label: '🏗️ Coste Construcción (Construction)',
                            data: normalizedCost,
                            backgroundColor: 'rgba(220,38,38,0.2)',
                            borderColor: '#dc2626',
                            borderWidth: 3,
                            pointBackgroundColor: (ctx) => {
                                const value = normalizedCost[ctx.dataIndex];
                                return value > 0 ? '#dc2626' : '#f87171';
                            },
                            pointBorderColor: 'white',
                            pointRadius: (ctx) => {
                                const value = normalizedCost[ctx.dataIndex];
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
                            text: '📊 Evolución Temporal: Reportes vs Coste Construcción', 
                            color: '#7e22ce', 
                            font: { size: 16, weight: 'bold' } 
                        },
                        subtitle: { 
                            display: true, 
                            text: 'Gráfico de Radar - Normalizado a escala 0-100 (puntos pequeños = datos solo en una API)' 
                        },
                        tooltip: { 
                            callbacks: { 
                                label: (ctx) => {
                                    const index = ctx.dataIndex;
                                    const year = years[index];
                                    const reportsReal = reportsData[index];
                                    const costReal = costData[index];
                                    
                                    if (ctx.dataset.label.includes('Reportes')) {
                                        if (reportsReal > 0) {
                                            return [
                                                `📅 Año: ${year}`,
                                                `📊 Reportes reales: ${reportsReal.toLocaleString()}`,
                                                `📈 Valor normalizado: ${ctx.raw.toFixed(1)}%`
                                            ];
                                        } else {
                                            return [
                                                `📅 Año: ${year}`,
                                                `⚠️ Sin datos de reportes de tramposos`
                                            ];
                                        }
                                    } else {
                                        if (costReal > 0) {
                                            return [
                                                `📅 Año: ${year}`,
                                                `🏗️ Coste real: $${parseFloat(costReal).toFixed(0)}/m²`,
                                                `📈 Valor normalizado: ${ctx.raw.toFixed(1)}%`
                                            ];
                                        } else {
                                            return [
                                                `📅 Año: ${year}`,
                                                `⚠️ Sin datos de coste de construcción`
                                            ];
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
                            grid: { color: '#e9d5ff' },
                            title: { display: true, text: 'Valor normalizado (%)', font: { size: 11 } }
                        }
                    }
                }
            });
            
            loading = false;
            console.log('Gráfico de Radar creado con todos los años');
            
        } catch (err) {
            console.error('Error:', err);
            error = err.message;
            loading = false;
        }
    });
</script>

<div class="container">
    <a href="/integrations/cheaters-stats" class="back-link">← Volver</a>
    <h1>🏗️ Construction Costs + Cheaters Stats</h1>
    <p class="subtitle">Gráfico de Radar: Evolución anual de reportes vs coste de construcción</p>
    
    <div style="height: 600px; width: 100%;">
        <canvas id="chart" style="width: 100%; height: 100%;"></canvas>
    </div>
    
    {#if loading}
        <div class="loading">Cargando datos de las APIs...</div>
    {:else if error}
        <div class="error">Error: {error}</div>
    {:else}
        <div class="info-note">
            <p><strong>📌 Interpretación del gráfico de Radar:</strong></p>
            <ul>
                <li><strong>🟣 Línea morada:</strong> Reportes de tramposos (Cheaters Stats)</li>
                <li><strong>🔴 Línea roja:</strong> Coste de construcción (Construction Costs API)</li>
                <li><strong>📅 Eje radial:</strong> Años disponibles en las APIs (todos los años)</li>
                <li><strong>📈 Valores normalizados:</strong> Ambos datasets escalados a 0-100% para compararlos</li>
                <li><strong>🔘 Puntos pequeños:</strong> Indican que solo hay datos en una de las dos APIs ese año</li>
                <li><strong>🔍 Tooltip:</strong> Muestra los valores reales al pasar el ratón</li>
            </ul>
            <p><strong>📐 Años representados:</strong> {yearsList.length} años ({yearsList.join(', ')})</p>
            <p><strong>💡 Correlación:</strong> Si ambas líneas tienen forma similar, puede haber relación entre costes de construcción y reportes de tramposos</p>
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