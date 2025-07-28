export const socialPlatforms = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'Instagram',
    placeholder: '@yourbrand',
    urlPrefix: 'https://instagram.com/',
    color: 'bg-gradient-to-br from-purple-600 to-pink-500'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: 'TikTok', // You'll need a custom icon
    placeholder: '@yourbrand',
    urlPrefix: 'https://tiktok.com/@',
    color: 'bg-black'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'Facebook',
    placeholder: 'yourbrand',
    urlPrefix: 'https://facebook.com/',
    color: 'bg-blue-600'
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: 'Twitter',
    placeholder: '@yourbrand',
    urlPrefix: 'https://x.com/',
    color: 'bg-black'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: 'Youtube',
    placeholder: '@yourbrand',
    urlPrefix: 'https://youtube.com/@',
    color: 'bg-red-600'
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    icon: 'Pinterest', // You'll need a custom icon
    placeholder: 'yourbrand',
    urlPrefix: 'https://pinterest.com/',
    color: 'bg-red-700'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: 'Linkedin',
    placeholder: 'company/yourbrand',
    urlPrefix: 'https://linkedin.com/',
    color: 'bg-blue-700'
  }
] as const;

export type SocialPlatform = typeof socialPlatforms[number]['id'];

export interface SocialMediaAccount {
  id?: string;
  user_id: string;
  platform: SocialPlatform;
  username: string;
  url?: string;
  is_verified?: boolean;
  followers_count?: number;
  created_at?: string;
  updated_at?: string;
}

export function formatSocialUsername(username: string): string {
  // Remove @ symbol if present
  return username.replace(/^@/, '');
}

export function generateSocialUrl(platform: SocialPlatform, username: string): string {
  const cleanUsername = formatSocialUsername(username);
  const platformConfig = socialPlatforms.find(p => p.id === platform);
  
  if (!platformConfig) return '';
  
  // Special case for LinkedIn which can be personal or company
  if (platform === 'linkedin' && !cleanUsername.includes('/')) {
    return `${platformConfig.urlPrefix}in/${cleanUsername}`;
  }
  
  return `${platformConfig.urlPrefix}${cleanUsername}`;
}

export function extractUsernameFromUrl(url: string): string {
  // Remove protocol and www
  let cleaned = url.replace(/^https?:\/\/(www\.)?/, '');
  
  // Extract username based on platform patterns
  const patterns = [
    /instagram\.com\/([\w.]+)/,
    /tiktok\.com\/@?([\w.]+)/,
    /facebook\.com\/([\w.]+)/,
    /(twitter|x)\.com\/([\w]+)/,
    /youtube\.com\/(c\/|channel\/|@)?([\w-]+)/,
    /pinterest\.com\/([\w]+)/,
    /linkedin\.com\/(in|company)\/([\w-]+)/
  ];
  
  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      // Return the last captured group (username)
      return match[match.length - 1];
    }
  }
  
  return '';
}