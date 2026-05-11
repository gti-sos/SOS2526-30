<script>
    import { onMount } from 'svelte';
    
    let loading = $state(true);
    let error = $state(null);
    let combinedData = $state([]);
    let Plotly = null;
    
    onMount(async () => {
        // Importar Plotly solo en el cliente
        const plotlyModule = await import('plotly.js-dist');
        Plotly = plotlyModule.default;
        await fetchCombinedData();
    });
    
    async function fetchCombinedData() {
        try {
            loading = true;
            
            const olympicsRes = await fetch('/api/v1/olympics-athlete-events?limit=2000');
            const olympicsData = await olympicsRes.json();
            const athletes = olympicsData.data || [];
            
            const athletesByCountry = {};
            athletes.forEach(ath => {
                const country = ath.team;
                if (country && country !== 'NA') {
                    athletesByCountry[country] = (athletesByCountry[country] || 0) + 1;
                }
            });
            
            const tempRes = await fetch('https://sos2526-25.onrender.com/api/v1/average-annual-temperatures');
            const tempData = await tempRes.json();
            
            const tempByCountry = {};
            tempData.forEach(item => {
                const country = item.country;
                if (country && !tempByCountry[country]) {
                    tempByCountry[country] = {
                        temperature: item.temperature,
                        co2: item.co2_emission
                    };
                }
            });
            
            combinedData = Object.keys(athletesByCountry)
                .filter(country => tempByCountry[country])
                .map(country => ({
                    country: country,
                    athletes: athletesByCountry[country] || 0,
                    temperature: tempByCountry[country].temperature || 0,
                    co2: tempByCountry[country].co2 || 0
                }))
                .sort((a, b) => b.athletes - a.athletes)
                .slice(0, 10);
            
            setTimeout(() => {
                createBarChart();
            }, 200);
            
            loading = false;
            
            const overlay = document.querySelector('.loading-overlay');
            if (overlay) overlay.style.display = 'none';
            
        } catch (e) {
            console.error('Error:', e);
            error = e.message;
            loading = false;
            const overlay = document.querySelector('.loading-overlay');
            if (overlay) overlay.style.display = 'none';
        }
    }
    
    function createBarChart() {
        const container = document.getElementById('chart-container');
        if (!container || combinedData.length === 0 || !Plotly) return;
        
        const countries = combinedData.map(d => d.country);
        const athletesData = combinedData.map(d => d.athletes);
        const tempData = combinedData.map(d => d.temperature);
        
        const trace1 = {
            x: countries,
            y: athletesData,
            name: 'Atletas Olímpicos',
            type: 'bar',
            marker: { color: '#0284c7' },
            text: tempData.map(t => `${t.toFixed(1)}°C`),
            textposition: 'outside',
            textfont: { color: '#f59e0b', size: 12 }
        };
        
        const layout = {
            title: 'Atletas Olímpicos vs Temperatura media por país',
            xaxis: { 
                title: { text: 'País', standoff: 15 }, 
                tickangle: -45,
                tickfont: { size: 11 }
            },
            yaxis: { 
                title: { text: 'Número de Atletas Olímpicos', standoff: 15 }, 
                titlefont: { color: '#0284c7', size: 12 }
            },
            barmode: 'group',
            height: 550,
            margin: { 
                b: 120,
                l: 80,
                t: 80,
                r: 30
            },
            plot_bgcolor: '#ffffff',
            paper_bgcolor: '#ffffff'
        };
        
        Plotly.newPlot(container, [trace1], layout, { responsive: true });
    }
    
    function formatNumber(num) {
        if (num > 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num > 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }
</script>

<div class="integration-container">
    <h1>Atletas Olímpicos vs Temperatura media por país</h1>
    <p class="subtitle">Barras = Atletas | Números sobre las barras = Temperatura</p>
    
    <div class="info-api">
        <p><strong>API 1 (propia):</strong> Olympics Athlete Events</p>
        <p><strong>API 2 (compañero):</strong> Average Annual Temperatures</p>
        <p><strong>Widget:</strong> Bar con <strong>Plotly.js</strong></p>
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
                            <th>Atletas</th>
                            <th>Temperatura</th>
                            <th>CO2</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each combinedData as item}
                            <tr>
                                <td><strong>{item.country}</strong></td>
                                <td>{item.athletes.toLocaleString()}</td>
                                <td>{item.temperature.toFixed(1)}°C</td>
                                <td>{formatNumber(item.co2)} t</td>
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
            <li><strong>Librería:</strong> Plotly.js (cargada en cliente)</li>
            <li><strong>Tipo:</strong> Bar</li>
            <li><strong>Números naranjas:</strong> Temperatura media en °C</li>
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