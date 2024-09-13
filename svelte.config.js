import sveltePreprocess from 'svelte-preprocess';

const config = {
	preprocess: sveltePreprocess({ postcss: true })
};

export default config;
