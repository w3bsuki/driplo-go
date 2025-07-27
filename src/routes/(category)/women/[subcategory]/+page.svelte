<script lang="ts">
  import type { PageData } from './$types';
  import SubcategoryBrowse from '$lib/components/subcategory/SubcategoryBrowse.svelte';
  import CategorySEO from '$lib/components/seo/CategorySEO.svelte';
  
  let { data }: { data: PageData } = $props();
</script>

<CategorySEO category={data.category} subcategory={data.subcategory} />

<SubcategoryBrowse 
  category={data.category}
  subcategory={data.subcategory}
  products={data.products}
  totalCount={data.totalCount}
  filters={data.filters}
/>