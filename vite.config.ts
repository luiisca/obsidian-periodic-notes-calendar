import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, preview } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 3000
	}
});
