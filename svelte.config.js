import sveltePreprocess from 'svelte-preprocess';
import tailwind from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default {
	preprocess: sveltePreprocess({
		postcss: {
			plugins: [tailwind(), autoprefixer()]
		}
	})
};
