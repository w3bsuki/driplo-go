<script lang="ts">
	import { cookieConsent } from '$lib/stores/cookie-consent.svelte';
	import { Button, Badge } from '$lib/components/ui';
	import { Settings, Cookie } from 'lucide-svelte';
	
	function openCookieSettings() {
		cookieConsent.reopenBanner();
		cookieConsent.openPreferences();
	}
	
	const preferences = $derived(cookieConsent.consent.preferences);
	const consentDate = $derived(cookieConsent.consent.consentDate);
</script>

<svelte:head>
	<title>Privacy Policy - Driplo</title>
	<meta name="description" content="Driplo's privacy policy explaining how we collect, use, and protect your personal information." />
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-8 md:py-12">
	<h1 class="text-3xl md:text-4xl font-bold mb-8">Privacy Policy</h1>
	
	<div class="prose prose-gray max-w-none">
		<p class="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
		
		<section class="mt-8">
			<h2 class="text-2xl font-semibold mb-4">1. Introduction</h2>
			<p>
				Welcome to Driplo ("we," "our," or "us"). We are committed to protecting your personal information 
				and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard 
				your information when you visit our website and use our services.
			</p>
		</section>

		<section class="mt-8">
			<h2 class="text-2xl font-semibold mb-4">2. Information We Collect</h2>
			<p>We collect information you provide directly to us, such as when you:</p>
			<ul class="list-disc pl-6 mt-2 space-y-1">
				<li>Create an account</li>
				<li>Make a purchase or sale</li>
				<li>Contact customer support</li>
				<li>Subscribe to our newsletter</li>
				<li>Participate in surveys or promotions</li>
			</ul>
		</section>

		<section class="mt-8">
			<h2 class="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
			<p>We use the information we collect to:</p>
			<ul class="list-disc pl-6 mt-2 space-y-1">
				<li>Provide, maintain, and improve our services</li>
				<li>Process transactions and send related information</li>
				<li>Send technical notices, updates, security alerts, and support messages</li>
				<li>Respond to your comments, questions, and customer service requests</li>
				<li>Personalize and improve your experience</li>
			</ul>
		</section>

		<!-- Cookie Policy Section -->
		<section class="mt-8" id="cookies">
			<h2 class="text-2xl font-semibold mb-4 flex items-center gap-2">
				<Cookie class="w-6 h-6" />
				4. Cookie Policy
			</h2>
			
			<div class="bg-muted/50 p-6 rounded-lg mb-6">
				<div class="flex items-center justify-between mb-4">
					<h3 class="font-semibold">Your Current Cookie Preferences</h3>
					<Button onclick={handleOpenCookieSettings} variant="outline" size="sm">
						<Settings class="w-4 h-4 mr-2" />
						Manage Settings
					</Button>
				</div>
				
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<span class="text-sm">Necessary Cookies</span>
						<Badge variant="success" size="sm">Always On</Badge>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm">Analytics Cookies</span>
						<Badge variant={preferences.analytics ? 'success' : 'outline'} size="sm">
							{preferences.analytics ? 'Enabled' : 'Disabled'}
						</Badge>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm">Marketing Cookies</span>
						<Badge variant={preferences.marketing ? 'success' : 'outline'} size="sm">
							{preferences.marketing ? 'Enabled' : 'Disabled'}
						</Badge>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm">Preference Cookies</span>
						<Badge variant={preferences.preferences ? 'success' : 'outline'} size="sm">
							{preferences.preferences ? 'Enabled' : 'Disabled'}
						</Badge>
					</div>
				</div>
				
				{#if consentDate}
					<p class="text-xs text-muted-foreground mt-4">
						Consent given on: {new Date(consentDate).toLocaleDateString()}
					</p>
				{/if}
			</div>

			<h3 class="text-xl font-semibold mb-3">What are cookies?</h3>
			<p>
				Cookies are small text files that are placed on your device when you visit a website. 
				They are widely used to make websites work more efficiently and provide information to 
				the owners of the site.
			</p>

			<h3 class="text-xl font-semibold mb-3 mt-6">Types of cookies we use</h3>
			
			<div class="space-y-4">
				<div>
					<h4 class="font-semibold">Necessary Cookies</h4>
					<p class="text-sm text-muted-foreground">
						These cookies are essential for the website to function properly. They enable basic 
						functions like page navigation and access to secure areas of the website. The website 
						cannot function properly without these cookies.
					</p>
				</div>
				
				<div>
					<h4 class="font-semibold">Analytics Cookies</h4>
					<p class="text-sm text-muted-foreground">
						These cookies help us understand how visitors interact with our website by collecting 
						and reporting information anonymously. This helps us improve our website and services.
					</p>
				</div>
				
				<div>
					<h4 class="font-semibold">Marketing Cookies</h4>
					<p class="text-sm text-muted-foreground">
						These cookies are used to track visitors across websites. The intention is to display 
						ads that are relevant and engaging for the individual user.
					</p>
				</div>
				
				<div>
					<h4 class="font-semibold">Preference Cookies</h4>
					<p class="text-sm text-muted-foreground">
						These cookies enable a website to remember information that changes the way the website 
						behaves or looks, like your preferred language or the region that you are in.
					</p>
				</div>
			</div>

			<h3 class="text-xl font-semibold mb-3 mt-6">Managing cookies</h3>
			<p>
				You can manage your cookie preferences at any time by clicking the "Manage Settings" button above 
				or through your browser settings. Please note that blocking some types of cookies may impact 
				your experience on our website and the services we are able to offer.
			</p>
		</section>

		<section class="mt-8">
			<h2 class="text-2xl font-semibold mb-4">5. Data Security</h2>
			<p>
				We implement appropriate technical and organizational measures to protect your personal information 
				against unauthorized or unlawful processing, accidental loss, destruction, or damage.
			</p>
		</section>

		<section class="mt-8">
			<h2 class="text-2xl font-semibold mb-4">6. Your Rights</h2>
			<p>Under GDPR, you have the following rights:</p>
			<ul class="list-disc pl-6 mt-2 space-y-1">
				<li>Right to access your personal data</li>
				<li>Right to rectification of inaccurate data</li>
				<li>Right to erasure ("right to be forgotten")</li>
				<li>Right to restrict processing</li>
				<li>Right to data portability</li>
				<li>Right to object to processing</li>
				<li>Right to withdraw consent</li>
			</ul>
		</section>

		<section class="mt-8">
			<h2 class="text-2xl font-semibold mb-4">7. Contact Us</h2>
			<p>
				If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
			</p>
			<div class="mt-4 p-4 bg-muted/50 rounded-lg">
				<p><strong>Email:</strong> privacy@driplo.com</p>
				<p><strong>Address:</strong> [Your Company Address]</p>
			</div>
		</section>

		<section class="mt-8">
			<h2 class="text-2xl font-semibold mb-4">8. Changes to This Privacy Policy</h2>
			<p>
				We may update this Privacy Policy from time to time. We will notify you of any changes by 
				posting the new Privacy Policy on this page and updating the "Last updated" date.
			</p>
		</section>
	</div>
</div>