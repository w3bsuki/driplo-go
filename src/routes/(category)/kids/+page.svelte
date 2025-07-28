<script lang="ts">
  import type { PageData } from './$types';
  import CategoryLanding from '$lib/components/category/CategoryLanding.svelte';
  import CategorySEO from '$lib/components/seo/CategorySEO.svelte';
  
  let { data }: { data: PageData } = $props();
</script>

<CategorySEO category={data.category} />

<CategoryLanding 
  category={data.category}
  subcategories={data.subcategories}
  products={data.products}
  topSellers={data.topSellers}
/>