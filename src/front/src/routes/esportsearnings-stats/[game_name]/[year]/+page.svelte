<script>
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    
    // Obtenemos los parámetros dinámicos de la URL (Lo que pide la rúbrica)
    let game_name = $page.params.game_name;
    let year = $page.params.year;

    let formData = $state({
        game_name: game_name,
        year: year,
        total_money: 0,
        genre: '',
        player_no: 0,
        tournament_no: 0,
        country: '',
        top_country_earnings: 0
    });

    let loading = $state(true);
    let error = $state(null);
    let successMessage = $state(null);

    // Al entrar en la vista, cargamos los datos específicos de este juego y año (V2)
    onMount(async () => {
        try {
            const res = await fetch(`/api/v2/esportsearnings-stats/${game_name}/${year}`);
            if (!res.ok) throw new Error('No se pudo cargar el registro.');
            
            const data = await res.json();
            formData = { ...data };
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
        }
    });

    // Guardar los cambios mediante PUT (V2)
    async function updateResource() {
        try {
            const dataToSend = {
                game_name: formData.game_name,
                year: parseInt(formData.year),
                total_money: parseFloat(formData.total_money),
                genre: formData.genre,
                player_no: parseInt(formData.player_no),
                tournament_no: parseInt(formData.tournament_no),
                country: formData.country,
                top_country_earnings: parseFloat(formData.top_country_earnings)
            };

            const res = await fetch(`/api/v2/esportsearnings-stats/${game_name}/${year}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend)
            });

            if (!res.ok) throw new Error('Error al actualizar');
            successMessage = '¡Registro actualizado con éxito!';
            setTimeout(() => { window.location.href = '/esportsearnings-stats'; }, 1500); // Volver a la tabla
        } catch (e) {
            alert('No se pudieron guardar los cambios.');
        }
    }
</script>

<svelte:head><title>Editar - {game_name}</title></svelte:head>

<style>
    .container { max-width: 600px; margin: 2rem auto; background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); font-family: 'Segoe UI', sans-serif;}
    h1 { color: #7e22ce; border-bottom: 2px solid #a855f7; padding-bottom: 0.5rem; text-align: center; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.5rem; }
    label { display: block; font-weight: bold; margin-bottom: 0.3rem; color: #7e22ce; font-size: 0.9rem;}
    input { width: 100%; padding: 0.5rem; border: 1px solid #e9d5ff; border-radius: 6px; box-sizing: border-box; }
    input:disabled { background: #f3f4f6; color: #9ca3af; cursor: not-allowed; }
    .btn-group { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem; }
    button, .btn-link { border: none; border-radius: 6px; padding: 0.6rem 1.2rem; font-weight: bold; cursor: pointer; transition: 0.2s; color: white; text-decoration: none;}
    .btn-purple { background: #9333ea; } .btn-purple:hover { background: #7e22ce; }
    .btn-gray { background: #e5e7eb; color: #374151; } .btn-gray:hover { background: #d1d5db; }
    .msg-success { background: #d1fae5; color: #065f46; padding: 1rem; border-radius: 8px; text-align: center; margin-bottom: 1rem; }
</style>

<div class="container">
    <h1>Editar Registro</h1>

    {#if loading}
        <p style="text-align:center;">Cargando datos...</p>
    {:else if error}
        <p style="color:red; text-align:center;">{error}</p>
        <div style="text-align:center; margin-top:1rem;"><a href="/esportsearnings-stats" class="btn-link btn-gray">Volver</a></div>
    {:else}
        {#if successMessage}<div class="msg-success">{successMessage}</div>{/if}

        <div class="grid">
            <div><label>Juego</label><input type="text" value={formData.game_name} disabled></div>
            <div><label>Año</label><input type="number" value={formData.year} disabled></div>
            
            <div><label>País</label><input type="text" bind:value={formData.country}></div>
            <div><label>Género</label><input type="text" bind:value={formData.genre}></div>
            <div><label>Dinero Total ($)</label><input type="number" step="0.01" bind:value={formData.total_money}></div>
            <div><label>Torneos</label><input type="number" bind:value={formData.tournament_no}></div>
            <div><label>Jugadores</label><input type="number" bind:value={formData.player_no}></div>
            <div><label>Ganancias País ($)</label><input type="number" step="0.01" bind:value={formData.top_country_earnings}></div>
        </div>

        <div class="btn-group">
            <a href="/esportsearnings-stats" class="btn-link btn-gray">Cancelar</a>
            <button class="btn-purple" onclick={updateResource}>Guardar Cambios</button>
        </div>
    {/if}
</div>