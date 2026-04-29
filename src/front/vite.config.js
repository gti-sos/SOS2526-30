import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';


export default defineConfig({
    plugins: [sveltekit()],
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            }
        }
    },
    define: {
        'process.env.GITHUB_TOKEN': JSON.stringify(process.env.GITHUB_TOKEN)
    }
});