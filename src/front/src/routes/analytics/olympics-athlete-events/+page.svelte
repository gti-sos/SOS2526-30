<script>
    import { onMount } from 'svelte';
    
    let loading = true;
    let error = null;
    let chart = null;
    
    // Colores vivos para los rangos
    const coloresRangos = {
        '1900-1910': '#FF0000',
        '1910-1920': '#FF4500',
        '1920-1930': '#FF8C00',
        '1930-1940': '#FFD700',
        '1940-1950': '#ADFF2F',
        '1950-1960': '#00FF00',
        '1960-1970': '#00FF7F',
        '1970-1980': '#00FFFF',
        '1980-1990': '#00BFFF',
        '1990-2000': '#1E90FF',
        '2000-2010': '#9370DB',
        '2010-2020': '#FF00FF'
    };
    
    onMount(() => {
        setTimeout(() => {
            initChart();
        }, 100);
    });
    
    async function cargarDatosEjemplo() {
        console.log('Cargando datos de ejemplo...');
        const apiUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api/v2/olympics-athlete-events/loadInitialData'
            : '/api/v2/olympics-athlete-events/loadInitialData';
        
        const res = await fetch(apiUrl);
        if (!res.ok) {
            throw new Error('Error al cargar datos de ejemplo');
        }
        console.log('Datos de ejemplo cargados correctamente');
    }
    
    async function initChart() {
        try {
            console.log('Iniciando carga del gráfico...');
            
            let apiUrl = window.location.hostname === 'localhost' 
                ? 'http://localhost:3000/api/v2/olympics-athlete-events?limit=500'
                : '/api/v2/olympics-athlete-events?limit=500';
            
            let res = await fetch(apiUrl);
            
            // Si no hay datos (404 o datos vacíos), cargar datos de ejemplo
            if (res.status === 404) {
                console.log('No hay datos, cargando datos de ejemplo...');
                await cargarDatosEjemplo();
                // Reintentar la petición después de cargar los datos
                res = await fetch(apiUrl);
            }
            
            if (!res.ok) {
                throw new Error(`Error ${res.status}: ${res.statusText}`);
            }
            
            const data = await res.json();
            let athletes = data.data || [];
            
            console.log('Atletas recibidos:', athletes.length);
            
            // Si no hay atletas después de cargar, mostrar error
            if (athletes.length === 0) {
                error = 'No hay datos disponibles. Por favor, recarga la página.';
                loading = false;
                return;
            }
            
            // Asignar altura por defecto si no tiene
            athletes = athletes.map(athlete => {
                if (!athlete.height || athlete.height <= 0) {
                    if (athlete.sport === 'Basketball') return { ...athlete, height: 200 };
                    if (athlete.sport === 'Volleyball') return { ...athlete, height: 190 };
                    if (athlete.sport === 'Swimming') return { ...athlete, height: 185 };
                    if (athlete.sport === 'Athletics') return { ...athlete, height: 175 };
                    if (athlete.sport === 'Gymnastics') return { ...athlete, height: 165 };
                    return { ...athlete, height: 175 };
                }
                return athlete;
            });
            
            const validAthletes = athletes.filter(a => a.year && a.year >= 1900 && a.year <= 2020);
            
            console.log('Atletas válidos:', validAthletes.length);
            
            if (validAthletes.length === 0) {
                error = 'No hay atletas con datos de altura válidos.';
                loading = false;
                return;
            }
            
            // Crear rangos de 10 años
            const yearsRange = {};
            for (let i = 1900; i < 2020; i += 10) {
                const key = `${i}-${i+10}`;
                yearsRange[key] = {
                    count: 0,
                    color: coloresRangos[key] || '#888888',
                    minDate: i,
                    maxDate: i + 10
                };
            }
            
            // Preparar datos para burbujas
            const bubbleData = [];
            
            validAthletes.forEach(athlete => {
                let rangeKey = null;
                let rangeColor = '#888888';
                
                for (const [key, range] of Object.entries(yearsRange)) {
                    if (athlete.year >= range.minDate && athlete.year < range.maxDate) {
                        rangeKey = key;
                        rangeColor = range.color;
                        yearsRange[key].count++;
                        break;
                    }
                }
                
                bubbleData.push({
                    name: athlete.name,
                    x: athlete.year,
                    y: athlete.height,
                    z: athlete.weight ? Math.min(athlete.weight / 20, 12) : 5,
                    team: athlete.team,
                    sport: athlete.sport,
                    color: rangeColor,
                    rangeKey: rangeKey,
                    custom: {
                        height: athlete.height,
                        weight: athlete.weight || 70,
                        sport: athlete.sport,
                        team: athlete.team,
                        rangeKey: rangeKey
                    }
                });
            });
            
            // Datos para el pie chart
            const pieData = Object.entries(yearsRange)
                .filter(([key, value]) => value.count > 0)
                .map(([key, value]) => ({
                    name: key.split('-')[0],  // "2000" en lugar de "2000-2010"
                    y: value.count,
                    color: value.color,
                    custom: {
                        minDate: value.minDate,
                        maxDate: value.maxDate,
                        rangeKey: key
                    }
                }));
            
            // Importar Highcharts
            const Highcharts = await import('highcharts');
            await import('highcharts/highcharts-more');
            const HC = Highcharts.default;
            
            const container = document.getElementById('container');
            if (!container) {
                throw new Error('Contenedor no encontrado');
            }
            
            // Renderizar gráfico
            HC.chart('container', {
                chart: {
                    type: 'bubble',
                    polar: true,
                    height: 700
                },
                title: {
                    text: 'Relación Altura vs Año de Atletas Olímpicos',
                    style: { fontSize: '16px' }
                },
                subtitle: {
                    text: `Cada burbuja representa un atleta | Color = Rango de años | Total: ${bubbleData.length} atletas`,
                    style: { fontSize: '12px' }
                },
                accessibility: { enabled: false },
                xAxis: {
                    min: 1900,
                    max: 2020,
                    tickInterval: 10,
                    gridLineWidth: 0,
                    lineWidth: 0,
                    labels: { enabled: true, rotation: 0, step: 2 }
                },
                yAxis: {
                    min: 140,
                    max: 220,
                    labels: { format: '{value} cm' }
                },
                tooltip: {
                    pointFormat: `
                        <b>{point.name}</b><br/>
                        Año: {point.x}<br/>
                        Altura: {point.y} cm<br/>
                        Peso: {point.custom.weight} kg<br/>
                        Deporte: {point.custom.sport}<br/>
                        País: {point.custom.team}<br/>
                        Rango: {point.custom.rangeKey}
                    `
                },
                plotOptions: {
                    bubble: {
                        minSize: 3,
                        maxSize: 12,
                        tooltip: { followPointer: true },
                        states: {
                            hover: {
                                opacity: 1,
                                lineWidth: 2,
                                lineColor: 'black'
                            }
                        }
                    },
                    pie: {
                        size: '38%',
                        innerSize: '82%',
                        dataLabels: { 
                            enabled: true,
                            distance: -30,
                            format: '{point.percentage:.0f}%',
                            allowOverlap: true,
                            style: {
                                fontSize: '10px',
                                fontWeight: 'bold',
                                textOutline: '0px',
                                color: 'black'
                            }
                        },
                        borderWidth: 2,
                        borderColor: 'white',
                        point: {
                            events: {
                                mouseOver() {
                                    const point = this;
                                    const chart = this.series.chart;
                                    const bubbleSeries = chart.series[0];
                                    const rangeKey = point.options.custom.rangeKey;
                                    
                                    bubbleSeries.points.forEach(p => {
                                        if (p.graphic) {
                                            if (p.rangeKey === rangeKey) {
                                                p.graphic.attr({ 
                                                    opacity: 1, 
                                                    lineWidth: 2, 
                                                    stroke: 'black'
                                                });
                                            } else {
                                                p.graphic.attr({ opacity: 0.2, lineWidth: 0 });
                                            }
                                        }
                                    });
                                },
                                mouseOut() {
                                    const chart = this.series.chart;
                                    const bubbleSeries = chart.series[0];
                                    
                                    bubbleSeries.points.forEach(p => {
                                        if (p.graphic) {
                                            p.graphic.attr({ opacity: 1, lineWidth: 0 });
                                        }
                                    });
                                }
                            }
                        }
                    }
                },
                series: [
                    {
                        name: 'Atletas',
                        data: bubbleData,
                        type: 'bubble',
                        maxSize: 12,
                        minSize: 3,
                        color: 'point.color'
                    },
                    {
                        type: 'pie',
                        name: 'Rangos de años',
                        size: '38%',
                        innerSize: '82%',
                        zIndex: -1,
                        data: pieData
                    }
                ]
            });
            
            loading = false;
            
        } catch (e) {
            console.error('Error:', e);
            error = e.message;
            loading = false;
        }
    }
</script>

<div class="analytics-container">
    <h1>📊 Estadísticas de Atletas Olímpicos</h1>
    <p class="subtitle">Relación entre altura de atletas y años de participación (colores por rango de años)</p>
    
    <div id="container" style="height: 700px; width: 100%;"></div>    
    {#if error}
        <div class="error">
            <p>❌ Error: {error}</p>
        </div>
    {/if}
    
    <div class="info">
    <h3>Interpretacion del gráfico</h3>
    <ul>
        <li><strong>Cada burbuja</strong> representa un atleta olímpico</li>
        <li><strong>Eje X (horizontal):</strong> Año en que participó el atleta</li>
        <li><strong>Eje Y (vertical):</strong> Altura del atleta en centímetros</li>
        <li><strong>Tamaño de la burbuja:</strong> Peso del atleta (a mayor peso, burbuja más grande)</li>
        <li><strong>Color de la burbuja:</strong> Rango de años al que pertenece (cada década tiene un color distinto)</li>
        <li><strong>Círculo central:</strong> Porcentaje de atletas por cada década</li>
        <li><strong>Interacción:</strong> Pasa el ratón sobre el círculo central para resaltar las burbujas de esa década</li>
    </ul>
</div>
</div>

<style>
    .analytics-container {
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
        margin-bottom: 2rem;
    }
    
    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.95);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
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