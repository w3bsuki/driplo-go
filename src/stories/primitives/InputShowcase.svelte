<script>
  import Input from '$lib/components/ui/input.svelte';
  import { Search, Mail, Lock, User, Calendar, CreditCard } from 'lucide-svelte';
</script>

<div class="space-y-8 w-full max-w-2xl">
  <!-- Basic Inputs -->
  <section>
    <h3 class="text-lg font-semibold mb-4 text-gray-900">Basic Inputs</h3>
    <div class="space-y-3">
      <Input placeholder="Default input" />
      <Input type="email" placeholder="Email address" />
      <Input type="password" placeholder="Password" />
      <Input type="tel" placeholder="Phone number" />
      <Input type="url" placeholder="Website URL" />
    </div>
  </section>

  <!-- Input States -->
  <section>
    <h3 class="text-lg font-semibold mb-4 text-gray-900">States</h3>
    <div class="space-y-3">
      <div>
        <label class="text-sm text-gray-600 mb-1 block">Normal</label>
        <Input placeholder="Normal state" />
      </div>
      <div>
        <label class="text-sm text-gray-600 mb-1 block">Focused (click to see)</label>
        <Input placeholder="Focus me" />
      </div>
      <div>
        <label class="text-sm text-gray-600 mb-1 block">Disabled</label>
        <Input disabled placeholder="Disabled input" />
      </div>
      <div>
        <label class="text-sm text-gray-600 mb-1 block">Read Only</label>
        <Input readonly value="Read only value" />
      </div>
      <div>
        <label class="text-sm text-gray-600 mb-1 block">With Error</label>
        <Input class="border-destructive focus:ring-destructive" placeholder="Invalid input" />
        <p class="text-sm text-destructive mt-1">This field is required</p>
      </div>
    </div>
  </section>

  <!-- With Icons -->
  <section>
    <h3 class="text-lg font-semibold mb-4 text-gray-900">With Icons</h3>
    <div class="space-y-3">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input class="pl-10" type="search" placeholder="Search..." />
      </div>
      <div class="relative">
        <Mail class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input class="pl-10" type="email" placeholder="Email address" />
      </div>
      <div class="relative">
        <Lock class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input class="pl-10" type="password" placeholder="Password" />
      </div>
      <div class="relative">
        <User class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input class="pl-10" placeholder="Username" />
      </div>
    </div>
  </section>

  <!-- Sizes -->
  <section>
    <h3 class="text-lg font-semibold mb-4 text-gray-900">Sizes</h3>
    <div class="space-y-3">
      <Input class="h-8 text-sm" placeholder="Small input" />
      <Input placeholder="Default input" />
      <Input class="h-12 text-lg" placeholder="Large input" />
    </div>
  </section>

  <!-- Form Example -->
  <section>
    <h3 class="text-lg font-semibold mb-4 text-gray-900">Form Example</h3>
    <form class="space-y-4">
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
          Full Name <span class="text-destructive">*</span>
        </label>
        <Input id="name" placeholder="John Doe" required />
      </div>
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
          Email Address <span class="text-destructive">*</span>
        </label>
        <Input id="email" type="email" placeholder="john@example.com" required />
      </div>
      <div>
        <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>
        <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" />
      </div>
      <div>
        <label for="message" class="block text-sm font-medium text-gray-700 mb-1">
          Additional Notes
        </label>
        <textarea 
          id="message" 
          class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Tell us more..."
        ></textarea>
      </div>
    </form>
  </section>

  <!-- Special Types -->
  <section>
    <h3 class="text-lg font-semibold mb-4 text-gray-900">Special Types</h3>
    <div class="grid md:grid-cols-2 gap-3">
      <div>
        <label class="text-sm text-gray-600 mb-1 block">Date</label>
        <Input type="date" />
      </div>
      <div>
        <label class="text-sm text-gray-600 mb-1 block">Time</label>
        <Input type="time" />
      </div>
      <div>
        <label class="text-sm text-gray-600 mb-1 block">Number</label>
        <Input type="number" placeholder="0" min="0" max="100" />
      </div>
      <div>
        <label class="text-sm text-gray-600 mb-1 block">Range</label>
        <input type="range" class="w-full" min="0" max="100" value="50" />
      </div>
    </div>
  </section>
</div>

<style>
  :global(.space-y-8 > * + *) {
    margin-top: 2rem;
  }
  :global(.space-y-4 > * + *) {
    margin-top: 1rem;
  }
  :global(.space-y-3 > * + *) {
    margin-top: 0.75rem;
  }
</style>