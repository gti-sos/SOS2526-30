<script>
// @ts-nocheck

    import { onMount } from 'svelte';
    
    let loading = true;
    // @ts-ignore
    let error = null;
    // @ts-ignore
    let chart = null;
    let chartData = { years: [], athletes: [], salaries: [] };
    // @ts-ignore
    let c3 = null;
    
    onMount(async () => {
        // Importar C3.js SOLO en el cliente
        // @ts-ignore
        const c3Module = await import('c3');
        c3 = c3Module.default || c3Module;
        await import('c3/c3.css');
        
        await fetchData();
    });
    
    async function fetchData() {
        try {
            loading = true;
            
            // 1. Obtener datos de Olympics - atletas por año
            const resOlympics = await fetch('/api/v2/olympics-athlete-events?limit=3000');
            const olympicsData = await resOlympics.json();
            const athletes = olympicsData.data || [];
            
            // Contar atletas por año
            const athletesByYear = {};
            // @ts-ignore
            athletes.forEach(ath => {
                const year = ath.year;
                if (year && year >= 1900 && year <= 2020) {
                    // @ts-ignore
                    athletesByYear[year] = (athletesByYear[year] || 0) + 1;
                }
            });
            
            // 2. Obtener datos de Salarios
            const resWages = await fetch('https://sos2526-24.onrender.com/api/v1/average-monthly-wages');
            const wagesData = await resWages.json();
            
            // Calcular salario promedio por año
            const salaryByYear = {};
            // @ts-ignore
            wagesData.forEach(item => {
                const year = item.year;
                const salary = item.avg_monthly_usd;
                if (year && salary) {
                    // @ts-ignore
                    if (!salaryByYear[year]) {
                        // @ts-ignore
                        salaryByYear[year] = { total: 0, count: 0 };
                    }
                    // @ts-ignore
                    salaryByYear[year].total += salary;
                    // @ts-ignore
                    salaryByYear[year].count++;
                }
            });
            
            const salaryAvgByYear = {};
            Object.entries(salaryByYear).forEach(([year, data]) => {
                // @ts-ignore
                salaryAvgByYear[year] = Math.round(data.total / data.count);
            });
            
            // 3. Combinar todos los años
            const allYears = new Set([
                ...Object.keys(athletesByYear).map(Number),
                ...Object.keys(salaryAvgByYear).map(Number)
            ]);
            
            const years = Array.from(allYears).sort((a, b) => a - b);
            // @ts-ignore
            const athletesData = years.map(year => athletesByYear[year] || 0);
            // @ts-ignore
            const salaryData = years.map(year => salaryAvgByYear[year] || 0);
            
            // @ts-ignore
            chartData = { years, athletes: athletesData, salaries: salaryData };
            
            await createChart();
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
    
    async function createChart() {
        // @ts-ignore
        if (chart) chart.destroy();
        // @ts-ignore
        if (!c3) return;
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Normalizar los datos
        const maxAthletes = Math.max(...chartData.athletes, 1);
        const maxSalary = Math.max(...chartData.salaries, 1);
        
        const athletesPercent = chartData.athletes.map(v => (v / maxAthletes) * 100);
        const salaryPercent = chartData.salaries.map(v => (v / maxSalary) * 100);
        
        try {
            chart = c3.generate({
                bindto: '#column-container',
                size: { height: 500 },
                data: {
                    columns: [
                        ['Atletas Olímpicos (%)', ...athletesPercent],
                        ['Salario Mensual (USD) (%)', ...salaryPercent]
                    ],
                    type: 'bar',
                    axes: {
                        'Atletas Olímpicos (%)': 'y',
                        'Salario Mensual (USD) (%)': 'y2'
                    },
                    colors: {
                        'Atletas Olímpicos (%)': '#0284c7',
                        'Salario Mensual (USD) (%)': '#10b981'
                    },
                    labels: {
                        format: {
                            // @ts-ignore
                            'Atletas Olímpicos (%)': function(v, id, i) { 
                                return chartData.athletes[i]; 
                            },
                            // @ts-ignore
                            'Salario Mensual (USD) (%)': function(v, id, i) { 
                                return chartData.salaries[i] ? '$' + chartData.salaries[i] : ''; 
                            }
                        }
                    }
                },
                axis: {
                    x: {
                        type: 'category',
                        // @ts-ignore
                        categories: chartData.years.map(y => y.toString()),
                        label: { text: 'Año', position: 'outer-center' },
                        tick: { 
                            rotate: 45,
                            multiline: false,
                            fit: true,
                            culling: { max: 15 }
                        }
                    },
                    y: {
                        label: { text: 'Atletas (% del max)', position: 'outer-middle' }
                    },
                    y2: {
                        show: true,
                        label: { text: 'Salario (% del max)', position: 'outer-middle' }
                    }
                },
                tooltip: {
                    format: {
                        // @ts-ignore
                        title: function(x) { return 'Año: ' + chartData.years[x]; },
                        // @ts-ignore
                        value: function(value, ratio, id) {
                            // @ts-ignore
                            const idx = this.data.points[0].index;
                            if (id.includes('Salario')) {
                                // @ts-ignore
                                const salary = chartData.salaries[idx];
                                return salary ? '$' + salary.toLocaleString() + ' (' + value.toFixed(1) + '%)' : 'No data';
                            }
                            // @ts-ignore
                            return chartData.athletes[idx].toLocaleString() + ' atletas (' + value.toFixed(1) + '%)';
                        }
                    }
                },
                legend: { position: 'bottom' },
                grid: { y: { show: true } }
            });
            
        } catch (e) {
            console.error('Error al crear gráfico:', e);
            // @ts-ignore
            error = 'Error al crear el gráfico: ' + e.message;
        }
    }
</script>

<div class="integration-container">
    <h1> Atletas Olímpicos vs Salarios Medios</h1>
    <p class="subtitle">Evolución histórica (1900-2020) vs datos recientes de salarios (2022-2024)</p>

    
    <div class="loading-overlay">
        <div class="spinner"></div>
        <p>Cargando datos históricos...</p>
    </div>
    
    {#if error}
        <div class="error">
            <p> Error: {error}</p>
        </div>
    {/if}
    
    <div id="column-container" style="min-height: 550px; width: 100%; overflow-x: auto;"></div>
    
    
    <div class="info">
        <h3>📖 Interpretación</h3>
        <ul>
            <li><strong>Tipo de gráfico:</strong> Column (barras verticales) con <strong>C3.js</strong></li>
            <li><strong>Eje Y izquierdo (azul):</strong> Número de atletas olímpicos históricos (normalizado al 100%)</li>
            <li><strong>Eje Y derecho (verde):</strong> Salario mensual promedio en USD (normalizado al 100%)</li>
            <li><strong>Rango temporal:</strong> 1900-2020 (atletas) vs 2022-2024 (salarios)</li>
            <li>Las barras de salarios solo aparecen en los años 2022, 2023 y 2024</li>
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
        margin-top: 1rem;
        color: #dc2626;
        background: #fee2e2;
        border-radius: 8px;
    }
    
    
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