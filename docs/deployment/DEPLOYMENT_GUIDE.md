# FlipOps Deployment Guide - Vercel + Cloudflare

## Overview
This guide will help you deploy your FlipOps application to Vercel and connect it to your custom domain through Cloudflare.

## Prerequisites
- GitHub account (for connecting to Vercel)
- Vercel account (free tier works)
- Cloudflare account with your domain already added
- Your domain registered and active

## Step 1: Prepare Your Code for Deployment

### 1.1 Create a Git Repository
First, let's initialize git and push your code to GitHub:

```bash
# Initialize git in your project
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit - FlipOps platform"

# Create a new repository on GitHub (via browser)
# Then connect your local repo to GitHub:
git remote add origin https://github.com/YOUR_USERNAME/flipops-site.git
git branch -M main
git push -u origin main
```

### 1.2 Update Environment Variables
Create a `.env.example` file to document required environment variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app

# Your app URL (update this with your actual domain)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Step 2: Deploy to Vercel

### 2.1 Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Select "flipops-site" repository

### 2.2 Configure Build Settings
Vercel should auto-detect Next.js settings:
- **Framework Preset**: Next.js
- **Root Directory**: `./` (or `flipops-site` if in a subdirectory)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

### 2.3 Set Environment Variables
In Vercel dashboard, go to Settings → Environment Variables and add:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_dm9jYWwtY2F0ZmlzaC0yMi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_tDBLuqFTTXDPIdYk9sE6FjwJqMHarqAD2ZHmEn9w3i
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 2.4 Deploy
Click "Deploy" and wait for the build to complete. You'll get a URL like:
`https://flipops-site-xxxxx.vercel.app`

## Step 3: Configure Cloudflare

### 3.1 DNS Settings
1. Log into Cloudflare Dashboard
2. Select your domain
3. Go to DNS → Records
4. Add these records:

**For apex domain (yourdomain.com):**
```
Type: CNAME
Name: @
Target: cname.vercel-dns.com
Proxy: OFF (DNS only - important!)
```

**For www subdomain:**
```
Type: CNAME
Name: www
Target: cname.vercel-dns.com
Proxy: OFF (DNS only - important!)
```

### 3.2 SSL/TLS Settings
In Cloudflare:
1. Go to SSL/TLS → Overview
2. Set encryption mode to "Full"
3. Go to SSL/TLS → Edge Certificates
4. Enable "Always Use HTTPS"

### 3.3 Page Rules (Optional)
Add a page rule to redirect www to non-www (or vice versa):
1. Go to Rules → Page Rules
2. Create rule: `www.yourdomain.com/*`
3. Setting: "Forwarding URL" (301)
4. Destination: `https://yourdomain.com/$1`

## Step 4: Connect Domain to Vercel

### 4.1 Add Domain in Vercel
1. In Vercel dashboard, go to your project
2. Go to Settings → Domains
3. Add your domain: `yourdomain.com`
4. Add www variant: `www.yourdomain.com`

### 4.2 Verify DNS Configuration
Vercel will show you the required DNS records. Since we're using Cloudflare:
- Vercel will detect CNAME configuration
- Wait for DNS propagation (5-30 minutes)
- Vercel will automatically provision SSL

## Step 5: Update Clerk for Production

### 5.1 Configure Clerk Production Keys
1. Go to [clerk.com](https://dashboard.clerk.com)
2. Create a production instance or upgrade current one
3. Add your domain to allowed origins:
   - `https://yourdomain.com`
   - `https://www.yourdomain.com`

### 5.2 Update Production Environment Variables
In Vercel, update these with production values:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 5.3 Set Redirect URLs in Clerk
In Clerk Dashboard → Configure → URLs:
- Sign-in URL: `https://yourdomain.com/sign-in`
- Sign-up URL: `https://yourdomain.com/sign-up`
- After sign-in URL: `https://yourdomain.com/app`
- After sign-up URL: `https://yourdomain.com/app`

## Step 6: Post-Deployment Checklist

### 6.1 Test Everything
- [ ] Landing page loads on custom domain
- [ ] Sign up flow works
- [ ] Sign in flow works
- [ ] Dashboard is accessible after authentication
- [ ] SSL certificate is valid (green padlock)
- [ ] www redirects to non-www (or vice versa)

### 6.2 Performance Optimizations in Cloudflare
1. **Caching**: Go to Caching → Configuration
   - Browser Cache TTL: 4 hours
   - Enable "Always Online"

2. **Speed**: Go to Speed → Optimization
   - Enable Auto Minify (JS, CSS, HTML)
   - Enable Brotli compression

3. **Security**: Go to Security
   - Set Security Level to "Medium"
   - Enable Bot Fight Mode

## Step 7: Monitoring & Maintenance

### 7.1 Set Up Monitoring
- Vercel Analytics (built-in)
- Cloudflare Analytics (free)
- Set up uptime monitoring (e.g., UptimeRobot)

### 7.2 Continuous Deployment
Every push to `main` branch will trigger automatic deployment:
```bash
git add .
git commit -m "Update feature"
git push origin main
# Vercel auto-deploys in ~2 minutes
```

## Troubleshooting

### Issue: Domain not working
- Check DNS propagation: https://dnschecker.org
- Ensure Cloudflare proxy is OFF for Vercel
- Wait 24-48 hours for full propagation

### Issue: SSL errors
- Ensure Cloudflare SSL mode is "Full"
- Check Vercel has provisioned certificate
- Clear browser cache

### Issue: Clerk authentication not working
- Verify production keys are set
- Check allowed origins in Clerk dashboard
- Ensure redirect URLs match your domain

## Important Security Notes

1. **Never commit `.env.local` to git** - it's already in `.gitignore`
2. **Use different Clerk keys for production** - don't use test keys in production
3. **Enable 2FA** on GitHub, Vercel, and Cloudflare accounts
4. **Regular backups** - keep your code backed up

## Support Resources

- Vercel Docs: https://vercel.com/docs
- Cloudflare Docs: https://developers.cloudflare.com
- Clerk Docs: https://clerk.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment

## Next Steps

After successful deployment:
1. Set up custom email domain for Clerk (optional)
2. Configure webhook endpoints for Clerk events
3. Set up database for production (if needed)
4. Implement monitoring and error tracking
5. Set up staging environment for testing

---

**Need Help?**
- Vercel Support: https://vercel.com/support
- Cloudflare Community: https://community.cloudflare.com
- Your deployment URL will be: https://yourdomain.com