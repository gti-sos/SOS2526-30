<script>
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';

    let loading = true;
    let error = null;

    onMount(async () => {
        try {
            // 1. Obtener TUS datos de eSports
            const resEsports = await fetch('/api/v2/esportsearnings-stats');
            if (!resEsports.ok) throw new Error('Error al cargar eSports');
            const esportsData = await resEsports.json();

            // 2. Obtener datos de la API externa CoinCap (Criptomonedas)
            const resCoin = await fetch('https://api.coincap.io/v2/assets?limit=10');
            if (!resCoin.ok) throw new Error('Error al conectar con CoinCap');
            const coinData = await resCoin.json();

            // --- PREPARAR DATOS ESPORTS ---
            // Agrupamos el dinero por juego
            const moneyByGame = {};
            esportsData.forEach(item => {
                moneyByGame[item.game_name] = (moneyByGame[item.game_name] || 0) + item.total_money;
            });
            
            // Ordenamos de mayor a menor y nos quedamos con el Top 10
            const sortedGames = Object.entries(moneyByGame).sort((a, b) => b[1] - a[1]).slice(0, 10);
            
            const gameNames = sortedGames.map(g => g[0]);
            // Lo dividimos entre 1 millón para que los números en la gráfica sean más legibles
            const gameMoney = sortedGames.map(g => g[1] / 1000000); 

            // --- PREPARAR DATOS CRIPTOMONEDAS ---
            const cryptoNames = coinData.data.map(c => c.name);
            const cryptoPrices = coinData.data.map(c => parseFloat(c.priceUsd));

            loading = false;

            // 3. Dibujar la Gráfica de Barras
            setTimeout(() => {
                const ctx = document.getElementById('myChart');
                new Chart(ctx, {
                    type: 'bar', // Tipo de gráfico: BARRAS (Permitido)
                    data: {
                        labels: ['Top 1', 'Top 2', 'Top 3', 'Top 4', 'Top 5', 'Top 6', 'Top 7', 'Top 8', 'Top 9', 'Top 10'],
                        datasets: [
                            {
                                label: 'Premios eSports (Millones $)',
                                data: gameMoney,
                                backgroundColor: 'rgba(147, 51, 234, 0.7)', // Morado
                                borderColor: 'rgba(147, 51, 234, 1)',
                                borderWidth: 1
                            },
                            {
                                label: 'Precio Criptomoneda ($)',
                                data: cryptoPrices,
                                backgroundColor: 'rgba(16, 185, 129, 0.7)', // Verde
                                borderColor: 'rgba(16, 185, 129, 1)',
                                borderWidth: 1
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            title: {
                                display: true,
                                text: '🎮 Top 10 Juegos eSports vs 💰 Top 10 Criptomonedas',
                                font: { size: 16 }
                            },
                            tooltip: {
                                callbacks: {
                                    // Este truco nos permite ver el nombre del juego o de la cripto al pasar el ratón
                                    afterLabel: function(context) {
                                        const index = context.dataIndex;
                                        if (context.datasetIndex === 0) {
                                            return 'Juego: ' + gameNames[index];
                                        } else {
                                            return 'Cripto: ' + cryptoNames[index];
                                        }
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                type: 'logarithmic', // Usamos escala logarítmica porque hay mucha diferencia de dinero
                                title: {
                                    display: true,
                                    text: 'Valor en USD $ (Escala Logarítmica)'
                                }
                            }
                        }
                    }
                });
            }, 100);

        } catch (err) {
            error = err.message;
            loading = false;
        }
    });
</script>

<svelte:head>
    <title>Integración CoinCap</title>
</svelte:head>

<div class="container">
    <a href="/integrations/esportsearnings-stats" class="back-link">← Volver a mis integraciones</a>
    
    <h1>Integración: eSports vs Criptomonedas (CoinCap)</h1>

    {#if loading}
        <div class="loading">Cargando la economía digital...</div>
    {:else if error}
        <div class="error">❌ {error}</div>
    {:else}
        <div class="chart-wrapper">
            <canvas id="myChart"></canvas>
        </div>
        
        <div class="info">
            <h3>📖 Detalles de la Integración</h3>
            <ul>
                <li><strong>API Propia:</strong> <code>/api/v2/esportsearnings-stats</code> (Top juegos más ricos)</li>
                <li><strong>API Externa:</strong> <code>https://api.coincap.io/v2/assets</code> (Top criptomonedas)</li>
                <li><strong>Visualización:</strong> Chart.js (Bar) - Combinación permitida</li>
            </ul>
        </div>
    {/if}
</div>

<style>
    .container { max-width: 1000px; margin: 2rem auto; padding: 2rem; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .back-link { color: #7e22ce; text-decoration: none; font-weight: bold; margin-bottom: 1rem; display: inline-block; }
    h1 { color: #7e22ce; text-align: center; border-bottom: 2px solid #a855f7; padding-bottom: 0.5rem; margin-bottom: 2rem; }
    .chart-wrapper { width: 100%; height: 400px; }
    .loading { text-align: center; color: #a855f7; font-weight: bold; padding: 3rem; }
    .error { text-align: center; color: #dc2626; background: #fee2e2; padding: 1rem; border-radius: 8px; }
    .info { margin-top: 2rem; padding: 1rem; background: #faf5ff; border-radius: 8px; border-left: 4px solid #7e22ce; }
</style>