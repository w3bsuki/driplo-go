<script lang="ts">
	import { onMount } from 'svelte';

	let canvas: HTMLCanvasElement;
	let particles: Particle[] = [];

	class Particle {
		x: number;
		y: number;
		vx: number;
		vy: number;
		color: string;
		size: number;
		angle: number;
		angularVelocity: number;

		constructor(x: number, y: number) {
			this.x = x;
			this.y = y;
			this.vx = (Math.random() - 0.5) * 10;
			this.vy = Math.random() * -15 - 5;
			this.color = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'][Math.floor(Math.random() * 5)];
			this.size = Math.random() * 6 + 4;
			this.angle = Math.random() * Math.PI * 2;
			this.angularVelocity = (Math.random() - 0.5) * 0.2;
		}

		update() {
			this.x += this.vx;
			this.y += this.vy;
			this.vy += 0.5; // gravity
			this.angle += this.angularVelocity;
		}

		draw(ctx: CanvasRenderingContext2D) {
			ctx.save();
			ctx.translate(this.x, this.y);
			ctx.rotate(this.angle);
			ctx.fillStyle = this.color;
			ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
			ctx.restore();
		}
	}

	onMount(() => {
		if (!canvas) return;
		
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		// Create initial burst of confetti
		const centerX = canvas.width / 2;
		const centerY = canvas.height / 3;
		
		for (let i = 0; i < 150; i++) {
			particles.push(new Particle(
				centerX + (Math.random() - 0.5) * 100,
				centerY + (Math.random() - 0.5) * 50
			));
		}

		let animationId: number;
		
		function animate() {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			
			particles = particles.filter(particle => {
				particle.update();
				particle.draw(ctx);
				
				// Remove particles that are off screen
				return particle.y < canvas.height + 20;
			});
			
			if (particles.length > 0) {
				animationId = requestAnimationFrame(animate);
			}
		}
		
		animate();

		// Cleanup
		return () => {
			if (animationId) {
				cancelAnimationFrame(animationId);
			}
		};
	});
</script>

<canvas
	bind:this={canvas}
	class="fixed inset-0 pointer-events-none z-50"
	style="width: 100%; height: 100%;"
/>

<style>
	canvas {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 9999;
	}
</style>