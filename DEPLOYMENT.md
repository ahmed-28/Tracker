# Deployment Guide

## Environment Setup

The app supports multiple environments with different configurations:

### Environment Variables

Create environment-specific files:

1. **Development** (`.env.local`):
```env
VITE_ENVIRONMENT=development
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-dev-anon-key
```

2. **Staging** (`.env.staging`):
```env
VITE_ENVIRONMENT=staging
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-staging-anon-key
```

3. **Production** (`.env.production`):
```env
VITE_ENVIRONMENT=production
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-prod-anon-key
```

## Deployment Platforms

### Vercel

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard:
   - `VITE_ENVIRONMENT=production`
   - `VITE_SUPABASE_URL=your-prod-url`
   - `VITE_SUPABASE_ANON_KEY=your-prod-key`
3. Deploy automatically on push to main branch

### Netlify

1. Connect your repository to Netlify
2. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Add environment variables in Netlify dashboard
4. Enable automatic deployments

### GitHub Pages

1. Build the app: `npm run build`
2. Deploy the `dist` folder to GitHub Pages
3. Set environment variables in GitHub Secrets for GitHub Actions

### Custom Server (VPS/Docker)

#### Using Docker

1. Create `Dockerfile`:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

2. Create `nginx.conf`:
```nginx
events {
    worker_connections 1024;
}

http {
    server {
        listen 80;
        location / {
            root /usr/share/nginx/html;
            index index.html;
            try_files $uri $uri/ /index.html;
        }
    }
}
```

3. Build and run:
```bash
docker build -t workout-tracker .
docker run -p 80:80 \
  -e VITE_SUPABASE_URL=your-url \
  -e VITE_SUPABASE_ANON_KEY=your-key \
  workout-tracker
```

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
      env:
        VITE_ENVIRONMENT: production
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-args: '--prod'
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## Environment-Specific Features

Each environment has different feature flags:

- **Development**: Debug logging enabled, analytics disabled
- **Staging**: All features enabled for testing
- **Production**: Analytics enabled, debug logging disabled

## Security Considerations

1. **Environment Variables**: Never commit real credentials to git
2. **HTTPS**: Always use HTTPS in production
3. **CSP Headers**: Configure Content Security Policy
4. **Row Level Security**: Ensure Supabase RLS is enabled
5. **Domain Restrictions**: Configure allowed origins in Supabase

## Monitoring

### Error Tracking

Add error tracking service in `src/config/environment.ts`:

```typescript
if (environment.features.errorReporting) {
  // Initialize Sentry, LogRocket, etc.
}
```

### Analytics

Add analytics in production:

```typescript
if (environment.features.analytics) {
  // Initialize Google Analytics, Plausible, etc.
}
```

## Performance Optimization

1. **Bundle Analysis**: `npm run build && npx vite-bundle-analyzer dist`
2. **Image Optimization**: Use WebP format for images
3. **Caching**: Configure proper cache headers
4. **CDN**: Use CDN for static assets

## Troubleshooting

### Common Issues

1. **Supabase Connection**: Check environment variables and network access
2. **Build Failures**: Verify all dependencies are installed
3. **Authentication**: Ensure Supabase auth is configured correctly
4. **CORS Issues**: Check Supabase allowed origins

### Health Check

The app includes environment validation that will throw errors if configuration is invalid. Check browser console for configuration errors.