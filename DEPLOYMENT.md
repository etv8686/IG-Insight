# 🚀 IG Insights - Deployment Guide

## Quick Deploy Options

### 1. Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts:
# - Project name: ig-insights
# - Framework: Vite
# - Build command: npm run build
# - Output directory: dist
```

### 2. Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
npm run build
netlify deploy --prod --dir=dist
```

### 3. GitHub Pages
```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts:
"deploy": "gh-pages -d dist"

# Deploy
npm run build
npm run deploy
```

## Custom Domain Setup

### For Vercel:
1. Go to project dashboard → Domains
2. Add your domain (e.g., `iginsights.com`)
3. Update DNS records:
   - CNAME: `www` → `cname.vercel-dns.com`
   - A: `@` → `76.76.19.61`

### For Netlify:
1. Site settings → Domain management
2. Add custom domain
3. Update DNS as shown
4. Enable HTTPS

## Build Commands
```bash
# Development
npm run dev

# Production build
npm run build

# Preview build
npm run preview
```

## Features
- ✅ 100% Private (runs in browser)
- ✅ No data sent to servers
- ✅ Works with any Instagram export
- ✅ Modern dark theme
- ✅ Mobile responsive
- ✅ Fast loading

## Domain Ideas
- `iginsights.com`
- `followinsights.app`
- `instagramanalyzer.com`
- `followchecker.io`
