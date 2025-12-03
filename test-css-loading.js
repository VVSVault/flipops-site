#!/usr/bin/env node

/**
 * CSS Loading Diagnostic Script for FlipOps Production
 * Tests CSS file accessibility and identifies exact failure points
 */

const https = require('https');
const http = require('http');

const PROD_URL = 'https://flipops-site-production-5414.up.railway.app';
const COLORS = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m'
};

function log(color, ...args) {
    console.log(color, ...args, COLORS.reset);
}

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const startTime = Date.now();

        protocol.get(url, (res) => {
            const loadTime = Date.now() - startTime;
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: data,
                    loadTime: loadTime
                });
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

async function runDiagnostics() {
    console.log(COLORS.cyan + '\n🔍 FlipOps CSS Loading Diagnostic Tool\n' + COLORS.reset);
    console.log(COLORS.gray + '═'.repeat(60) + COLORS.reset + '\n');

    try {
        // Step 1: Fetch main page
        log(COLORS.cyan, '📄 Step 1: Fetching main page HTML...');
        const pageResponse = await fetchUrl(PROD_URL);

        if (pageResponse.status !== 200) {
            log(COLORS.red, `❌ Page failed to load: HTTP ${pageResponse.status}`);
            return;
        }

        log(COLORS.green, `✅ Page loaded successfully (${pageResponse.loadTime}ms)`);
        console.log(COLORS.gray + '   Content-Length:', pageResponse.headers['content-length'] || pageResponse.body.length, COLORS.reset);

        // Step 2: Extract CSS file references
        log(COLORS.cyan, '\n📋 Step 2: Extracting CSS references from HTML...');
        const cssRegex = /<link[^>]+href=["']([^"']+\.css[^"']*)["'][^>]*>/gi;
        const matches = [...pageResponse.body.matchAll(cssRegex)];
        const cssFiles = matches.map(m => m[1]);

        if (cssFiles.length === 0) {
            log(COLORS.red, '❌ CRITICAL: No CSS files found in HTML!');
            log(COLORS.yellow, '\n🔍 Checking for inline styles or other CSS delivery methods...');

            // Check for inline styles
            const inlineStylesCount = (pageResponse.body.match(/<style[^>]*>/gi) || []).length;
            if (inlineStylesCount > 0) {
                log(COLORS.yellow, `⚠️  Found ${inlineStylesCount} inline <style> tag(s)`);
            }

            // Check for style attributes
            const styleAttrCount = (pageResponse.body.match(/style=["'][^"']+["']/gi) || []).length;
            if (styleAttrCount > 0) {
                log(COLORS.yellow, `⚠️  Found ${styleAttrCount} inline style attribute(s)`);
            }

            log(COLORS.yellow, '\n💡 Next.js might be inlining CSS or build failed to generate CSS files');
            log(COLORS.yellow, '💡 Check Railway build logs for CSS compilation errors');
            return;
        }

        log(COLORS.green, `✅ Found ${cssFiles.length} CSS file(s):`);
        cssFiles.forEach((file, i) => {
            console.log(COLORS.gray + `   ${i + 1}. ${file}` + COLORS.reset);
        });

        // Step 3: Test each CSS file
        log(COLORS.cyan, '\n🌐 Step 3: Testing CSS file accessibility...');

        let successCount = 0;
        let failureCount = 0;
        const failures = [];

        for (let i = 0; i < cssFiles.length; i++) {
            const cssPath = cssFiles[i];
            const cssUrl = cssPath.startsWith('http') ? cssPath : `${PROD_URL}${cssPath}`;

            try {
                const cssResponse = await fetchUrl(cssUrl);

                if (cssResponse.status === 200) {
                    successCount++;
                    const sizeKB = (cssResponse.body.length / 1024).toFixed(2);
                    log(COLORS.green, `   ✅ ${cssPath}`);
                    console.log(COLORS.gray + `      Status: ${cssResponse.status} | Size: ${sizeKB}KB | Time: ${cssResponse.loadTime}ms` + COLORS.reset);

                    // Check if content looks like CSS
                    if (!cssResponse.body.includes('{') && !cssResponse.body.includes('}')) {
                        log(COLORS.yellow, `      ⚠️  WARNING: Content doesn't look like CSS`);
                    }
                } else {
                    failureCount++;
                    failures.push({ path: cssPath, url: cssUrl, status: cssResponse.status });
                    log(COLORS.red, `   ❌ ${cssPath}`);
                    console.log(COLORS.gray + `      Status: ${cssResponse.status} | Time: ${cssResponse.loadTime}ms` + COLORS.reset);
                }
            } catch (error) {
                failureCount++;
                failures.push({ path: cssPath, url: cssUrl, error: error.message });
                log(COLORS.red, `   ❌ ${cssPath}`);
                console.log(COLORS.gray + `      Error: ${error.message}` + COLORS.reset);
            }
        }

        // Step 4: Analysis and recommendations
        console.log(COLORS.gray + '\n' + '═'.repeat(60) + COLORS.reset);
        log(COLORS.cyan, '\n📊 Summary:');
        log(COLORS.green, `   ✅ Successfully loaded: ${successCount}/${cssFiles.length}`);
        if (failureCount > 0) {
            log(COLORS.red, `   ❌ Failed to load: ${failureCount}/${cssFiles.length}`);
        }

        if (failures.length > 0) {
            log(COLORS.red, '\n🚨 CRITICAL ISSUES DETECTED:');
            failures.forEach((f, i) => {
                log(COLORS.red, `\n   ${i + 1}. ${f.path}`);
                console.log(COLORS.gray + `      Full URL: ${f.url}` + COLORS.reset);
                if (f.status) {
                    console.log(COLORS.gray + `      HTTP Status: ${f.status}` + COLORS.reset);
                }
                if (f.error) {
                    console.log(COLORS.gray + `      Error: ${f.error}` + COLORS.reset);
                }
            });

            log(COLORS.yellow, '\n💡 RECOMMENDATIONS:');

            if (failures.some(f => f.status === 404)) {
                log(COLORS.yellow, '   1. CSS files are NOT being copied to standalone directory');
                log(COLORS.yellow, '      → Check Railway build logs for "cp -r .next/static" command');
                log(COLORS.yellow, '      → Verify nixpacks.toml is being used (not ignored)');
            }

            if (failures.some(f => f.status === 403)) {
                log(COLORS.yellow, '   2. Permission issues with static file serving');
                log(COLORS.yellow, '      → Check Railway file permissions');
            }

            if (failures.some(f => f.status === 500 || f.status === 502)) {
                log(COLORS.yellow, '   3. Server error serving static files');
                log(COLORS.yellow, '      → Check Railway runtime logs');
                log(COLORS.yellow, '      → Verify standalone server is serving from correct directory');
            }

            log(COLORS.yellow, '\n   4. IMMEDIATE ACTION ITEMS:');
            log(COLORS.yellow, '      a) Run: railway logs -s flipops-site | grep "cp -r"');
            log(COLORS.yellow, '      b) Verify files exist: railway run -s flipops-site ls -la .next/standalone/.next/static');
            log(COLORS.yellow, '      c) Check server is serving from: .next/standalone directory');
        } else {
            log(COLORS.green, '\n✅ ALL CSS FILES LOADED SUCCESSFULLY!');
            log(COLORS.green, '   If styling still appears broken, check browser DevTools for:');
            log(COLORS.gray, '   • CORS errors');
            log(COLORS.gray, '   • Content Security Policy issues');
            log(COLORS.gray, '   • CSS specificity conflicts');
        }

    } catch (error) {
        log(COLORS.red, '\n❌ Fatal error:', error.message);
        console.error(error);
    }

    console.log(COLORS.gray + '\n' + '═'.repeat(60) + COLORS.reset + '\n');
}

// Run diagnostics
runDiagnostics();
