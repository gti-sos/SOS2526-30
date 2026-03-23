<script>
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    let country = $page.params.country;
    let year = $page.params.year;
    
    let formData = $state({
        active_player_no: '',
        viewership: '',
        top_genre: '',
        top_platform: '',
        tournament_no: '',
        pro_player_no: '',
        internet_penetration: '',
        company_no: ''
    });

    let loading = $state(true);
    let error = $state(null);
    let successMessage = $state(null);

    onMount(async () => {
        try {
            const res = await fetch(`/api/v1/esportsgrowth-stats/${country}/${year}`);
            if (!res.ok) {
                throw new Error('No se pudo encontrar el registro.');
            }
            const data = await res.json();
            // Llenar el formulario con los datos que han llegado
            formData = { ...data };
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
        }
    });

    async function saveChanges() {
        loading = true;
        try {
            const dataToSend = {
                country: country, 
                year: parseInt(year),
                active_player_no: parseFloat(formData.active_player_no),
                viewership: parseFloat(formData.viewership),
                top_genre: formData.top_genre,
                top_platform: formData.top_platform,
                tournament_no: parseInt(formData.tournament_no),
                pro_player_no: parseInt(formData.pro_player_no),
                internet_penetration: parseFloat(formData.internet_penetration),
                company_no: parseInt(formData.company_no)
            };

            const res = await fetch(`/api/v1/esportsgrowth-stats/${country}/${year}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend)
            });

            if (res.status === 400) {
                alert('No se pueden guardar los cambios: Asegúrate de que los campos numéricos sean correctos.');
                loading = false;
                return;
            }

            if (!res.ok) throw new Error('Error al actualizar');

            successMessage = '¡Cambios guardados con éxito! Volviendo a la lista...';
            
            // Esperar un poquito para que el usuario lea el mensaje y luego volver
            setTimeout(() => {
                goto('/esportsgrowth-stats');
            }, 1500);

        } catch (e) {
            alert('No se pudieron guardar los cambios. Revisa los datos.');
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>Editar - {country} {year}</title>
</svelte:head>

<style>
    :root { --p-50: #faf5ff; --p-200: #e9d5ff; --p-500: #a855f7; --p-600: #9333ea; --p-700: #7e22ce; }
    .container { max-width: 800px; margin: 2rem auto; background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border: 1px solid var(--p-200);}
    h1 { color: var(--p-700); border-bottom: 2px solid var(--p-500); padding-bottom: 0.5rem; }
    .msg-success { background: #d1fae5; color: #065f46; padding: 1rem; border-radius: 8px; text-align: center; margin-bottom: 1rem; border: 1px solid #10b981;}
    .msg-error { background: #fee2e2; color: #b91c1c; padding: 1rem; border-radius: 8px; text-align: center; margin-bottom: 1rem; border: 1px solid #dc2626;}
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.5rem; }
    label { display: block; font-weight: bold; margin-bottom: 0.3rem; color: var(--p-700); font-size: 0.9rem;}
    input { width: 100%; padding: 0.5rem; border: 1px solid var(--p-200); border-radius: 6px; box-sizing: border-box; }
    input:focus { outline: none; border-color: var(--p-500); box-shadow: 0 0 0 2px rgba(147, 51, 234, 0.2); }
    input:disabled { background-color: var(--p-50); color: gray; cursor: not-allowed; }
    button { border: none; border-radius: 6px; padding: 0.8rem 1.5rem; font-weight: bold; cursor: pointer; transition: 0.2s; color: white; font-size: 1rem;}
    .btn-purple { background: var(--p-600); } .btn-purple:hover { background: var(--p-700); }
    .btn-gray { background: #e5e7eb; color: #374151; } .btn-gray:hover { background: #d1d5db; }
    .btn-group { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem; }
    .info-box { background: var(--p-50); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 4px solid var(--p-500); }
</style>

<div class="container">
    <button class="btn-gray" style="margin-bottom: 1rem;" onclick={() => goto('/esportsgrowth-stats')}>⬅ Volver a la lista</button>
    
    <h1>Editar Registro</h1>

    {#if loading}
        <p style="text-align: center; color: var(--p-600); font-size: 1.2rem;">Cargando datos de {country}...</p>
    {:else if error}
        <div class="msg-error">
            <p>{error}</p>
            <button class="btn-gray" onclick={() => goto('/esportsgrowth-stats')}>Volver</button>
        </div>
    {:else}
        {#if successMessage}<div class="msg-success">{successMessage}</div>{/if}

        <div class="info-box">
            <p style="margin: 0; color: var(--p-700);">Estás editando las estadísticas de <strong>{country}</strong> para el año <strong>{year}</strong>.</p>
        </div>

        <div class="grid">
            <div><label for="f_country">País (No editable)</label><input id="f_country" type="text" value={country} disabled></div>
            <div><label for="f_year">Año (No editable)</label><input id="f_year" type="text" value={year} disabled></div>
            
            <div><label for="f_active">Jugadores Activos (M)</label><input id="f_active" type="number" step="0.1" bind:value={formData.active_player_no}></div>
            <div><label for="f_viewers">Espectadores (M)</label><input id="f_viewers" type="number" step="0.1" bind:value={formData.viewership}></div>
            <div><label for="f_genre">Género Top</label><input id="f_genre" type="text" bind:value={formData.top_genre}></div>
            <div><label for="f_platform">Plataforma Top</label><input id="f_platform" type="text" bind:value={formData.top_platform}></div>
            <div><label for="f_tournaments">Nº Torneos</label><input id="f_tournaments" type="number" bind:value={formData.tournament_no}></div>
            <div><label for="f_pro">Nº Jugadores Pro</label><input id="f_pro" type="number" bind:value={formData.pro_player_no}></div>
            <div><label for="f_internet">Penetración Internet (%)</label><input id="f_internet" type="number" step="0.1" bind:value={formData.internet_penetration}></div>
            <div><label for="f_company">Nº Compañías</label><input id="f_company" type="number" bind:value={formData.company_no}></div>
        </div>

        <div class="btn-group">
            <button class="btn-gray" onclick={() => goto('/esportsgrowth-stats')}>Cancelar</button>
            <button class="btn-purple" onclick={saveChanges}>Guardar Cambios</button>
        </div>
    {/if}
</div>