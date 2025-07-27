import { paraglideVitePlugin } from "@inlang/paraglide-js"
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
	plugins: [
		paraglideVitePlugin({
			project: "./project.inlang",
			outdir: "./src/lib/paraglide",
		}),
		sveltekit(),
		// Bundle analyzer - generates stats.html after build
		visualizer({
			emitFile: true,
			filename: 'stats.html',
			open: false,
			gzipSize: true,
			brotliSize: true,
			template: 'treemap' // options: 'treemap', 'sunburst', 'network'
		})
	],
	server: {
		port: 5190,
		strictPort: true,
		hmr: {
			overlay: false
		}
	},
	build: {
		// Enable source maps for better debugging
		sourcemap: true,
		// Report chunk sizes
		chunkSizeWarningLimit: 500,
		rollupOptions: {
			output: {
				// Let Vite handle chunk splitting automatically for now
			}
		}
	}
});
