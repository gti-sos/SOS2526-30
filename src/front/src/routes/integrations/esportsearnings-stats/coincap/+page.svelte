<script>
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';

    let loading = $state(true);
    let error = $state(null);

    onMount(async () => {
        try {
            // 1. CARGAMOS TUS DATOS (Auto-llenado)
            let resEsports = await fetch('/api/v2/esportsearnings-stats');
            let esportsData = await resEsports.json();
            
            if (!esportsData || esportsData.length === 0) {
                await fetch('/api/v2/esportsearnings-stats/loadInitialData');
                resEsports = await fetch('/api/v2/esportsearnings-stats');
                esportsData = await resEsports.json();
            }

            // 2. API EXTERNA (Con proxy para saltar AdBlockers)
            const resCoin = await fetch('https://corsproxy.io/?https://api.coincap.io/v2/assets?limit=10');
            if (!resCoin.ok) throw new Error('Bloqueado por el navegador (Desactiva AdBlock)');
            const coinData = await resCoin.json();

            const moneyByGame = {};
            esportsData.forEach(item => {
                if(item.game_name) moneyByGame[item.game_name] = (moneyByGame[item.game_name] || 0) + item.total_money;
            });
            
            const sortedGames = Object.entries(moneyByGame).sort((a, b) => b[1] - a[1]).slice(0, 10);
            const gameNames = sortedGames.map(g => g[0]);
            const gameMoney = sortedGames.map(g => g[1] / 1000000); 

            const cryptoNames = coinData.data.map(c => c.name);
            const cryptoPrices = coinData.data.map(c => parseFloat(c.priceUsd));

            loading = false;

            setTimeout(() => {
                const ctx = document.getElementById('myChart');
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Top 1', 'Top 2', 'Top 3', 'Top 4', 'Top 5', 'Top 6', 'Top 7', 'Top 8', 'Top 9', 'Top 10'],
                        datasets: [
                            { label: 'Premios eSports (Millones $)', data: gameMoney, backgroundColor: 'rgba(147, 51, 234, 0.7)' },
                            { label: 'Precio Criptomoneda ($)', data: cryptoPrices, backgroundColor: 'rgba(16, 185, 129, 0.7)' }
                        ]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    afterLabel: function(context) {
                                        return context.datasetIndex === 0 ? 'Juego: ' + gameNames[context.dataIndex] : 'Cripto: ' + cryptoNames[context.dataIndex];
                                    }
                                }
                            }
                        },
                        scales: { y: { type: 'logarithmic' } }
                    }
                });
            }, 100);

        } catch (err) {
            error = err.message;
            loading = false;
        }
    });
</script>
