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
        'process.env.XITHUB_TOKEN': JSON.stringify(process.env.XITHUB_TOKEN)
    }
});