# Deployment Guide - Trauma Room Trainer
**Complete Deployment Documentation for Production Release**

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [File Optimization](#file-optimization)
3. [Hosting Options](#hosting-options)
4. [Configuration](#configuration)
5. [Performance Optimization](#performance-optimization)
6. [Security](#security)
7. [Post-Deployment](#post-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### ✅ Code Completion
- [ ] All phases (1-12) completed
- [ ] All features functional
- [ ] All tests passed (see TESTING_GUIDE.md)
- [ ] No console errors
- [ ] Browser compatibility verified

### ✅ Content Preparation
- [ ] Default cart configuration finalized
- [ ] Training scenarios created
- [ ] Sound effects added (optional)
- [ ] Documentation complete
- [ ] README.md updated

### ✅ Assets & Resources
- [ ] Three.js library accessible
- [ ] All images optimized
- [ ] Sound files compressed (if used)
- [ ] No broken links
- [ ] No hardcoded local paths

---

## File Optimization

### 1. JavaScript Minification

**Minify teacher.js:**
```bash
# Install terser (if not installed)
npm install -g terser

# Minify teacher.js
terser teacher.js -o teacher.min.js --compress --mangle

# Minify trainer.js
terser trainer.js -o trainer.min.js --compress --mangle
```

**Update HTML references:**
```html
<!-- Change from: -->
<script src="teacher.js"></script>

<!-- To: -->
<script src="teacher.min.js"></script>
```

**Expected Results:**
- teacher.js: ~2500 lines → ~80KB minified
- trainer.js: ~1200 lines → ~45KB minified
- Total savings: ~60% file size reduction

### 2. Three.js Optimization

**Option A: Use CDN (Current - Recommended for simplicity)**
```html
<script src="https://unpkg.com/three@0.160.0/build/three.min.js"></script>
```

**Option B: Use ES Modules + Tree Shaking (Advanced)**
```javascript
// Use only what you need
import { Scene, PerspectiveCamera, WebGLRenderer, BoxGeometry, MeshStandardMaterial } from 'three';
```

**Benefits:**
- Smaller bundle size (~200KB vs 600KB)
- Faster initial load
- Modern module system

### 3. Image Optimization

**Compress any images:**
```bash
# Using ImageMagick
mogrify -quality 85 -resize 1920x1920\> *.jpg
mogrify -quality 85 *.png

# Or use online tools:
# - TinyPNG (https://tinypng.com)
# - Squoosh (https://squoosh.app)
```

### 4. Sound File Compression

**Compress audio files:**
```bash
# Convert to MP3 at 128kbps (good quality, smaller size)
ffmpeg -i input.wav -codec:a libmp3lame -b:a 128k output.mp3

# Or use Audacity:
# File → Export → MP3 → Quality: Standard (128kbps)
```

---

## Hosting Options

### Option 1: GitHub Pages (Recommended for Free Hosting)

**Advantages:**
- Free hosting
- HTTPS included
- Custom domain support
- Automatic deployment

**Steps:**

1. **Create GitHub Repository:**
```bash
git init
git add .
git commit -m "Initial commit - Trauma Room Trainer"
git remote add origin https://github.com/yourusername/trauma-room-trainer.git
git push -u origin main
```

2. **Enable GitHub Pages:**
- Go to repository Settings
- Scroll to "Pages" section
- Source: Deploy from branch → main
- Folder: / (root)
- Click Save

3. **Access Your Site:**
```
https://yourusername.github.io/trauma-room-trainer/
```

4. **Custom Domain (Optional):**
- Add CNAME file with your domain
- Update DNS records at domain registrar

**Example CNAME:**
```
trauma-trainer.yourdomain.com
```

### Option 2: Netlify

**Advantages:**
- Free tier generous
- Automatic HTTPS
- Continuous deployment
- Excellent performance
- Form handling
- Analytics

**Steps:**

1. **Sign up:** https://netlify.com
2. **Connect Repository:**
   - New site from Git
   - Connect to GitHub
   - Select repository
3. **Build Settings:**
   - Build command: (leave empty for static site)
   - Publish directory: `/` (root)
4. **Deploy!**

**Site URL:**
```
https://your-site-name.netlify.app
```

**Custom Domain:**
- Settings → Domain management → Add custom domain

### Option 3: Vercel

**Advantages:**
- Edge network (fast worldwide)
- Excellent developer experience
- Free tier
- Analytics included

**Steps:**

1. **Sign up:** https://vercel.com
2. **Import Repository:**
   - New Project → Import Git Repository
3. **Deploy Settings:**
   - Framework: None (static)
   - Root Directory: `./`
4. **Deploy**

**Site URL:**
```
https://your-project.vercel.app
```

### Option 4: AWS S3 + CloudFront

**Advantages:**
- Scalable
- Fast (CDN)
- Pay-as-you-go
- Full control

**Steps:**

1. **Create S3 Bucket:**
```bash
aws s3 mb s3://trauma-room-trainer
```

2. **Upload Files:**
```bash
aws s3 sync . s3://trauma-room-trainer --exclude ".git/*"
```

3. **Enable Static Website Hosting:**
```bash
aws s3 website s3://trauma-room-trainer --index-document index.html
```

4. **Set Bucket Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::trauma-room-trainer/*"
  }]
}
```

5. **Create CloudFront Distribution:**
- Origin: S3 bucket URL
- Viewer Protocol Policy: Redirect HTTP to HTTPS
- Compress Objects: Yes

**Cost Estimate:**
- 1000 visitors/month: ~$1-2
- 10000 visitors/month: ~$5-10

### Option 5: Self-Hosted (VPS)

**Advantages:**
- Full control
- Custom server configuration
- No vendor lock-in

**Requirements:**
- Linux server (Ubuntu/Debian)
- Nginx or Apache
- SSL certificate (Let's Encrypt)

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name trauma-trainer.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name trauma-trainer.com;

    ssl_certificate /etc/letsencrypt/live/trauma-trainer.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/trauma-trainer.com/privkey.pem;

    root /var/www/trauma-room-trainer;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Don't cache HTML
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
```

---

## Configuration

### Production Configuration File

**Create `config.js`:**
```javascript
const PRODUCTION_CONFIG = {
    // API endpoints (if you add backend later)
    apiEndpoint: 'https://api.trauma-trainer.com',

    // Analytics (optional)
    analyticsId: 'G-XXXXXXXXXX', // Google Analytics

    // Feature flags
    enableSounds: true,
    enableAnalytics: true,
    debugMode: false,

    // Limits
    maxFileSize: 5 * 1024 * 1024, // 5 MB
    maxCarts: 25,
    maxDrawers: 10,

    // CDN URLs
    threeJsUrl: 'https://unpkg.com/three@0.160.0/build/three.min.js',

    // Version
    version: '1.0.0',
    buildDate: '2025-11-06'
};

// Make available globally
window.PRODUCTION_CONFIG = PRODUCTION_CONFIG;
```

**Include in HTML:**
```html
<script src="config.js"></script>
<script src="teacher.min.js"></script>
```

### Environment Variables

**Development vs Production:**
```javascript
const IS_PRODUCTION = location.hostname !== 'localhost';

const CONFIG = {
    debug: !IS_PRODUCTION,
    apiUrl: IS_PRODUCTION
        ? 'https://api.trauma-trainer.com'
        : 'http://localhost:3000'
};
```

---

## Performance Optimization

### 1. Enable Compression

**Server-side (Nginx):**
```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
```

**Result:** ~70% size reduction for text files

### 2. Caching Strategy

**Cache Headers:**
```nginx
# Immutable assets (versioned files)
location ~* \.min\.(js|css)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Dynamic content
location ~* \.(html)$ {
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

### 3. CDN Usage

**Benefits:**
- Faster load times globally
- Reduced server load
- Better caching

**Recommended CDNs:**
- **Cloudflare** - Free tier available
- **CloudFront** - AWS service
- **Fastly** - Premium option

### 4. Lazy Loading

**Load Three.js only when needed:**
```javascript
function loadThreeJS() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/three@0.160.0/build/three.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Load only when user starts
loadThreeJS().then(() => {
    init();
});
```

---

## Security

### 1. Content Security Policy (CSP)

**Add to HTML:**
```html
<meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://unpkg.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data:;
    font-src 'self';
    connect-src 'self';
">
```

### 2. HTTPS Only

**Force HTTPS (Nginx):**
```nginx
server {
    listen 80;
    return 301 https://$host$request_uri;
}
```

### 3. Security Headers

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

### 4. Rate Limiting

**Prevent abuse:**
```nginx
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
limit_req zone=general burst=20 nodelay;
```

---

## Post-Deployment

### 1. Verification Checklist

- [ ] **Site accessible** at production URL
- [ ] **HTTPS working** (padlock in browser)
- [ ] **All pages load** correctly
- [ ] **3D rendering works** on production
- [ ] **LocalStorage functional**
- [ ] **Import/Export working**
- [ ] **No console errors**
- [ ] **Mobile responsive**
- [ ] **Performance good** (F3 FPS check)

### 2. Analytics Setup (Optional)

**Google Analytics:**
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

**Track Custom Events:**
```javascript
function trackEvent(category, action, label) {
    if (window.gtag && PRODUCTION_CONFIG.enableAnalytics) {
        gtag('event', action, {
            'event_category': category,
            'event_label': label
        });
    }
}

// Example usage
trackEvent('Training', 'scenario_completed', scenario.name);
```

### 3. Monitoring

**Uptime Monitoring:**
- **UptimeRobot** - Free, checks every 5 minutes
- **Pingdom** - Advanced monitoring
- **StatusCake** - Free tier available

**Error Tracking:**
```javascript
window.addEventListener('error', (event) => {
    // Send error to monitoring service
    console.error('Global error:', event.error);

    // Could send to service like Sentry
    if (window.Sentry) {
        Sentry.captureException(event.error);
    }
});
```

### 4. Backup Strategy

**Regular Backups:**
```bash
#!/bin/bash
# backup.sh - Run daily via cron

DATE=$(date +%Y%m%d)
BACKUP_DIR="/backups/trauma-trainer"

# Backup files
tar -czf "$BACKUP_DIR/files-$DATE.tar.gz" /var/www/trauma-room-trainer

# Backup configs (if using server)
tar -czf "$BACKUP_DIR/config-$DATE.tar.gz" /etc/nginx/sites-available/trauma-trainer

# Keep only last 30 days
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete
```

---

## Troubleshooting

### Issue: Three.js not loading

**Symptoms:**
- Console error: "THREE is not defined"
- Black screen instead of 3D scene

**Solutions:**
1. Check CDN URL is accessible
2. Verify script loads before teacher.js
3. Check Content Security Policy allows CDN
4. Try alternative CDN:
```html
<!-- Backup CDN -->
<script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>
```

### Issue: Pointer lock not working

**Symptoms:**
- Mouse cursor visible in training mode
- Can't look around

**Solutions:**
1. Ensure HTTPS (pointer lock requires secure context)
2. Check browser console for errors
3. Verify user gesture initiated lock (click required)

### Issue: Performance problems

**Symptoms:**
- FPS below 30
- Stuttering movement
- Slow loading

**Solutions:**
1. Check quality setting (should auto-detect)
2. Reduce number of carts
3. Disable shadows (Low quality)
4. Check browser GPU acceleration enabled
5. Close other tabs/applications

### Issue: LocalStorage not working

**Symptoms:**
- Settings don't persist
- Autosave failing

**Solutions:**
1. Check browser allows localStorage (not in private mode)
2. Verify not exceeding 5MB limit
3. Check browser console for quota errors

### Issue: Mobile not working

**Symptoms:**
- Controls not functional
- Layout broken

**Solutions:**
1. Verify responsive CSS
2. Check touch event handlers
3. Ensure quality auto-detects to Low
4. Test on actual device (not just emulator)

---

## Production URLs

### GitHub Pages
```
https://yourusername.github.io/trauma-room-trainer/
https://yourusername.github.io/trauma-room-trainer/trainer.html
```

### Custom Domain
```
https://trauma-trainer.yourdomain.com/
https://trauma-trainer.yourdomain.com/trainer.html
```

### Netlify
```
https://trauma-room-trainer.netlify.app/
https://trauma-room-trainer.netlify.app/trainer.html
```

---

## Maintenance

### Regular Updates

**Monthly:**
- [ ] Check for Three.js updates
- [ ] Review analytics for usage patterns
- [ ] Monitor error logs
- [ ] Test on latest browsers

**Quarterly:**
- [ ] Security audit
- [ ] Performance review
- [ ] User feedback incorporation
- [ ] Browser compatibility check

**Annually:**
- [ ] Major version bump
- [ ] Full codebase review
- [ ] Dependency updates
- [ ] Feature additions

---

## Version History

**Version 1.0.0** (Initial Release)
- Designer mode with 3D cart placement
- Training mode with first-person navigation
- 7 cart types supported
- Quality settings (Low/Medium/High)
- Sound effects system
- Complete testing suite

---

## Support & Documentation

**Documentation:**
- `README.md` - Overview and quick start
- `CONVERSION_PLAN.md` - Technical architecture
- `TESTING_GUIDE.md` - Complete testing procedures
- `DEPLOYMENT_GUIDE.md` - This file

**Contact:**
- GitHub Issues: Report bugs and request features
- Email: [your-email@domain.com]
- Documentation: [link to wiki/docs]

---

**End of Deployment Guide**
**Version:** 1.0
**Last Updated:** 2025-11-06
**Next Review:** 2025-12-06
