<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    
    onMount(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (token) {
            localStorage.setItem('github_token', token);
            goto('/integrations/github');
        } else {
            alert('Error al iniciar sesión con GitHub');
            goto('/integrations');
        }
    });
</script>

<div style="text-align: center; padding: 2rem;">
    <p>🔐 Redirigiendo...</p>
</div>