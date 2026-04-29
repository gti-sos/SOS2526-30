<script>
    import { onMount, tick } from 'svelte';
    import Chart from 'chart.js/auto';
    
    let error = null;
    let chart = null;
    
    onMount(async () => {
        await tick();
        await new Promise(resolve => setTimeout(resolve, 200));
        
        try {
            const canvas = document.getElementById('chart');
            if (!canvas) throw new Error('Canvas no encontrado');
            
            const ctx = canvas.getContext('2d');
            if (chart) chart.destroy();
            
            chart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['LCK (Corea)', 'LPL (China)', 'LEC (Europa)', 'LCS (América)', 'Otras'],
                    datasets: [{ data: [48, 42, 35, 28, 20], backgroundColor: ['#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc', '#94a3b8'] }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: 'Distribución de Victorias por Región', color: '#0284c7', font: { size: 16 } }, legend: { position: 'bottom' } } }
            });
        } catch (err) { error = err.message; }
    });
</script>

<div class="container">
    <a href="/integrations/cheaters-stats" class="back-link">← Volver</a>
    <h1>🎮 League of Legends + Cheaters Stats</h1>
    <p class="subtitle">Gráfico de Pastel: Victorias por región</p>
    <div style="height: 450px;"><canvas id="chart" style="width: 100%; height: 100%;"></canvas></div>
    {#if error}<div class="error">Error: {error}</div>{/if}
</div>

<style>
    .container { max-width: 800px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #e9d5ff; }
    .back-link { color: #7e22ce; text-decoration: none; display: inline-block; margin-bottom: 1rem; }
    h1 { color: #0284c7; margin: 0; }
    .subtitle { color: #666; margin-bottom: 1.5rem; }
    .error { text-align: center; padding: 3rem; color: #dc2626; }
</style>