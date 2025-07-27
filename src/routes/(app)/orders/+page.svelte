<script lang="ts">
    import { page } from '$app/stores';
    import OrderList from '$lib/components/orders/OrderList.svelte';
    import type { PageData } from './$types';
    import { Package, ShoppingBag, TrendingUp, Calendar, Filter, Download, ChevronDown, BarChart3 } from 'lucide-svelte';
    
    let { data }: { data: PageData } = $props();
    
    let activeTab = $derived($page.url.searchParams.get('tab') || 'all');
    let statusFilter = $derived($page.url.searchParams.get('status') || null);
    let dateFrom = $derived($page.url.searchParams.get('from') || '');
    let dateTo = $derived($page.url.searchParams.get('to') || '');
    
    const tabs = [
        { id: 'all', label: 'All Orders', icon: Package },
        { id: 'buying', label: 'Purchases', icon: ShoppingBag },
        { id: 'selling', label: 'Sales', icon: TrendingUp }
    ];
    
    const statuses = [
        { value: '', label: 'All Statuses' },
        { value: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-800' },
        { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
        { value: 'processing', label: 'Processing', color: 'bg-indigo-100 text-indigo-800' },
        { value: 'shipped', label: 'Shipped', color: 'bg-purple-100 text-purple-800' },
        { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800' },
        { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
        { value: 'refunded', label: 'Refunded', color: 'bg-gray-100 text-gray-800' }
    ];

    async function exportOrders(format: 'csv' | 'pdf') {
        const params = new URLSearchParams($page.url.searchParams);
        params.set('format', format);
        
        try {
            const response = await fetch(`/api/orders/export?${params}`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `orders-${new Date().toISOString().split('T')[0]}.${format}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Export failed:', error);
        }
    }

    // Order statistics
    let stats = $state<any>(null);
    let showStats = $state(false);
    
    async function loadStats() {
        const params = new URLSearchParams();
        params.set('role', activeTab);
        
        try {
            const response = await fetch(`/api/orders/stats?${params}`);
            if (response.ok) {
                stats = await response.json();
                showStats = true;
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }

    function formatPrice(cents: number) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(cents / 100);
    }
</script>

<svelte:head>
    <title>Orders - Driplo</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Header -->
        <div class="mb-8">
            <h1 class="text-3xl font-semibold text-gray-900">Orders</h1>
            <p class="mt-2 text-sm text-gray-600">Manage your purchases and sales in one place</p>
        </div>
        
        <!-- Tabs -->
        <div class="flex space-x-1 bg-gray-100/80 p-1 rounded-xl mb-6 overflow-x-auto">
            {#each tabs as tab (tab.id)}
                <a 
                    href="?tab={tab.id}{statusFilter ? `&status=${statusFilter}` : ''}"
                    class="flex-1 flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap min-w-fit {activeTab === tab.id ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
                >
                    <svelte:component this={tab.icon} class="w-4 h-4" />
                    <span class="hidden sm:inline">{tab.label}</span>
                    <span class="sm:hidden">{tab.label.split(' ')[0]}</span>
                </a>
            {/each}
        </div>
        
        <!-- Filters -->
        <div class="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <!-- Status filter -->
                <div class="relative sm:col-span-2 md:col-span-1">
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                    <div class="relative">
                        <Filter class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select 
                            class="pl-10 pr-10 py-2 w-full bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                            value={statusFilter || ''}
                            onchange={(e) => {
                                const status = e.currentTarget.value;
                                const params = new URLSearchParams($page.url.searchParams);
                                if (status) {
                                    params.set('status', status);
                                } else {
                                    params.delete('status');
                                }
                                window.location.href = `?${params.toString()}`;
                            }}
                        >
                            {#each statuses as status (status.value)}
                                <option value={status.value}>{status.label}</option>
                            {/each}
                        </select>
                        <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>
                
                <!-- Date from -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">From Date</label>
                    <div class="relative">
                        <Calendar class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="date" 
                            class="pl-10 pr-3 py-2 w-full bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            value={dateFrom}
                            onchange={(e) => {
                                const from = e.currentTarget.value;
                                const params = new URLSearchParams($page.url.searchParams);
                                if (from) {
                                    params.set('from', from);
                                } else {
                                    params.delete('from');
                                }
                                window.location.href = `?${params.toString()}`;
                            }}
                        />
                    </div>
                </div>
                
                <!-- Date to -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">To Date</label>
                    <div class="relative">
                        <Calendar class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="date" 
                            class="pl-10 pr-3 py-2 w-full bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            value={dateTo}
                            onchange={(e) => {
                                const to = e.currentTarget.value;
                                const params = new URLSearchParams($page.url.searchParams);
                                if (to) {
                                    params.set('to', to);
                                } else {
                                    params.delete('to');
                                }
                                window.location.href = `?${params.toString()}`;
                            }}
                        />
                    </div>
                </div>
                
                <!-- Actions -->
                <div class="col-span-full sm:col-span-2 md:col-span-1 flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-end gap-2">
                    <button 
                        class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors sm:flex-1 md:flex-initial min-h-[44px]"
                        onclick={() => {
                            const params = new URLSearchParams($page.url.searchParams);
                            params.delete('status');
                            params.delete('from');
                            params.delete('to');
                            window.location.href = `?${params.toString()}`;
                        }}
                    >
                        Clear
                    </button>
                    <button 
                        class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 sm:flex-1 md:flex-initial min-h-[44px]"
                        onclick={() => showStats ? showStats = false : loadStats()}
                    >
                        <BarChart3 class="w-4 h-4" />
                        <span class="sm:hidden md:inline">{showStats ? 'Hide' : 'Show'} Stats</span>
                        <span class="hidden sm:inline md:hidden">Stats</span>
                    </button>
                    <div class="relative dropdown dropdown-end sm:flex-1 md:flex-initial">
                        <div tabindex="0" role="button" class="w-full px-3 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-[#6BB8DB] transition-colors flex items-center justify-center gap-2 cursor-pointer min-h-[44px]">
                            <Download class="w-4 h-4" />
                            Export
                        </div>
                        <ul tabindex="0" class="dropdown-content mt-2 bg-white rounded-lg shadow-lg border border-gray-200 w-48 p-1 z-50">
                            <li><a onclick={() => exportOrders('csv')} class="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md cursor-pointer">Export as CSV</a></li>
                            <li><a onclick={() => exportOrders('pdf')} class="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md cursor-pointer">Export as PDF</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Statistics Dashboard -->
        {#if showStats && stats}
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <!-- Summary Cards -->
                <div class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between mb-4">
                        <div class="p-2 bg-primary/10 rounded-lg">
                            <Package class="w-6 h-6 text-primary" />
                        </div>
                        <span class="text-xs text-gray-500">All Time</span>
                    </div>
                    <h3 class="text-sm font-medium text-gray-600">Total Orders</h3>
                    <p class="text-2xl font-semibold text-gray-900 mt-1">{stats.totalOrders}</p>
                </div>
                
                <div class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between mb-4">
                        <div class="p-2 bg-green-100 rounded-lg">
                            <TrendingUp class="w-6 h-6 text-green-600" />
                        </div>
                        <span class="text-xs text-gray-500">All Time</span>
                    </div>
                    <h3 class="text-sm font-medium text-gray-600">Total Revenue</h3>
                    <p class="text-2xl font-semibold text-gray-900 mt-1">{formatPrice(stats.totalRevenue)}</p>
                </div>
                
                <div class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between mb-4">
                        <div class="p-2 bg-purple-100 rounded-lg">
                            <BarChart3 class="w-6 h-6 text-purple-600" />
                        </div>
                        <span class="text-xs text-gray-500">Average</span>
                    </div>
                    <h3 class="text-sm font-medium text-gray-600">Order Value</h3>
                    <p class="text-2xl font-semibold text-gray-900 mt-1">{formatPrice(stats.averageOrderValue)}</p>
                </div>
                
                <!-- Orders by Status -->
                <div class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <h3 class="text-sm font-medium text-gray-900 mb-4">Orders by Status</h3>
                    <div class="space-y-3">
                        {#each Object.entries(stats.ordersByStatus) as [status, count] (status)}
                            {@const statusConfig = statuses.find(s => s.value === status)}
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full {statusConfig?.color || 'bg-gray-100 text-gray-800'}">
                                        {status}
                                    </span>
                                </div>
                                <span class="text-sm font-medium text-gray-900">{count}</span>
                            </div>
                        {/each}
                    </div>
                </div>
                
                <!-- Monthly Trends -->
                <div class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow col-span-full md:col-span-2">
                    <h3 class="text-sm font-medium text-gray-900 mb-4">Monthly Trends</h3>
                    <div class="space-y-3">
                        {#each stats.monthlyTrends as trend (trend.month)}
                            <div class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                <span class="text-sm text-gray-600">
                                    {new Date(trend.month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                                </span>
                                <div class="text-right">
                                    <div class="text-sm font-medium text-gray-900">{trend.orders} orders</div>
                                    <div class="text-xs text-gray-500">{formatPrice(trend.revenue)}</div>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        {/if}
        
        <!-- Order list -->
        <OrderList 
            role={activeTab === 'buying' ? 'buyer' : activeTab === 'selling' ? 'seller' : 'all'}
            status={statusFilter}
            dateFrom={dateFrom}
            dateTo={dateTo}
        />
    </div>
</div>