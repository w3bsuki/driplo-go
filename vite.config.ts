import { paraglideVitePlugin } from "@inlang/paraglide-js"
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
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
		chunkSizeWarningLimit: 300,
		rollupOptions: {
			output: {
				// Manual chunk splitting for optimal bundle size
				manualChunks: {
					// Core vendor libraries
					'vendor-svelte': ['svelte', 'svelte/internal', 'svelte/store'],
					'vendor-supabase': ['@supabase/supabase-js', '@supabase/ssr'],
					'vendor-ui': ['bits-ui', 'lucide-svelte', 'class-variance-authority', 'clsx', 'tailwind-merge'],
					'vendor-forms': ['sveltekit-superforms', 'zod'],
					'vendor-utils': ['date-fns', '@tanstack/svelte-query']
				},
				// Optimize chunk names for better caching
				chunkFileNames: (chunkInfo) => {
					const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : '';
					return `chunks/[name]-[hash].js`;
				},
				// Keep entry file names consistent
				entryFileNames: `[name]-[hash].js`,
				// Asset file names
				assetFileNames: `assets/[name]-[hash].[ext]`
			}
		},
		// Enable minification optimizations
		minify: 'esbuild',
		// Enable CSS code splitting
		cssCodeSplit: true,
		// Optimize asset inlining
		assetsInlineLimit: 4096
	},
	// Optimize dependencies
	optimizeDeps: {
		include: [
			'svelte',
			'@supabase/supabase-js',
			'@stripe/stripe-js',
			'bits-ui',
			'lucide-svelte',
			'@tanstack/svelte-query',
			'date-fns',
			'zod'
		],
		exclude: ['@sveltejs/kit']
	}
});
