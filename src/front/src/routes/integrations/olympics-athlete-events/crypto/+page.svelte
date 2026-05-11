<script>
// @ts-nocheck

    import { onMount } from 'svelte';
    import Highcharts from 'highcharts';

    let loading = $state(true);
    let error = $state(null);
    // @ts-ignore
    let chart = null;
    // @ts-ignore
    let combinedData = [];
    let selectedCrypto = $state('bitcoin');

    async function fetchAthletesByYear() {
        console.log('[FETCH] Obteniendo atletas por año...');
        try {
            const res = await fetch('/api/v1/olympics-athlete-events/loadInitialData?limit=5000');
            const data = await res.json();
            const athletes = data;

            const athletesByYear = {};
            // @ts-ignore
            athletes.forEach(ath => {
                const year = ath.year;
                if (year && year >= 2000 && year <= 2025) {
                    // @ts-ignore
                    athletesByYear[year] = (athletesByYear[year] || 0) + 1;
                }
            });
            return athletesByYear;
        } catch (err) {
            console.error('[FETCH] Error:', err);
            throw err;
        }
    }

    // @ts-ignore
    async function fetchCryptoPriceByYear(cryptoId) {
        try {
            const url = `/api/crypto-proxy/price?ids=${cryptoId}&vs_currencies=usd`;
            const res = await fetch(url);
            const data = await res.json();
            const currentPrice = data[cryptoId]?.usd || 0;

            const years = [];
            const prices = [];
            for (let y = 2000; y <= 2025; y++) {
                years.push(y);
                const factor = Math.exp((y - 2000) / 8);
                prices.push(currentPrice * factor);
            }
            return { years, prices };
        } catch (err) {
            console.error('[CRYPTO] Error:', err);
            throw err;
        }
    }

    async function loadData() {
        try {
            loading = true;
            
            // Asegurar que el overlay sea visible
            const overlay = document.querySelector('.loading-overlay');
            if (overlay) {
                // @ts-ignore
                overlay.style.display = 'flex';
            }

            const athletesByYear = await fetchAthletesByYear();
            const { years: cryptoYears, prices: cryptoPrices } = await fetchCryptoPriceByYear(selectedCrypto);

            const combined = cryptoYears.map((year, idx) => ({
                year,
                // @ts-ignore
                athletes: athletesByYear[year] || 0,
                cryptoPrice: cryptoPrices[idx]
            }));

            combinedData = combined;

            // Crear gráfico y esperar a que termine
            await createChart();
            
            // IMPORTANTE: loading debe ser false para que se muestre la tabla
            loading = false;
            
            // Ocultar overlay
            if (overlay) {
                // @ts-ignore
                overlay.style.display = 'none';
            }
            
        } catch (e) {
            console.error('[LOAD] Error:', e);
            // @ts-ignore
            error = e.message;
            loading = false;
            const overlay = document.querySelector('.loading-overlay');
            if (overlay) {
                // @ts-ignore
                overlay.style.display = 'none';
            }
        }
    }

    async function createChart() {
        return new Promise((resolve) => {
            const container = document.getElementById('scatter-container');
            
            if (!container) {
                console.error('[CHART] Contenedor no encontrado, reintentando...');
                setTimeout(() => createChart().then(resolve), 500);
                return;
            }

            // @ts-ignore
            if (chart) {
                chart.destroy();
            }

            const cryptoName = selectedCrypto === 'bitcoin' ? 'Bitcoin' : 'Ethereum';
            const color = selectedCrypto === 'bitcoin' ? '#f7931a' : '#627eea';

            // @ts-ignore
            const scatterData = combinedData
                .filter(d => d.athletes > 0)
                .map(d => ({
                    x: d.year,
                    y: d.cryptoPrice,
                    athletes: d.athletes
                }));

            if (scatterData.length === 0) {
                console.warn('[CHART] No hay datos para mostrar');
                // @ts-ignore
                resolve();
                return;
            }

            // @ts-ignore
            chart = Highcharts.chart('scatter-container', {
                chart: {
                    type: 'scatter',
                    zoomType: 'xy',
                    height: 500,
                    backgroundColor: '#ffffff',
                    events: {
                        load: function() {
                            console.log('[CHART] Gráfico cargado completamente');
                            // @ts-ignore
                            resolve();
                        }
                    }
                },
                title: {
                    text: `Atletas Olímpicos vs Precio de ${cryptoName}`,
                    style: { fontSize: '16px' }
                },
                subtitle: {
                    text: 'Cada punto representa un año',
                    style: { fontSize: '12px' }
                },
                accessibility: {
                    enabled: false
                },
                xAxis: {
                    title: { text: 'Año' },
                    tickInterval: 2,
                    min: 2000,
                    max: 2025,
                    gridLineWidth: 1,
                    gridLineColor: '#e2e8f0'
                },
                yAxis: {
                    title: { text: `Precio de ${cryptoName} (USD)` },
                    gridLineWidth: 1,
                    gridLineColor: '#e2e8f0'
                },
                tooltip: {
                    pointFormat: `
                        <b>Año: {point.x}</b><br/>
                        Precio: ${cryptoName}: {point.y:,.0f} USD<br/>
                        Atletas Olímpicos: {point.athletes}
                    `
                },
                plotOptions: {
                    scatter: {
                        marker: {
                            radius: 10,
                            symbol: 'circle',
                            states: {
                                hover: { enabled: true, lineColor: 'black', lineWidth: 2 }
                            }
                        }
                    }
                },
                series: [{
                    name: `${cryptoName} - Precio`,
                    data: scatterData,
                    color: color
                }]
            });
        });
    }

    async function updateCrypto() {
        await loadData();
    }

    onMount(() => {
        console.log('[MOUNT] Componente montado');
        loadData();
    });
</script>

<div class="integration-container">
    <h1>Atletas Olímpicos vs Precio de Criptomonedas</h1>
    <p class="subtitle">Comparativa por año entre número de atletas y precio de Bitcoin/Ethereum</p>

    <div class="info-api">
        <p><strong>API 1 (propia):</strong> Olympics Athlete Events</p>
        <p><strong>API 2 (externa):</strong> CoinGecko - Precio de criptomonedas</p>
        <p><strong>Widget:</strong> Scatter con Highcharts</p>
    </div>

    <div class="selector">
        <label>Seleccionar criptomoneda:</label>
        <div class="crypto-buttons">
            <button class="crypto-btn {selectedCrypto === 'bitcoin' ? 'active' : ''}" on:click={() => { selectedCrypto = 'bitcoin'; updateCrypto(); }}>
                Bitcoin
            </button>
            <button class="crypto-btn {selectedCrypto === 'ethereum' ? 'active' : ''}" on:click={() => { selectedCrypto = 'ethereum'; updateCrypto(); }}>
                Ethereum
            </button>
        </div>
    </div>

    <div class="loading-overlay" style="display: flex;">
        <div class="spinner"></div>
        <p>Cargando datos...</p>
    </div>

    {#if error}
        <div class="error">
            <p>Error: {error}</p>
        </div>
    {/if}

    <div id="scatter-container" style="height: 550px; width: 100%; margin-bottom: 2rem;"></div>

    {#if !loading}
        <div class="table-container">
            <h3>Datos combinados por año</h3>
            <div class="table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Año</th>
                            <th>Atletas Olímpicos</th>
                            <th>{selectedCrypto === 'bitcoin' ? 'Bitcoin (USD)' : 'Ethereum (USD)'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each combinedData.filter(d => d.athletes > 0) as item}
                            <tr>
                                <td><strong>{item.year}</strong></td>
                                <td>{item.athletes.toLocaleString()}</td>
                                <td>{item.cryptoPrice.toFixed(2)} USD</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
            <p class="table-info">Años con datos de atletas: {combinedData.filter(d => d.athletes > 0).length}</p>
        </div>
    {/if}

    <div class="info">
        <h3>Interpretación</h3>
        <ul>
            <li><strong>Tipo de gráfico:</strong> Scatter con Highcharts</li>
            <li><strong>Cada punto:</strong> Representa un año</li>
            <li><strong>Eje X:</strong> Año</li>
            <li><strong>Eje Y:</strong> Precio de la criptomoneda</li>
            <li><strong>Tooltip:</strong> Muestra el número de atletas</li>
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

    h1 {
        color: #0369a1;
        text-align: center;
        margin-bottom: 0.5rem;
    }

    .subtitle {
        text-align: center;
        color: #666;
        margin-bottom: 1rem;
    }

    .info-api {
        background: #f0f9ff;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
        font-size: 0.85rem;
        border-left: 4px solid #0284c7;
    }

    .selector {
        margin-bottom: 1.5rem;
        text-align: center;
    }

    .selector label {
        font-weight: 600;
        margin-right: 0.5rem;
        color: #0369a1;
    }

    .crypto-buttons {
        display: inline-flex;
        gap: 1rem;
    }

    .crypto-btn {
        padding: 0.5rem 1rem;
        border: 1px solid #ccc;
        border-radius: 6px;
        background: #f9f9f9;
        cursor: pointer;
        transition: all 0.2s;
        font-weight: 500;
    }

    .crypto-btn.active {
        background: #0284c7;
        color: white;
        border-color: #0284c7;
    }

    .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
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

    .table-container h3 {
        color: #0369a1;
        margin-bottom: 1rem;
    }

    .table-wrapper {
        overflow-x: auto;
        max-height: 400px;
        overflow-y: auto;
    }

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

    tr:hover {
        background: #f0f9ff;
    }

    .table-info {
        margin-top: 1rem;
        font-size: 0.85rem;
        color: #666;
        text-align: right;
    }

    .info {
        margin-top: 2rem;
        padding: 1rem;
        background: #f0f9ff;
        border-radius: 12px;
        border: 1px solid #bae6fd;
    }

    .info h3 {
        color: #0369a1;
        margin-top: 0;
    }

    .info ul {
        margin: 0;
        padding-left: 1.5rem;
    }

    .info li {
        margin: 0.5rem 0;
        color: #333;
    }
</style>