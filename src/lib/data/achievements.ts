import type { AchievementDefinition } from '$lib/types/unified'

export const ACHIEVEMENT_DEFINITIONS: Record<string, AchievementDefinition> = {
  first_sale: {
    type: 'first_sale',
    name: 'First Sale',
    description: 'Congratulations on your first sale!',
    icon: '🎉',
    color: 'bg-green-500',
    requirement: 'Complete your first sale',
    levels: [
      {
        level: 1,
        name: 'First Timer',
        requirement: 'Complete 1 sale',
        reward: 'Welcome bonus: +10 seller points'
      }
    ]
  },
  
  power_seller: {
    type: 'power_seller',
    name: 'Power Seller',
    description: 'You\'re becoming a marketplace powerhouse!',
    icon: '⚡',
    color: 'bg-blue-500',
    requirement: 'Complete multiple sales',
    levels: [
      {
        level: 1,
        name: 'Rising Seller',
        requirement: 'Complete 10 sales',
        reward: 'Power Seller badge'
      },
      {
        level: 2,
        name: 'Super Seller',
        requirement: 'Complete 50 sales',
        reward: 'Featured listing boost'
      },
      {
        level: 3,
        name: 'Mega Seller',
        requirement: 'Complete 100 sales',
        reward: 'VIP seller status'
      }
    ]
  },
  
  top_rated: {
    type: 'top_rated',
    name: 'Top Rated',
    description: 'Your customers love you!',
    icon: '⭐',
    color: 'bg-yellow-500',
    requirement: 'Maintain excellent ratings',
    levels: [
      {
        level: 1,
        name: 'Highly Rated',
        requirement: '4.5+ rating with 5+ reviews',
        reward: 'Top Rated badge'
      },
      {
        level: 2,
        name: 'Excellence',
        requirement: '4.8+ rating with 25+ reviews',
        reward: 'Priority search placement'
      },
      {
        level: 3,
        name: 'Legendary',
        requirement: '4.9+ rating with 100+ reviews',
        reward: 'Hall of Fame status'
      }
    ]
  },
  
  verified_seller: {
    type: 'verified_seller',
    name: 'Verified Seller',
    description: 'Trusted by the community',
    icon: '✅',
    color: 'bg-green-600',
    requirement: 'Complete verification process',
    levels: [
      {
        level: 1,
        name: 'Identity Verified',
        requirement: 'Verify email and phone',
        reward: 'Trust badge'
      },
      {
        level: 2,
        name: 'Fully Verified',
        requirement: 'Complete all verifications',
        reward: 'Blue checkmark'
      }
    ]
  },
  
  social_butterfly: {
    type: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Building a strong community presence',
    icon: '🦋',
    color: 'bg-pink-500',
    requirement: 'Gain followers',
    levels: [
      {
        level: 1,
        name: 'Popular',
        requirement: '50+ followers',
        reward: 'Social influence boost'
      },
      {
        level: 2,
        name: 'Influencer',
        requirement: '500+ followers',
        reward: 'Sponsored listing opportunities'
      },
      {
        level: 3,
        name: 'Celebrity',
        requirement: '5000+ followers',
        reward: 'Brand partnership access'
      }
    ]
  },
  
  quick_shipper: {
    type: 'quick_shipper',
    name: 'Quick Shipper',
    description: 'Lightning fast fulfillment',
    icon: '🚀',
    color: 'bg-blue-500',
    requirement: 'Ship orders quickly',
    levels: [
      {
        level: 1,
        name: 'Fast Shipper',
        requirement: 'Ship within 24 hours (10 times)',
        reward: 'Fast shipping badge'
      },
      {
        level: 2,
        name: 'Lightning Fast',
        requirement: 'Ship within 12 hours (25 times)',
        reward: 'Priority seller status'
      }
    ]
  },
  
  loyal_customer: {
    type: 'loyal_customer',
    name: 'Loyal Customer',
    description: 'Supporting the marketplace community',
    icon: '💎',
    color: 'bg-purple-500',
    requirement: 'Make purchases',
    levels: [
      {
        level: 1,
        name: 'Regular Buyer',
        requirement: 'Complete 5 purchases',
        reward: 'Buyer protection boost'
      },
      {
        level: 2,
        name: 'VIP Buyer',
        requirement: 'Complete 25 purchases',
        reward: 'Early access to new listings'
      }
    ]
  },
  
  trendsetter: {
    type: 'trendsetter',
    name: 'Trendsetter',
    description: 'Always ahead of the fashion curve',
    icon: '🔥',
    color: 'bg-red-500',
    requirement: 'List trending items',
    levels: [
      {
        level: 1,
        name: 'Trend Spotter',
        requirement: 'List items in trending categories (5 times)',
        reward: 'Trending badge'
      },
      {
        level: 2,
        name: 'Fashion Forward',
        requirement: 'List items in trending categories (20 times)',
        reward: 'Trendsetter badge'
      }
    ]
  }
}

// Helper functions for achievements
export function getAchievementColor(type: string): string {
  return ACHIEVEMENT_DEFINITIONS[type]?.color || 'bg-gray-500'
}

export function getAchievementIcon(type: string): string {
  return ACHIEVEMENT_DEFINITIONS[type]?.icon || '🏆'
}

export function getAchievementName(type: string, level: number = 1): string {
  const achievement = ACHIEVEMENT_DEFINITIONS[type]
  if (!achievement) return 'Unknown Achievement'
  
  const levelData = achievement.levels.find(l => l.level === level)
  return levelData?.name || achievement.name
}

export function getNextLevelRequirement(type: string, currentLevel: number): string | null {
  const achievement = ACHIEVEMENT_DEFINITIONS[type]
  if (!achievement) return null
  
  const nextLevel = achievement.levels.find(l => l.level === currentLevel + 1)
  return nextLevel?.requirement || null
}

// Check if user qualifies for achievement
export function checkAchievementEligibility(
  type: string, 
  userStats: Record<string, any>
): { eligible: boolean; level: number; progress?: number } {
  const achievement = ACHIEVEMENT_DEFINITIONS[type]
  if (!achievement) return { eligible: false, level: 0 }
  
  // Implementation depends on achievement type
  switch (type) {
    case 'first_sale':
      return {
        eligible: userStats['total_sales'] >= 1,
        level: 1
      }
      
    case 'power_seller':
      if (userStats['total_sales'] >= 100) return { eligible: true, level: 3 }
      if (userStats['total_sales'] >= 50) return { eligible: true, level: 2 }
      if (userStats['total_sales'] >= 10) return { eligible: true, level: 1 }
      return { 
        eligible: false, 
        level: 0, 
        progress: Math.min(userStats['total_sales'] / 10 * 100, 100) 
      }
      
    case 'top_rated':
      const { seller_rating, seller_rating_count } = userStats
      if (seller_rating >= 4.9 && seller_rating_count >= 100) return { eligible: true, level: 3 }
      if (seller_rating >= 4.8 && seller_rating_count >= 25) return { eligible: true, level: 2 }
      if (seller_rating >= 4.5 && seller_rating_count >= 5) return { eligible: true, level: 1 }
      return { eligible: false, level: 0 }
      
    case 'social_butterfly':
      if (userStats['followers_count'] >= 5000) return { eligible: true, level: 3 }
      if (userStats['followers_count'] >= 500) return { eligible: true, level: 2 }
      if (userStats['followers_count'] >= 50) return { eligible: true, level: 1 }
      return { 
        eligible: false, 
        level: 0, 
        progress: Math.min(userStats['followers_count'] / 50 * 100, 100) 
      }
      
    default:
      return { eligible: false, level: 0 }
  }
}