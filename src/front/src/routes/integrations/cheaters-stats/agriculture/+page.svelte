<script>
    import { onMount, tick } from 'svelte';
    import Chart from 'chart.js/auto';
    
    let loading = true;
    let error = null;
    let chart = null;
    
    onMount(async () => {
        await tick();
        await new Promise(resolve => setTimeout(resolve, 200));
        
        try {
            console.log('Cargando datos...');
            
            // Datos MOCK
            const countries = ['SPAIN', 'BRAZIL', 'CHILE', 'COLOMBIA', 'MEXICO'];
            const reportsData = [150, 3786, 4589, 2299, 1200];
            const tempData = [20, 25, 18, 22, 24];
            
            const canvas = document.getElementById('chart');
            console.log('Canvas:', canvas);
            
            if (!canvas) {
                throw new Error('Canvas no encontrado');
            }
            
            const ctx = canvas.getContext('2d');
            
            if (chart) chart.destroy();
            
            chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: countries,
                    datasets: [
                        {
                            label: '📊 Reportes de Tramposos',
                            data: reportsData,
                            backgroundColor: '#7e22ce',
                            borderRadius: 8,
                            yAxisID: 'y'
                        },
                        {
                            label: '🌡️ Temperatura Promedio (°C)',
                            data: tempData,
                            backgroundColor: '#059669',
                            borderRadius: 8,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: { display: true, text: 'Reportes de Tramposos vs Temperatura por País', color: '#7e22ce', font: { size: 16 } }
                    },
                    scales: {
                        y: { title: { display: true, text: 'Reportes' } },
                        y1: { position: 'right', title: { display: true, text: 'Temperatura (°C)' }, grid: { drawOnChartArea: false } }
                    }
                }
            });
            
            loading = false;
            console.log('Gráfico creado');
            
        } catch (err) {
            console.error('Error:', err);
            error = err.message;
            loading = false;
        }
    });
</script>

<div class="container">
    <a href="/integrations/cheaters-stats" class="back-link">← Volver</a>
    <h1>🌾 Agriculture + Cheaters Stats</h1>
    <p class="subtitle">Gráfico de Barras: Reportes de tramposos vs Temperatura media</p>
    
    <!-- Canvas siempre visible -->
    <div style="height: 450px; width: 100%; position: relative;">
        <canvas id="chart" style="width: 100%; height: 100%;"></canvas>
    </div>
    
    {#if error}
        <div class="error">Error: {error}</div>
    {/if}
</div>

<style>
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #e9d5ff; position: relative; }
    .back-link { color: #7e22ce; text-decoration: none; display: inline-block; margin-bottom: 1rem; }
    .back-link:hover { text-decoration: underline; }
    h1 { color: #7e22ce; margin: 0; }
    .subtitle { color: #666; margin-bottom: 1.5rem; }
    .error { text-align: center; padding: 3rem; color: #dc2626; }
</style>