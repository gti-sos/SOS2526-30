<script>
    // Lista de videos del grupo
    const videos = [
        {
            name: "David Real Pérez",
            videoUrl: "" // Enlace de David
        },
        {
            name: "Mario Ramos Tuñón",
            videoUrl: "https://youtu.be/04ZKjztOZz0"
        },
        {
            name: "Gonzalo García Gómez",
            videoUrl: "" // Enlace de Gonzalo
        },
        {
            name: "Francisco Manuel García Patino",
            videoUrl: "https://youtu.be/_Vv9swsJMzw" 
        }
    ];
</script>

<div class="videos-container">
    <h1>Videos Explicativos del Proyecto</h1>
    <p class="subtitle">Videos de cada miembro del grupo explicando sus integraciones</p>
    
    <div class="videos-list">
        {#each videos as video}
            <div class="video-item">
                <span class="member-name">{video.name}</span>
                {#if video.videoUrl}
                    <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" class="watch-btn">
                        Ver video →
                    </a>
                {:else}
                    <span class="pending">Pendiente de subir</span>
                {/if}
            </div>
        {/each}
    </div>
</div>

<style>
    .videos-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
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
    
    .videos-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .video-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: #f0f9ff;
        border-radius: 12px;
        border-left: 4px solid #0284c7;
    }
    
    .member-name {
        font-weight: 600;
        color: #0369a1;
        font-size: 1.1rem;
    }
    
    .watch-btn {
        background: #ef4444;
        color: white;
        padding: 0.4rem 1rem;
        border-radius: 20px;
        text-decoration: none;
        font-size: 0.85rem;
        transition: background 0.2s;
    }
    
    .watch-btn:hover {
        background: #dc2626;
    }
    
    .pending {
        color: #94a3b8;
        font-style: italic;
        font-size: 0.85rem;
    }
</style>