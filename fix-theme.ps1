# PowerShell script to fix theme issues in all components

# Replace text-white with text-gray-900 dark:text-white
Get-ChildItem -Path "app/components" -Filter "*.tsx" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    
    # Fix headings
    $content = $content -replace '(<h[1-6][^>]*className="[^"]*)(text-white)([^"]*")', '$1text-gray-900 dark:text-white$3'
    $content = $content -replace '(<p[^>]*className="[^"]*)(text-white)([^"]*")', '$1text-gray-900 dark:text-white$3'
    
    # Fix muted text
    $content = $content -replace 'text-muted-foreground', 'text-gray-600 dark:text-gray-400'
    
    # Fix card backgrounds
    $content = $content -replace 'className="([^"]*\s)?bg-card(\s[^"]*)?', 'className="$1bg-white dark:bg-gray-800$2'
    $content = $content -replace 'className="([^"]*\s)?border-border(\s[^"]*)?', 'className="$1border-gray-200 dark:border-gray-700$2'
    
    Set-Content -Path $_.FullName -Value $content
}

Write-Host "Theme fixes applied to all components"