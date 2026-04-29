<script>
    import { onMount, tick } from 'svelte';
    import Chart from 'chart.js/auto';
    
    let error = null;
    let chart = null;
    
    onMount(async () => {
        await tick();
        await new Promise(resolve => setTimeout(resolve, 200));
        
        try {
            // Datos: Coste construcción vs Reportes tramposos
            const data = [
                { country: 'SPAIN', cost: 2205, reports: 150 },
                { country: 'BRAZIL', cost: 2900, reports: 3786 },
                { country: 'CHILE', cost: 3787, reports: 4589 },
                { country: 'COLOMBIA', cost: 2834, reports: 2299 },
                { country: 'MEXICO', cost: 2200, reports: 1200 },
                { country: 'USA', cost: 5451, reports: 500 },
                { country: 'UK', cost: 4473, reports: 300 },
                { country: 'GERMANY', cost: 3787, reports: 400 }
            ];
            
            const canvas = document.getElementById('chart');
            if (!canvas) throw new Error('Canvas no encontrado');
            
            const ctx = canvas.getContext('2d');
            if (chart) chart.destroy();
            
            chart = new Chart(ctx, {
                type: 'bubble',
                data: {
                    datasets: [{
                        label: 'Países',
                        data: data.map(d => ({
                            x: d.cost,
                            y: d.reports,
                            r: Math.sqrt(d.reports) / 2,
                            country: d.country
                        })),
                        backgroundColor: '#dc2626',
                        borderColor: '#991b1b',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: { display: true, text: 'Coste Construcción vs Reportes de Tramposos', color: '#dc2626', font: { size: 16 } },
                        subtitle: { display: true, text: 'Gráfico de Burbujas - Relación entre coste de construcción (USD/m²) y reportes de cheaters' },
                        tooltip: { callbacks: { label: (ctx) => `${ctx.raw.country}: Coste $${ctx.raw.x} | Reportes ${ctx.raw.y.toLocaleString()}` } }
                    },
                    scales: {
                        x: { title: { display: true, text: 'Coste de Construcción (USD/m²)' } },
                        y: { title: { display: true, text: 'Reportes de Tramposos' } }
                    }
                }
            });
        } catch (err) { error = err.message; }
    });
</script>

<div class="container">
    <a href="/integrations/cheaters-stats" class="back-link">← Volver</a>
    <h1>🏗️ Construction Costs + Cheaters Stats</h1>
    <p class="subtitle">Gráfico de Burbujas: Relación entre coste de construcción y reportes de tramposos</p>
    <div style="height: 450px; width: 100%;">
        <canvas id="chart" style="width: 100%; height: 100%;"></canvas>
    </div>
    {#if error}<div class="error">Error: {error}</div>{/if}
</div>

<style>
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #e9d5ff; }
    .back-link { color: #7e22ce; text-decoration: none; display: inline-block; margin-bottom: 1rem; }
    .back-link:hover { text-decoration: underline; }
    h1 { color: #dc2626; margin: 0; }
    .subtitle { color: #666; margin-bottom: 1.5rem; }
    .error { text-align: center; padding: 3rem; color: #dc2626; }
</style>