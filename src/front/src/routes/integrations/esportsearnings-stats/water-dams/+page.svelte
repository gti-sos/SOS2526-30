<script>
    import { onMount, tick } from 'svelte';

    let loading = $state(true);
    let error = $state(null);

    onMount(async () => {
        await tick();
        try {
            // 1. TUS DATOS (eSports)
            let resEsports = await fetch('/api/v2/esportsearnings-stats');
            let esportsData = await resEsports.json();
            
            if (!esportsData || esportsData.length === 0) {
                await fetch('/api/v2/esportsearnings-stats/loadInitialData');
                resEsports = await fetch('/api/v2/esportsearnings-stats');
                esportsData = await resEsports.json();
            }

            // 2. DATOS GRUPO 27 (Water Dams) - Llamada Directa
            const resDams = await fetch('https://sos2526-27.onrender.com/api/v1/water-dams');
            if (!resDams.ok) throw new Error('Bloqueo de CORS o caída en la API G27');
            const damsData = await resDams.json();

            // 3. Cruzar datos dinámicamente
            const maxRows = Math.min(esportsData.length, damsData.length, 6);
            const labels = [];
            const rawEsports = [];
            const rawDams = [];
            
            for(let i = 0; i < maxRows; i++) {
                const gameName = esportsData[i].game_name || 'Juego';
                
                const keys = Object.keys(damsData[i]);
                const strKey = keys.find(k => typeof damsData[i][k] === 'string' && k !== 'id' && k !== '_id') || keys[0];
                const numKey = keys.find(k => typeof damsData[i][k] === 'number' && k !== 'year' && k !== 'id') || keys[1];

                const damName = damsData[i][strKey] || `Presa ${i+1}`;
                
                labels.push(`${gameName.substring(0, 10)} / ${String(damName).substring(0, 10)}`);
                rawEsports.push(esportsData[i].player_no || 0);
                rawDams.push(damsData[i][numKey] || 0);
            }

            // 4. Normalizar los datos (0 a 100%) para el radar
            const maxE = Math.max(...rawEsports) || 1;
            const maxD = Math.max(...rawDams) || 1;
            
            const normEsports = rawEsports.map(v => Math.round((v / maxE) * 100));
            const normDams = rawDams.map(v => Math.round((v / maxD) * 100));

            loading = false;

            // 5. NUEVA FUNCIÓN CON LA CORRECCIÓN DEL "WINDOW"
            const renderChart = () => {
                // Truco clave: Buscar en window para evitar errores de Svelte
                if (typeof window !== 'undefined' && !window.ApexCharts) {
                    setTimeout(renderChart, 100);
                    return;
                }

                const options = {
                    series: [
                        { name: 'eSports (Proporción %)', data: normEsports },
                        { name: 'Presas G27 (Proporción %)', data: normDams }
                    ],
                    chart: { type: 'radar', height: 500, toolbar: { show: false } },
                    labels: labels,
                    stroke: { width: 2 },
                    fill: { opacity: 0.3 },
                    markers: { size: 5, hover: { size: 8 } },
                    title: { text: 'Análisis Relativo: eSports vs Presas de Agua', align: 'center', style: { color: '#7e22ce' } },
                    yaxis: { show: false }, 
                    tooltip: {
                        y: { formatter: function(val) { return val + "% del valor máximo"; } }
                    }
                };

                const chartContainer = document.querySelector("#chart-g27");
                if (chartContainer) {
                    chartContainer.innerHTML = ''; 
                    // Usamos window.ApexCharts igual que tu compañero
                    const chart = new window.ApexCharts(chartContainer, options);
                    chart.render();
                }
            };

            // Disparamos la función
            renderChart();

        } catch (err) { 
            console.error(err);
            error = err.message; 
            loading = false; 
        }
    });
</script>
