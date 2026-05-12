<script>
    import { onMount, tick, onDestroy } from 'svelte';

    let chartContainer;
    let errorMessage = $state('');
    let loading = $state(true);
    
    // Variables para el filtro interactivo
    let selectedRange = $state('all');
    let allFetchedData = [];
    let apexChart = null; // Guardamos la instancia de la gráfica para poder actualizarla

    onMount(async () => {
        await tick();
        try {
            // 1. Pedimos los datos a tu API v2
            let response = await fetch('/api/v2/esportsearnings-stats?t=' + Date.now());
            if (!response.ok) throw new Error('Error al cargar los datos de la API');
            
            let rawData = await response.json();
            let data = Array.isArray(rawData) ? rawData : (rawData.data || []);

            // SALVAVIDAS: Si Render ha borrado la base de datos
            if (data.length === 0) {
                await fetch('/api/v2/esportsearnings-stats/loadInitialData');
                response = await fetch('/api/v2/esportsearnings-stats?t=' + Date.now());
                rawData = await response.json();
                data = Array.isArray(rawData) ? rawData : (rawData.data || []);
            }

            if (data.length === 0) {
                throw new Error("No hay datos disponibles en la base de datos.");
            }

            // Guardamos todos los datos puros en la variable global para poder filtrarlos luego
            allFetchedData = data;
            loading = false;
            await tick(); 
            
            // Dibujamos la gráfica por primera vez
            filterAndRenderChart();

        } catch (error) {
            console.error(error);
            errorMessage = error.message;
            loading = false;
        }
    });

    // Función mágica que filtra los datos y actualiza la gráfica en vivo
    const filterAndRenderChart = () => {
        if (typeof window === 'undefined' || !window.ApexCharts) {
            setTimeout(filterAndRenderChart, 100);
            return;
        }

        // 1. FILTRAR POR AÑO
        let filteredData = allFetchedData;
        if (selectedRange !== 'all') {
            const [start, end] = selectedRange.split('-').map(Number);
            filteredData = allFetchedData.filter(d => (d.year || 0) >= start && (d.year || 0) <= end);
        }

        // 2. AGRUPAR Y SUMAR
        const countryStats = {};
        filteredData.forEach(d => {
            const country = d.country || 'Desconocido';
            if (!countryStats[country]) {
                countryStats[country] = { money: 0, tournaments: 0 };
            }
            countryStats[country].money += (d.total_money || 0) / 1000000;
            countryStats[country].tournaments += (d.tournament_no || 0);
        });

        // 3. DAR FORMATO AL TREEMAP
        const treemapData = Object.keys(countryStats).map(country => ({
            x: country,
            y: Number(countryStats[country].money.toFixed(2)),
            tournaments: countryStats[country].tournaments
        })).sort((a, b) => b.y - a.y);

        // Si todos los valores son cero (no hubo datos en esa década), metemos un aviso visual
        if (treemapData.length === 0 || treemapData.every(d => d.y === 0)) {
            treemapData.push({ x: "Sin datos en este rango", y: 0, tournaments: 0 });
        }

        // 4. DIBUJAR O ACTUALIZAR
        if (!apexChart) {
            // Primera vez: Creamos la gráfica desde cero
            const options = {
                series: [{ name: 'Ganancias', data: treemapData }],
                chart: {
                    type: 'treemap',
                    height: 550,
                    toolbar: { show: false },
                    animations: { enabled: true, easing: 'easeinout', speed: 800 } 
                },
                title: { 
                    text: '💰 Mapa de Calor (Treemap): Ganancias eSports por País', 
                    align: 'center',
                    style: { color: '#064e3b', fontSize: '18px', fontWeight: 'bold' }
                },
                colors: ['#10b981'],
                plotOptions: {
                    treemap: {
                        enableShades: true,
                        shadeIntensity: 0.5,
                        reverseNegativeShade: true,
                        colorScale: {
                            ranges: [
                                { from: -1, to: 10, color: '#d1fae5' },    
                                { from: 10.01, to: 50, color: '#6ee7b7' }, 
                                { from: 50.01, to: 200, color: '#10b981' }, 
                                { from: 200.01, to: 99999, color: '#047857' } 
                            ]
                        }
                    }
                },
                tooltip: {
                    custom: function({series, seriesIndex, dataPointIndex, w}) {
                        const data = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
                        return `
                            <div style="padding: 12px; background: white; border: 2px solid #10b981; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                <h3 style="margin: 0 0 8px 0; color: #064e3b;">🌍 ${data.x}</h3>
                                <p style="margin: 0 0 4px 0;">Dinero Total: <b>${data.y} Millones $</b></p>
                                <p style="margin: 0;">Nº Torneos: <b>${data.tournaments}</b></p>
                            </div>
                        `;
                    }
                }
            };

            if (chartContainer) {
                chartContainer.innerHTML = ''; 
                apexChart = new window.ApexCharts(chartContainer, options);
                apexChart.render();
            }
        } else {
            // Las siguientes veces (al usar el filtro): Actualizamos los datos en vivo
            apexChart.updateSeries([{ data: treemapData }]);
        }
    };

    // ¡EL TRUCO PARA EL HOT-RELOAD DE VITE!
    // Cuando guardas el archivo en tu editor, Svelte destruye la gráfica vieja y pinta la nueva sin duplicarla.
    onDestroy(() => {
        if (apexChart) {
            apexChart.destroy();
        }
    });
</script>
