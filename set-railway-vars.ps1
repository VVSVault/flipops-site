# PowerShell script to set Railway environment variables

Write-Host "Setting Railway environment variables..." -ForegroundColor Green

$vars = @{
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" = "pk_test_dm9jYWwtY2F0ZmlzaC0yMi5jbGVyay5hY2NvdW50cy5kZXYk"
    "CLERK_SECRET_KEY" = "sk_test_tDBLuqFTTXDPIdYk9sE6FjwJqMHarqAD2ZHmEn9w3i"
    "NEXT_PUBLIC_CLERK_SIGN_IN_URL" = "/sign-in"
    "NEXT_PUBLIC_CLERK_SIGN_UP_URL" = "/sign-up"
    "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL" = "/app"
    "NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL" = "/app"
    "FLIPOPS_API_KEY" = "fo_live_10177805c8d743e1a6e1860515dc2b3f"
    "FO_API_KEY" = "fo_live_10177805c8d743e1a6e1860515dc2b3f"
    "FO_WEBHOOK_SECRET" = "7d82e2b8945c43959699bc3a3c1467bdd66954d25d6f41eb"
    "NEXT_PUBLIC_ENABLE_DATASOURCE_PANELS" = "1"
    "NODE_ENV" = "production"
    "PORT" = "3000"
}

# Build the command with all --set flags
$setFlags = @()
foreach ($key in $vars.Keys) {
    $setFlags += "--set"
    $setFlags += "$key=$($vars[$key])"
}

# Execute the command
$command = "railway variables " + ($setFlags -join " ") + " --service flipops-api --environment production"
Write-Host "Executing: $command" -ForegroundColor Yellow
Invoke-Expression $command

Write-Host "Environment variables set successfully!" -ForegroundColor Green