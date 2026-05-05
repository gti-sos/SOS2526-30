<script>
    import { onMount, tick } from 'svelte';
    import Chart from 'chart.js/auto';

    let loading = true;
    let error = null;
    let chart = null;

    onMount(async () => {
        await tick();
        try {
            // 1. CARGA DE TUS DATOS (eSports)
            let resEsports = await fetch('/api/v2/esportsearnings-stats');
            let esportsData = await resEsports.json();
            
            // Auto-carga si la base de datos está vacía en Render
            if (!esportsData || esportsData.length === 0) {
                await fetch('/api/v2/esportsearnings-stats/loadInitialData');
                resEsports = await fetch('/api/v2/esportsearnings-stats');
                esportsData = await resEsports.json();
            }

            // 2. NUEVA API EXTERNA: FakeStore (¡Cero bloqueos CORS!)
            const resStore = await fetch('https://fakestoreapi.com/products?limit=10');
            const storeData = await resStore.json();

            // Preparar datos base
            const gameNames = esportsData.slice(0, 10).map(g => g.game_name || 'Juego');
            const gameMoney = esportsData.slice(0, 10).map(g => g.total_money / 1000000); // En millones
            
            const productNames = storeData.map(p => p.title.substring(0, 15) + '...');
            const productPrices = storeData.map(p => p.price);

            // 3. Adaptamos los datos para el formato X/Y que pide el gráfico Scatter
            const scatterEsports = gameMoney.map((m, i) => ({ x: i + 1, y: m }));
            const scatterStore = productPrices.map((p, i) => ({ x: i + 1, y: p }));

            loading = false;
            
            // Esperamos un instante para asegurar que el canvas existe
            await new Promise(resolve => setTimeout(resolve, 150));

            const ctx = document.getElementById('chartCanvas');
            if (!ctx) throw new Error('No se pudo encontrar el lienzo (canvas) para la gráfica');

            // 4. CREAR GRÁFICO (Tipo Scatter con Chart.js)
            chart = new Chart(ctx, {
                type: 'scatter', 
                data: {
                    datasets: [
                        { 
                            label: 'eSports ($ Millones)', 
                            data: scatterEsports, 
                            backgroundColor: '#a855f7', 
                            pointRadius: 8,
                            pointHoverRadius: 10
                        },
                        { 
                            label: 'FakeStore (Precio $)', 
                            data: scatterStore, 
                            backgroundColor: '#10b981', 
                            pointRadius: 8,
                            pointHoverRadius: 10
                        }
                    ]
                },
                options: {
                    responsive: true, 
                    maintainAspectRatio: false,
                    scales: {
                        x: { 
                            title: { display: true, text: 'Posición en el Top (1 al 10)', color: '#7e22ce', font: { weight: 'bold' } },
                            ticks: { stepSize: 1 }
                        },
                        y: { 
                            title: { display: true, text: 'Valor Numérico ($)', color: '#7e22ce', font: { weight: 'bold' } },
                            type: 'logarithmic' // Escala logarítmica porque los millones de eSports aplastan los precios de la tienda
                        }
                    },
                    plugins: { 
                        title: {
                            display: true,
                            text: 'eSports vs FakeStore (Gráfico de Dispersión)',
                            color: '#7e22ce',
                            font: { size: 16 }
                        },
                        tooltip: { 
                            callbacks: { 
                                label: (context) => {
                                    if (context.datasetIndex === 0) {
                                        return `Juego: ${gameNames[context.dataIndex]} (${context.raw.y} M$)`;
                                    } else {
                                        return `Producto: ${productNames[context.dataIndex]} (${context.raw.y} $)`;
                                    }
                                } 
                            } 
                        } 
                    }
                }
            });
        } catch (err) { 
            console.error(err);
            error = err.message; 
            loading = false; 
        }
    });
</script>

<div class="container">
    <a href="/integrations/esportsearnings-stats" class="back-link">← Volver a mis integraciones</a>
    <h1>🎮 eSports vs 🛒 Tienda (FakeStore)</h1>
    <p class="subtitle">Gráfico de dispersión (Scatter) comparando premios y precios</p>
    
    <div style="height: 500px; position: relative; margin-top: 2rem;">
        <canvas id="chartCanvas"></canvas>
    </div>
    
    {#if loading}
        <div class="loading">Cargando catálogo de la tienda...</div>
    {/if}
    
    {#if error}
        <div class="error">❌ Error detectado: {error}</div>
    {/if}

    <div class="info-note">
        <p><strong>📊 Ficha Técnica:</strong></p>
        <ul>
            <li><strong>API Local:</strong> eSports Earnings Stats</li>
            <li><strong>API Externa:</strong> FakeStore API (Catálogo de productos)</li>
            <li><strong>Librería:</strong> Chart.js</li>
            <li><strong>Visualización:</strong> Scatter (Gráfico de dispersión)</li>
        </ul>
    </div>
</div>

<style>
    .container { 
        max-width: 1000px; 
        margin: 2rem auto; 
        padding: 2rem; 
        background: white; 
        border-radius: 16px; 
        border: 1px solid #e9d5ff; 
        box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }
    .back-link { color: #7e22ce; text-decoration: none; display: inline-block; margin-bottom: 1rem; font-weight: bold; }
    .back-link:hover { text-decoration: underline; }
    h1 { color: #7e22ce; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #666; margin-bottom: 1rem; }
    .loading { text-align: center; padding: 3rem; color: #7e22ce; font-weight: bold; }
    .error { text-align: center; padding: 2rem; color: #dc2626; background: #fee2e2; border-radius: 8px; margin-top: 2rem;}
    .info-note { margin-top: 3rem; padding: 1.5rem; background: #faf5ff; border-radius: 8px; font-size: 0.9rem; color: #4b5563; border-left: 4px solid #7e22ce; }
    .info-note ul { margin-top: 0.5rem; padding-left: 1.5rem; }
    .info-note li { margin-bottom: 0.25rem; }
</style>