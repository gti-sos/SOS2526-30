<script>
    import { onMount, tick } from 'svelte';
    import Chart from 'chart.js/auto';
    
    let loading = true;
    let error = null;
    let chart = null;
    
    let countries = [];
    let reportsData = [];
    let exchangeRates = [];
    let lastUpdate = '';
    
    const AUTH_TOKEN = 'mi-token-secreto-para-demo';
    
    const currencyMap = {
        'SPAIN': 'EUR',
        'CHILE': 'CLP',
        'COLOMBIA': 'COP',
        'MEXICO': 'MXN',
        'BRAZIL': 'BRL',
        'PERU': 'PEN'
    };
    
    onMount(async () => {
        await tick();
        await initChart();
    });
    
    async function initChart() {
        try {
            console.log('Fetching Cheaters Stats...');
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
            
            const topCountries = Object.entries(cheatersByCountry)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6);
            
            countries = topCountries.map(([c]) => c.toUpperCase());
            reportsData = topCountries.map(([, r]) => r);
            
            console.log('Fetching ExchangeRate API...');
            const ratesPromises = countries.map(async (country) => {
                const currency = currencyMap[country];
                if (!currency) return 0;
                
                const res = await fetch(`/api/exchange-proxy?base=USD&target=${currency}`, {
                    headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
                });
                
                if (!res.ok) return 0;
                const data = await res.json();
                if (data.success) {
                    lastUpdate = data.last_update;
                    return data.rate || 0;
                }
                return 0;
            });
            
            exchangeRates = await Promise.all(ratesPromises);
            console.log('Exchange rates:', exchangeRates);
            
            const maxReports = Math.max(...reportsData);
            const maxRate = Math.max(...exchangeRates);
            const normReports = reportsData.map(r => (r / maxReports) * 100);
            const normRates = exchangeRates.map(r => (r / maxRate) * 100);
            
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
                            data: normReports,
                            backgroundColor: '#7e22ce',
                            borderRadius: 8
                        },
                        {
                            label: '💱 Tasa de cambio (USD → Moneda local)',
                            data: normRates,
                            backgroundColor: '#06b6d4',
                            borderRadius: 8
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: { display: true, text: '💱 Tasas de cambio vs Reportes de Tramposos', color: '#7e22ce', font: { size: 16 } },
                        tooltip: { callbacks: { label: (ctx) => {
                            const idx = ctx.dataIndex;
                            const currency = currencyMap[countries[idx]];
                            if (ctx.dataset.label.includes('Reportes')) {
                                return `📊 Reportes: ${reportsData[idx].toLocaleString()}`;
                            }
                            return `💱 1 USD = ${exchangeRates[idx].toFixed(2)} ${currency}`;
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
            console.error(err);
            error = err.message;
            loading = false;
        }
    }
</script>

<div class="container">
    <a href="/integrations/cheaters-stats" class="back-link">← Volver</a>
    <h1>💱 ExchangeRate API + Cheaters Stats</h1>
    <p class="subtitle">Gráfico de Barras: Tasas de cambio vs Reportes de tramposos</p>
    
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
        <p><strong>📊 Datos obtenidos por fetch:</strong></p>
        <table class="data-table">
            <thead>
                <tr>
                    <th>País</th>
                    <th>Reportes (Cheaters Stats)</th>
                    <th>Tasa de cambio (USD → local)</th>
                    <th>Moneda</th>
                </tr>
            </thead>
            <tbody>
                {#each countries as country, i}
                    <tr>
                        <td>{country}</td>
                        <td>{reportsData[i].toLocaleString()}</td>
                        <td class="rate-value">{exchangeRates[i]?.toFixed(2) || 'N/A'}</td>
                        <td class="currency-code">{currencyMap[country]}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
        {#if lastUpdate}
            <p><strong>📅 Última actualización:</strong> {lastUpdate}</p>
        {/if}
        <p><strong>🔐 Autenticación:</strong> Bearer token + API Key en proxy</p>
    </div>
</div>

<style>
    .container { max-width: 1000px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #e9d5ff; }
    .back-link { color: #7e22ce; text-decoration: none; display: inline-block; margin-bottom: 1rem; }
    h1 { color: #06b6d4; margin: 0; }
    .subtitle { color: #666; margin-bottom: 1.5rem; }
    .loading, .error { text-align: center; padding: 2rem; }
    .info-note { margin-top: 2rem; padding: 1rem; background: #ecfeff; border-radius: 8px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.5rem; text-align: left; border-bottom: 1px solid #e9d5ff; }
    th { background: #ecfeff; color: #0891b2; }
    .rate-value { font-family: monospace; }
    .currency-code { font-weight: bold; color: #0891b2; }
</style>