<script lang="ts">
  import { page } from '$app/stores';
  import type { Category } from '$lib/types';
  
  interface Props {
    category: Category;
    subcategory?: Category;
  }
  
  let { category, subcategory }: Props = $props();
  
  $effect(() => {
    const baseUrl = 'https://driplo.com'; // Update with actual domain
    const url = subcategory 
      ? `${baseUrl}/${category.slug}/${subcategory.slug}`
      : `${baseUrl}/${category.slug}`;
    
    const title = subcategory
      ? `${subcategory?.name || ''} - ${category.name} | Driplo`
      : `${category.name} - Shop Pre-loved Fashion | Driplo`;
    
    const description = subcategory?.description || category.description || 
      `Shop sustainable ${category.name.toLowerCase()} fashion. Pre-loved designer items at great prices.`;
    
    // Update meta tags
    document.title = title;
    
    // Update or create meta tags
    updateMetaTag('description', description);
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:url', url);
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    
    // Add canonical link
    updateLinkTag('canonical', url);
  });
  
  function updateMetaTag(name: string, content: string) {
    let tag = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      if (name.startsWith('og:')) {
        tag.setAttribute('property', name);
      } else {
        tag.setAttribute('name', name);
      }
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  }
  
  function updateLinkTag(rel: string, href: string) {
    let tag = document.querySelector(`link[rel="${rel}"]`);
    if (!tag) {
      tag = document.createElement('link');
      tag.setAttribute('rel', rel);
      document.head.appendChild(tag);
    }
    tag.setAttribute('href', href);
  }
</script>

<svelte:head>
  <script type="application/ld+json">
    {JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": subcategory ? `${subcategory?.name || ''} - ${category.name}` : category.name,
      "description": subcategory?.description || category.description,
      "url": subcategory 
        ? `https://driplo.com/${category.slug}/${subcategory.slug}`
        : `https://driplo.com/${category.slug}`,
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://driplo.com"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": category.name,
            "item": `https://driplo.com/${category.slug}`
          },
          ...(subcategory ? [{
            "@type": "ListItem",
            "position": 3,
            "name": subcategory?.name,
            "item": `https://driplo.com/${category.slug}/${subcategory.slug}`
          }] : [])
        ]
      }
    })}
  </script>
</svelte:head>