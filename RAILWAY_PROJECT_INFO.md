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

## Status Update
- ✅ Railway CLI linked to correct project (beautiful-enjoyment)
- ✅ All 6 Clerk environment variables configured correctly
- ✅ GitHub auto-deployment triggered (commit d3cf523)
- ⏳ Waiting for GitHub-based build to complete
- 🔍 Next: Verify environment variables are injected during build

## Critical Learning
**`railway up` does NOT inject Railway environment variables during build!**
- `railway up` builds locally and uploads the artifact
- Environment variables are only available during **GitHub-triggered deployments**
- Always use GitHub push to trigger deployments, not `railway up`
- Use `/api/debug/env` endpoint to verify environment variable injection
