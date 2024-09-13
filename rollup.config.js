import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import svelte from 'rollup-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';

export default {
	input: 'src/main.ts',
	output: {
		format: 'cjs',
		file: 'main.js',
		exports: 'default'
	},
	external: ['obsidian', 'fs', 'os', 'path'],
	plugins: [
		svelte({
			emitCss: false,
			preprocess: sveltePreprocess({ postcss: true })
		}),
		typescript({ sourceMap: process.env.NODE_ENV === 'dev' }),
		resolve({
			browser: true,
			dedupe: ['svelte']
		}),
		commonjs({
			include: 'node_modules/**'
		}),
		alias({
			entries: [
				{
					find: '@/**',
					replacement: './src/**'
				}
			]
		}),
		// resolve(),
		json()
	]
};
