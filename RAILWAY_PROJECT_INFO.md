# Railway Project Information

## Correct Project
- **Project Name**: beautiful-enjoyment
- **Project ID**: ee1e9bf0-7dd7-4aa4-a59f-e8651734384b
- **Service**: flipops-site
- **Production URL**: https://flipops-site-production.up.railway.app
- **Railway Token**: 543b632d-9ec1-4a07-acd5-a0c7d2ae08e2

## Important Notes
- The Railway CLI was previously linked to the wrong project (`flipops-api`)
- Always verify you're working with the `beautiful-enjoyment` project
- Use `railway link` to connect to the correct project if needed

## Current Issues
1. Build succeeds (72 pages generated)
2. Clerk environment variables are set in Railway dashboard
3. BUT: `allEnvVars: []` shows NO `NEXT_PUBLIC_*` vars are being injected at build time
4. Result: Unstyled HTML, Clerk hooks fail, `/api/user/profile` returns 404

## Next Steps
- Link Railway CLI to correct project
- Force a clean rebuild with environment variables properly injected
- Verify Clerk keys are available in client-side bundle
