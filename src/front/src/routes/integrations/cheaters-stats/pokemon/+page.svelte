<script>
    import { onMount, tick } from 'svelte';
    import Chart from 'chart.js/auto';
    
    let error = null;
    let chart = null;
    
    onMount(async () => {
        await tick();
        await new Promise(resolve => setTimeout(resolve, 200));
        
        try {
            const stats = ['HP', 'ATTACK', 'DEFENSE', 'SP. ATTACK', 'SP. DEFENSE', 'SPEED'];
            const pokemonStats = [45, 49, 49, 65, 65, 45];
            const reportsData = [30, 35, 28, 40, 38, 32];
            
            const canvas = document.getElementById('chart');
            if (!canvas) throw new Error('Canvas no encontrado');
            
            const ctx = canvas.getContext('2d');
            if (chart) chart.destroy();
            
            chart = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: stats,
                    datasets: [
                        { label: 'Pokémon (Stats base)', data: pokemonStats, backgroundColor: 'rgba(245,158,11,0.2)', borderColor: '#f59e0b', borderWidth: 2 },
                        { label: 'Reportes Tramposos (normalizado)', data: reportsData, backgroundColor: 'rgba(124,58,237,0.2)', borderColor: '#7e22ce', borderWidth: 2 }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: 'Pokémon Stats vs Reportes de Tramposos', color: '#f59e0b', font: { size: 16 } } } }
            });
        } catch (err) { error = err.message; }
    });
</script>

<div class="container">
    <a href="/integrations/cheaters-stats" class="back-link">← Volver</a>
    <h1>⚡ Pokémon + Cheaters Stats</h1>
    <p class="subtitle">Gráfico de Radar: Estadísticas de Pokémon vs Reportes</p>
    <div style="height: 450px;"><canvas id="chart" style="width: 100%; height: 100%;"></canvas></div>
    {#if error}<div class="error">Error: {error}</div>{/if}
</div>

<style>
    .container { max-width: 900px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #e9d5ff; }
    .back-link { color: #7e22ce; text-decoration: none; display: inline-block; margin-bottom: 1rem; }
    h1 { color: #f59e0b; margin: 0; }
    .subtitle { color: #666; margin-bottom: 1.5rem; }
    .error { text-align: center; padding: 3rem; color: #dc2626; }
</style>