// Simple script to clear server-side cache by making a request that forces fresh data
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5190';

async function clearCache() {
    console.log('Clearing server cache by forcing page reload...');
    
    try {
        // Force reload homepage
        const response = await fetch(BASE_URL, {
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        if (response.ok) {
            console.log('✓ Homepage cache cleared');
        } else {
            console.log('✗ Failed to clear homepage cache:', response.status);
        }
        
        // Force reload a listing page
        const listingResponse = await fetch(`${BASE_URL}/listings/a0ace437-c531-4f78-8339-34fa8a8160b0`, {
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        if (listingResponse.ok) {
            console.log('✓ Listing page cache cleared');
        } else {
            console.log('✗ Failed to clear listing page cache:', listingResponse.status);
        }
        
    } catch (error) {
        console.error('Error clearing cache:', error.message);
    }
}

clearCache();