<script>
    import { onMount, tick } from 'svelte';
    import Chart from 'chart.js/auto';
    
    let loading = true;
    let error = null;
    let chart = null;
    
    let countries = [];
    let reportsData = [];
    let dogsData = [];
    let dogNames = [];
    
    onMount(async () => {
        await tick();
        await initChart();
    });
    
    async function initChart() {
        try {
            console.log('Cargando datos...');
            
            // 1. FETCH Cheaters Stats
            const cheatersRes = await fetch('/api/v2/cheaters-stats?limit=200');
            const cheatersJson = await cheatersRes.json();
            const cheatersData = cheatersJson.data || [];
            
            const cheatersByCountry = {};
            cheatersData.forEach(item => {
                const country = item.country?.toLowerCase();
                if (country) {
                    cheatersByCountry[country] = (cheatersByCountry[country] || 0) + (item.cheater_report || 0);
                }
            });
            
            // Top 6 países
            const topCountries = Object.entries(cheatersByCountry)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6);
            
            countries = topCountries.map(([country]) => country.toUpperCase());
            reportsData = topCountries.map(([, reports]) => reports);
            
            // 2. FETCH TheDogAPI
            const proxyRes = await fetch('/api/dog-proxy?endpoint=breeds&limit=100');
            const dogBreeds = await proxyRes.json();
            
            // Buscar razas con energía o inteligencia
            const breedOptions = dogBreeds.filter(b => b.energy_level > 0 || b.intelligence > 0);
            
            if (breedOptions.length === 0) {
                // Fallback: usar primeras 6 razas con valores por defecto
                for (let i = 0; i < topCountries.length; i++) {
                    const breed = dogBreeds[i % dogBreeds.length];
                    dogNames.push(breed.name);
                    dogsData.push(75);
                }
            } else {
                for (let i = 0; i < topCountries.length; i++) {
                    const breed = breedOptions[i % breedOptions.length];
                    dogNames.push(breed.name);
                    let val = breed.intelligence || (breed.energy_level * 20) || 75;
                    dogsData.push(val);
                }
            }
            
            // Normalizar a 0-100
            const maxReports = Math.max(...reportsData);
            const maxDogs = Math.max(...dogsData);
            const normalizedReports = reportsData.map(r => (r / maxReports) * 100);
            const normalizedDogs = dogsData.map(d => (d / maxDogs) * 100);
            
            // Crear gráfico
            const canvas = document.getElementById('chart');
            if (!canvas) throw new Error('Canvas no encontrado');
            const ctx = canvas.getContext('2d');
            if (chart) chart.destroy();
            
            chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: countries,
                    datasets: [
                        {
                            label: '📊 Reportes de Tramposos (Cheaters Stats)',
                            data: normalizedReports,
                            backgroundColor: '#7e22ce',
                            borderRadius: 8,
                            barPercentage: 0.7
                        },
                        {
                            label: '🐕 Energía/Inteligencia de raza (TheDogAPI)',
                            data: normalizedDogs,
                            backgroundColor: '#f59e0b',
                            borderRadius: 8,
                            barPercentage: 0.7
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: { display: true, text: '🐕 Comparativa: Reportes vs Razas de Perro', color: '#7e22ce', font: { size: 16 } },
                        tooltip: { callbacks: { label: (ctx) => {
                            const index = ctx.dataIndex;
                            if (ctx.dataset.label.includes('Reportes')) {
                                return `📊 Reportes: ${reportsData[index].toLocaleString()}`;
                            }
                            return `🐕 ${dogNames[index]}: ${dogsData[index]}/100`;
                        } } },
                        legend: { position: 'top' }
                    },
                    scales: {
                        y: { title: { display: true, text: 'Valor normalizado (%)' }, beginAtZero: true, max: 100, ticks: { callback: (val) => `${val}%` } },
                        x: { title: { display: true, text: 'País' } }
                    }
                }
            });
            
            loading = false;
            
        } catch (err) {
            console.error('Error:', err);
            error = err.message;
            loading = false;
        }
    }
</script>

<div class="container">
    <a href="/integrations/cheaters-stats" class="back-link">← Volver</a>
    <h1>🐕 TheDogAPI + Cheaters Stats</h1>
    <p class="subtitle">Gráfico de Barras: Comparativa por país</p>
    
    <div style="height: 500px; width: 100%;">
        <canvas id="chart" style="width: 100%; height: 100%;"></canvas>
    </div>
    
    {#if loading}
        <div class="loading">Cargando datos...</div>
    {/if}
    
    {#if error}
        <div class="error">Error: {error}</div>
    {/if}
    
    <div class="info-note">
        <p><strong>📊 Datos reales:</strong></p>
        <table class="data-table">
            <thead>
                <tr>
                    <th>País</th>
                    <th>Reportes (Cheaters)</th>
                    <th>Raza asignada</th>
                    <th>Valor</th>
                </tr>
            </thead>
            <tbody>
                {#each countries as country, i}
                    <tr>
                        <td>{country}</td>
                        <td>{reportsData[i].toLocaleString()}</td>
                        <td>{dogNames[i] || 'Cargando...'}</td>
                        <td>{dogsData[i]}/100</td>
                    </tr>
                {/each}
            </tbody>
        </table>
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
    .info-note { margin-top: 2rem; padding: 1rem; background: #faf5ff; border-radius: 8px; font-size: 0.85rem; border-left: 4px solid #7e22ce; }
    .info-note table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
    .info-note th, .info-note td { padding: 0.5rem; text-align: left; border-bottom: 1px solid #e9d5ff; }
    .info-note th { background: #f3e8ff; color: #7e22ce; }
    .info-note code { background: #e9d5ff; padding: 0.1rem 0.3rem; border-radius: 4px; }
</style>
