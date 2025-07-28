# 🚨 URGENT: Fix Authentication Issues

## Problem
You're getting a 500 error on registration because:
1. CSP (Content Security Policy) is blocking Google reCAPTCHA scripts
2. Missing RECAPTCHA environment variables

## ✅ Fixed
1. **CSP Headers** - Added Google reCAPTCHA domains to Content Security Policy in `hooks.server.ts`
2. **Development Mode** - Server will skip CAPTCHA verification if keys not present in development

## 🔧 What You Need To Do NOW:

### Option 1: Disable CAPTCHA for Development (Quick Fix)
Add these to your `.env` file:
```
NODE_ENV=development
```

### Option 2: Set Up reCAPTCHA Properly
1. Go to https://www.google.com/recaptcha/admin
2. Create a new site with reCAPTCHA v2 ("I'm not a robot" Checkbox)
3. Add these domains:
   - localhost
   - driplo-bg.vercel.app
4. Copy the keys and add to your `.env`:
```
PUBLIC_RECAPTCHA_SITE_KEY=your_site_key_here
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

### Option 3: Temporarily Disable CAPTCHA
If you just want to test, comment out the CAPTCHA in registration:
- In `/src/routes/(auth)/register/+page.svelte` remove the `<CaptchaWrapper>` component
- In the submit button, remove the CAPTCHA check from disabled condition

## 🎯 After Fixing Environment Variables:
1. Restart your dev server: `npm run dev`
2. Try registering again

## 📧 Email Issues
Remember: Without custom SMTP configured in Supabase, emails will only be sent to team members' addresses. Configure SMTP in your Supabase dashboard for production use.

## Need Help?
The auth system is working, it just needs proper environment variables. The 500 error will go away once you add the CAPTCHA keys or set NODE_ENV=development.