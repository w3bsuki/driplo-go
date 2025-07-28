import type { ComponentType, SvelteComponent } from 'svelte';

/**
 * Creates a lazy-loaded component wrapper that loads the component on demand
 * @param loader Function that imports the component
 * @param options Configuration for lazy loading behavior
 */
export function createLazyComponent<T extends SvelteComponent>(
    loader: () => Promise<{ default: ComponentType<T> }>,
    options?: {
        preloadOnHover?: boolean;
        preloadOnFocus?: boolean;
        preloadDelay?: number;
    }
) {
    let component: ComponentType<T> | null = null;
    let loading = false;
    let loadPromise: Promise<ComponentType<T>> | null = null;

    const load = async () => {
        if (component) return component;
        if (loadPromise) return loadPromise;

        loading = true;
        loadPromise = loader()
            .then(module => {
                component = module.default;
                return component;
            })
            .finally(() => {
                loading = false;
            });

        return loadPromise;
    };

    const preload = () => {
        if (!component && !loading) {
            load();
        }
    };

    return {
        load,
        preload,
        get component() {
            return component;
        },
        get loading() {
            return loading;
        }
    };
}

/**
 * Preloads multiple components in parallel
 * @param loaders Array of component loaders
 */
export async function preloadComponents(
    loaders: Array<() => Promise<any>>
): Promise<void> {
    await Promise.all(loaders.map(loader => loader().catch(() => {})));
}

/**
 * Creates a route-based code splitting helper
 * @param routes Map of route patterns to component loaders
 */
export function createRoutePreloader(
    routes: Record<string, () => Promise<any>>
) {
    const preloadedRoutes = new Set<string>();

    return {
        preloadRoute(route: string) {
            if (preloadedRoutes.has(route)) return;

            const loader = routes[route];
            if (loader) {
                preloadedRoutes.add(route);
                loader().catch(() => {
                    preloadedRoutes.delete(route);
                });
            }
        },

        preloadMatchingRoutes(currentPath: string) {
            Object.entries(routes).forEach(([pattern, loader]) => {
                if (currentPath.includes(pattern) && !preloadedRoutes.has(pattern)) {
                    preloadedRoutes.add(pattern);
                    loader().catch(() => {
                        preloadedRoutes.delete(pattern);
                    });
                }
            });
        }
    };
}

/**
 * Intersection Observer based lazy loader for components
 * @param loader Component loader function
 * @param rootMargin Margin around the root
 */
export function createVisibilityLoader<T extends SvelteComponent>(
    loader: () => Promise<{ default: ComponentType<T> }>,
    rootMargin = '50px'
) {
    let component: ComponentType<T> | null = null;
    let observer: IntersectionObserver | null = null;

    const observe = (element: HTMLElement) => {
        if (component || observer) return;

        observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        loader().then(module => {
                            component = module.default;
                        });
                        observer?.disconnect();
                    }
                });
            },
            { rootMargin }
        );

        observer.observe(element);
    };

    const cleanup = () => {
        observer?.disconnect();
        observer = null;
    };

    return {
        observe,
        cleanup,
        get component() {
            return component;
        }
    };
}