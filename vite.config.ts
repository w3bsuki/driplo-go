import { paraglideVitePlugin } from "@inlang/paraglide-js"
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [
		// Tailwind v4 with CSS-first configuration
		tailwindcss(),
		paraglideVitePlugin({
			project: "./project.inlang",
			outdir: "./src/lib/paraglide",
		}),
		sveltekit(),
		// Enhanced bundle analyzer
		visualizer({
			emitFile: true,
			filename: 'stats.html',
			open: false,
			gzipSize: true,
			brotliSize: true,
			template: 'treemap',
			// Add CSS analysis
			projectRoot: process.cwd(),
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
		// Tailwind v4 optimized chunk size limit
		chunkSizeWarningLimit: 250,
		rollupOptions: {
			// Tree shaking optimizations
			treeshake: {
				moduleSideEffects: false,
				propertyReadSideEffects: false,
			},
			output: {
				// Optimize chunk names for better caching
				chunkFileNames: (chunkInfo) => {
					return `chunks/[name]-[hash].js`;
				},
				// Keep entry file names consistent
				entryFileNames: `[name]-[hash].js`,
				// Enhanced asset file names with CSS separation
				assetFileNames: (assetInfo) => {
					if (assetInfo.name?.endsWith('.css')) {
						return `css/[name]-[hash][extname]`;
					}
					return `assets/[name]-[hash][extname]`;
				}
			}
		},
		// Enable minification optimizations
		minify: 'esbuild',
		// Advanced CSS code splitting for v4
		cssCodeSplit: true,
		// CSS minification options
		cssMinify: 'esbuild',
		// Optimize asset inlining (reduced for CSS performance)
		assetsInlineLimit: 2048,
		// Target modern browsers for smaller output
		target: ['es2022', 'chrome89', 'firefox89', 'safari15']
	},
	// Enhanced dependency optimization for Tailwind v4
	optimizeDeps: {
		include: [
			// Core dependencies
			'svelte',
			'@supabase/supabase-js',
			'@stripe/stripe-js',
			'bits-ui',
			'lucide-svelte',
			'@tanstack/svelte-query',
			'date-fns',
			'zod',
			// Tailwind-related utilities
			'clsx',
			'tailwind-merge',
			'class-variance-authority'
		],
		exclude: [
			'@sveltejs/kit',
			// Exclude CSS files from pre-bundling for v4 optimization
			'@tailwindcss/vite'
		],
		// Force optimize CSS utilities
		force: true,
		// Optimize for ESM
		esbuildOptions: {
			target: 'es2022',
			format: 'esm'
		}
	},
	
	// CSS processing optimizations
	css: {
		// PostCSS optimizations for Tailwind v4
		postcss: {
			plugins: []
		},
		// CSS dev source maps for debugging
		devSourcemap: true,
		// CSS preprocessing options
		preprocessorOptions: {
			// Enable CSS custom properties optimization
			css: {
				// Enable CSS nesting and modern features
				charset: false
			}
		}
	}
});
