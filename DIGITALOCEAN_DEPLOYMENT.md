# DigitalOcean Deployment Guide

## Branch Strategy

**Important:** This deployment uses a separate branch to avoid conflicts with your existing Render deployment.

- **main**: Used for Render deployment (keep this unchanged)
- **digitalocean-deployment**: Used for DigitalOcean App Platform deployment (use this)

## Prerequisites
- DigitalOcean account
- GitHub repository connected
- Neon PostgreSQL database (already configured)

## Deployment Steps

### 1. Create App from GitHub (Current Step)
✅ You're already here! Continue with these settings:

**Repository Settings:**
- Repository: `Tehilla116/event_monolith_app`
- **Branch: `digitalocean-deployment`** ← Use this branch
- Autodeploy: ✅ Enabled

### 2. Configure Backend Service

**Build Settings:**
- Build Command: `bun install`
- Run Command: `bun src/index.ts`
- HTTP Port: `3001`
- Instance Size: Basic (512 MB RAM, $5/month)

**Environment Variables (Required):**
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=<your-neon-database-url>
JWT_SECRET=<generate-a-secure-random-string>
JWT_EXPIRES_IN=7d
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_FROM=noreply@eventapp.com
```

**Important Notes:**
- Use your existing Neon PostgreSQL connection string for `DATABASE_URL`
- Generate a strong JWT_SECRET: `openssl rand -base64 32`
- Mark `JWT_SECRET` and `DATABASE_URL` as **encrypted/secret**

### 3. Configure Frontend Static Site

**Build Settings:**
- Source Directory: `/frontend`
- Build Command: `npm install && npm run build`
- Output Directory: `dist`
- Instance: Static Site (Free)

**Environment Variables (Required):**
```bash
VITE_API_URL=<backend-service-url>
```

**Important:**
- `VITE_API_URL` should be set to your backend service URL
- DigitalOcean will provide this after backend is created
- Format: `https://backend-xxxxx.ondigitalocean.app`

**Routing:**
- Add a Catchall document: `index.html` (for Vue Router SPA support)

### 4. Database Setup

You're already using **Neon PostgreSQL** which is perfect! Just copy your connection string to the `DATABASE_URL` environment variable.

From your `.env`:
```
DATABASE_URL="postgresql://neondb_owner:npg_taWAMTcoxw01@ep-dry-mud-adrq4r4m-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

### 5. CORS Configuration

Your backend already has CORS configured for production. After deployment:

1. Note your frontend URL (e.g., `https://frontend-xxxxx.ondigitalocean.app`)
2. Update CORS in `src/index.ts` if needed (currently allows all origins in development)

### 6. Post-Deployment Steps

**1. Run Database Migrations:**
```bash
# SSH into your backend app or use DigitalOcean Console
bunx prisma db push
```

**2. Create Admin User:**
```bash
# Run the admin creation script
bun run scripts/create-admin.ts
```

**3. Test the Application:**
- Visit frontend URL
- Register a new account
- Test login
- Create an event as organizer
- Test RSVP as attendee

### 7. Monitoring & Logs

**Backend Logs:**
- Go to DigitalOcean Dashboard
- Select your backend service
- Click "Runtime Logs" tab

**Frontend Build Logs:**
- Select your frontend service  
- Click "Build Logs" tab

### 8. Custom Domain (Optional)

**Backend API:**
1. Go to backend service settings
2. Add custom domain (e.g., `api.yourdomain.com`)
3. Update DNS with provided CNAME

**Frontend:**
1. Go to frontend settings
2. Add custom domain (e.g., `events.yourdomain.com`)
3. Update DNS with provided CNAME

Then update `VITE_API_URL` to your custom API domain.

## Cost Estimate

- **Backend Service**: ~$5/month (Basic - 512MB RAM)
- **Frontend Static Site**: $0/month (Free tier)
- **Neon PostgreSQL**: $0-$19/month (Free tier available)
- **Total**: ~$5-24/month

## Troubleshooting

### Build Failures

**Backend:**
- Check if all dependencies are in `package.json`
- Verify `bun install` completes successfully
- Check Node.js compatibility

**Frontend:**
- Ensure `VITE_API_URL` is set during build
- Verify `npm run build` works locally
- Check for TypeScript errors

### Runtime Errors

**502 Bad Gateway:**
- Check if backend is listening on correct port ($PORT)
- Verify health check endpoint returns 200
- Check logs for startup errors

**Database Connection:**
- Verify DATABASE_URL is correct
- Check Neon database is accessible from DigitalOcean
- Ensure connection string includes `sslmode=require`

**CORS Errors:**
- Update CORS configuration to include frontend URL
- Ensure credentials are allowed if needed

### WebSocket Not Working

DigitalOcean App Platform doesn't support WebSocket connections on the free tier. Your app already has graceful fallback implemented!

Users will need to refresh to see updates, or upgrade to a paid plan with WebSocket support.

## Environment Variables Reference

### Backend Required:
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=<neon-connection-string>
JWT_SECRET=<random-secret-key>
JWT_EXPIRES_IN=7d
```

### Backend Optional (Email):
```bash
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_USER=<optional>
EMAIL_PASS=<optional>
EMAIL_FROM=noreply@eventapp.com
```

### Frontend Required:
```bash
VITE_API_URL=<backend-url>
```

## Security Checklist

- ✅ JWT_SECRET is strong and secret
- ✅ DATABASE_URL is encrypted
- ✅ CORS configured properly
- ✅ Database uses SSL connection
- ✅ Environment variables not in source code
- ✅ Admin users created securely

## Managing Multiple Deployments

### Updating DigitalOcean Deployment

To update your DigitalOcean deployment:

```bash
# Make changes in your code
git add .
git commit -m "Your changes"

# Push to digitalocean-deployment branch
git push origin digitalocean-deployment
```

DigitalOcean will automatically rebuild and redeploy with autodeploy enabled.

### Syncing Features Between Branches

To bring features from `main` (Render) to `digitalocean-deployment`:

```bash
# Switch to digitalocean-deployment branch
git checkout digitalocean-deployment

# Merge changes from main
git merge main

# Resolve any conflicts if needed
git push origin digitalocean-deployment
```

To bring features from `digitalocean-deployment` to `main` (Render):

```bash
# Switch to main branch
git checkout main

# Merge changes from digitalocean-deployment
git merge digitalocean-deployment

# Resolve any conflicts if needed
git push origin main
```

**Important:** Keep deployment-specific configurations separate:
- `.do/app.yaml` only in `digitalocean-deployment` branch
- `render.yaml` only in `main` branch
- General code/features can be shared between both

## Next Steps After Deployment

1. ✅ Test all features thoroughly
2. ✅ Create admin user
3. ✅ Test event creation and approval flow
4. ✅ Test RSVP functionality
5. ✅ Test email notifications (check logs)
6. ✅ Set up monitoring/alerts
7. ✅ Add custom domain (optional)
8. ✅ Configure backup strategy

## Support Resources

- [DigitalOcean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [Bun Runtime Documentation](https://bun.sh/docs)
- [Prisma with Neon](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-neon)
- [Vue.js Production Deployment](https://vuejs.org/guide/best-practices/production-deployment.html)

---

**Ready to Deploy!** 🚀

Continue with the "Next" button in DigitalOcean to proceed with deployment.
