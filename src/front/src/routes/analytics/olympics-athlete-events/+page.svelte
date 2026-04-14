<script>
    import { onMount } from 'svelte';
    
    let loading = true;
    let error = null;
    
    // Colores distintos para cada rango
    const colores = [
        '#6CDDCA', '#5B8C5A', '#C771F3', '#4D90DB', '#FAB776',
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7C948', '#D4A5A5', '#9B59B6',
        '#3498DB', '#E74C3C', '#2ECC71', '#F39C12', '#1ABC9C',
        '#E67E22', '#16A085', '#C0392B', '#27AE60'
    ];
    
    onMount(() => {
        console.log('Componente montado, iniciando gráfico...');
        initChart();
    });
    
    async function initChart() {
        try {
            console.log('Obteniendo datos de la API...');
            const res = await fetch('/api/v2/olympics-athlete-events?limit=500');
            
            if (!res.ok) {
                throw new Error(`Error ${res.status}: ${res.statusText}`);
            }
            
            const data = await res.json();
            const athletes = data.data || [];
            
            console.log('Atletas recibidos:', athletes.length);
            
            // Filtrar atletas con altura válida
            const validAthletes = athletes.filter(a => a.height && a.height > 0 && a.year && a.year >= 1900 && a.year <= 2020);
            
            console.log('Atletas con altura válida:', validAthletes.length);
            
            if (validAthletes.length === 0) {
                error = 'No hay datos de altura disponibles. Ve a la página de Olympics y carga datos de ejemplo.';
                loading = false;
                return;
            }
            
            // RANGOS DE 5 AÑOS
            const rangos = [];
            for (let i = 1900; i < 2020; i += 5) {
                rangos.push({
                    name: `${i}-${i+5}`,
                    minDate: i,
                    maxDate: i + 5,
                    count: 0,
                    color: colores[Math.floor(i / 5) % colores.length],
                    data: []
                });
            }
            
            // Preparar datos para burbujas
            const bubbleData = [];
            
            validAthletes.forEach(athlete => {
                // Encontrar el rango correspondiente
                const rango = rangos.find(r => athlete.year >= r.minDate && athlete.year < r.maxDate);
                if (rango) {
                    rango.count++;
                    rango.data.push(athlete);
                }
                
                bubbleData.push({
                    name: athlete.name,
                    x: athlete.year,
                    y: athlete.height,
                    z: athlete.weight ? Math.min(athlete.weight / 20, 10) : 4,
                    team: athlete.team,
                    sport: athlete.sport,
                    year: athlete.year,
                    custom: {
                        height: athlete.height,
                        weight: athlete.weight,
                        sport: athlete.sport,
                        team: athlete.team
                    }
                });
            });
            
            // Filtrar rangos que tienen datos
            const pieData = rangos
                .filter(r => r.count > 0)
                .map(r => ({
                    name: r.name,
                    y: r.count,
                    color: r.color,
                    custom: {
                        minDate: r.minDate,
                        maxDate: r.maxDate,
                        data: r.data
                    }
                }));
            
            console.log('Burbujas:', bubbleData.length, 'Rangos con datos:', pieData.length);
            
            // Importar Highcharts
            const Highcharts = await import('highcharts');
            await import('highcharts/highcharts-more');
            const HC = Highcharts.default;
            
            function fillCenter(percentage, decade, chart, customLabel) {
                const labelText = `
                    <div style="text-align: center;">
                        <div style="font-size: 14px; font-weight: bold;">${decade}</div>
                        <div style="font-size: 11px; color: #666;">Atletas</div>
                        <div style="font-size: 18px; font-weight: bold; color: #0284c7;">${percentage.toFixed(1)}%</div>
                    </div>
                `;
                
                if (!customLabel) {
                    customLabel = chart.renderer.label(
                        labelText, 0, 0, void 0, void 0,
                        void 0, true
                    ).css({
                        color: '#000',
                        pointerEvents: 'none',
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        padding: '8px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                        border: '1px solid #ddd',
                        fontSize: '12px'
                    }).add();
                } else {
                    customLabel.attr({ text: labelText });
                }
                
                customLabel.attr({
                    x: (chart.pane[0].center[0] + chart.plotLeft) - customLabel.attr('width') / 2,
                    y: (chart.pane[0].center[1] + chart.plotTop) - customLabel.attr('height') / 2 - 10
                });
                
                return customLabel;
            }
            
            // Renderizar gráfico
            HC.chart('container', {
                chart: {
                    type: 'bubble',
                    polar: true,
                    height: 700,
                    events: {
                        load() {
                            const pieSeries = this.series[1];
                            const totalCount = pieData.reduce((sum, p) => sum + p.y, 0);
                            pieSeries.customLabel = fillCenter(
                                100,
                                '1900-2020',
                                this,
                                pieSeries.customLabel
                            );
                        }
                    }
                },
                title: {
                    text: 'Relación Altura vs Año de Atletas Olímpicos',
                    style: { fontSize: '16px' }
                },
                subtitle: {
                    text: `Cada burbuja representa un atleta | Total: ${bubbleData.length} atletas | Rangos de 5 años`,
                    style: { fontSize: '12px' }
                },
                accessibility: { enabled: false },
                xAxis: {
                    title: { text: 'Año' },
                    min: 1900,
                    max: 2020,
                    tickInterval: 10,
                    gridLineWidth: 0,
                    lineWidth: 0,
                    labels: { enabled: true, rotation: 0, step: 2 }
                },
                yAxis: {
                    title: { text: 'Altura (cm)' },
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
                        País: {point.custom.team}
                    `
                },
                plotOptions: {
                    bubble: {
                        minSize: 2,
                        maxSize: 10,
                        tooltip: { followPointer: true },
                        states: {
                            hover: {
                                opacity: 1
                            }
                        }
                    },
                    pie: {
                        size: '38%',
                        innerSize: '82%',
                        dataLabels: { enabled: false },
                        point: {
                            events: {
                                mouseOver() {
                                    const point = this;
                                    const chart = this.series.chart;
                                    const bubbleSeries = chart.series[0];
                                    const minDate = point.options.custom.minDate;
                                    const maxDate = point.options.custom.maxDate;
                                    
                                    // Resaltar burbujas del rango seleccionado
                                    bubbleSeries.points.forEach(p => {
                                        if (p.graphic) {
                                            if (p.x >= minDate && p.x < maxDate) {
                                                p.graphic.attr({ opacity: 1, lineWidth: 2, stroke: 'black' });
                                            } else {
                                                p.graphic.attr({ opacity: 0.15 });
                                            }
                                        }
                                    });
                                    
                                    const totalCount = pieData.reduce((sum, p) => sum + p.y, 0);
                                    const percentage = (point.y / totalCount) * 100;
                                    
                                    chart.series[1].customLabel = fillCenter(
                                        percentage,
                                        `${minDate}-${maxDate}`,
                                        chart,
                                        chart.series[1].customLabel
                                    );
                                },
                                mouseOut() {
                                    const chart = this.series.chart;
                                    const bubbleSeries = chart.series[0];
                                    
                                    // Restaurar todas las burbujas
                                    bubbleSeries.points.forEach(p => {
                                        if (p.graphic) {
                                            p.graphic.attr({ opacity: 1, lineWidth: 0 });
                                        }
                                    });
                                    
                                    chart.series[1].customLabel = fillCenter(
                                        100,
                                        '1900-2020',
                                        chart,
                                        chart.series[1].customLabel
                                    );
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
                        colorKey: 'x',
                        maxSize: 10,
                        minSize: 2,
                        color: '#888888'
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
            
            console.log('Stellar Chart renderizado correctamente');
            
            setTimeout(() => {
                loading = false;
                const overlay = document.querySelector('.loading-overlay');
                if (overlay) overlay.style.display = 'none';
            }, 500);
            
        } catch (e) {
            console.error('Error:', e);
            error = e.message;
            loading = false;
        }
    }
</script>

<div class="analytics-container">
    <h1>📊 Estadísticas de Atletas Olímpicos</h1>
    <p class="subtitle">Relación entre altura de atletas y años de participación (rangos de 5 años)</p>
    
    <div id="container" style="height: 700px; width: 100%; margin: 0 auto;"></div>
    
    <div class="loading-overlay" style="display: flex;">
        <div class="spinner"></div>
        <p>Cargando gráfico Stellar...</p>
    </div>
    
    {#if error}
        <div class="error">
            <strong>❌ Error:</strong> {error}
        </div>
    {/if}
    
    <div class="info">
        <h3>📖 Interpretación del Stellar Chart</h3>
        <ul>
            <li><strong>Burbujas:</strong> Cada burbuja representa un atleta</li>
            <li><strong>Eje X:</strong> Año de participación</li>
            <li><strong>Eje Y:</strong> Altura del atleta (cm)</li>
            <li><strong>Tamaño:</strong> Peso del atleta</li>
            <li><strong>Colores del círculo central:</strong> Diferentes rangos de años (5 años)</li>
            <li><strong>Interacción:</strong> Pasa el mouse sobre el círculo central para resaltar las burbujas de ese rango</li>
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