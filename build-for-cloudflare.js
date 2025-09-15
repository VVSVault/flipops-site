const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building Next.js app for Cloudflare Pages...');

// Build Next.js app
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Next.js build completed');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Check if we have a standalone build
const standaloneDir = path.join(__dirname, '.next', 'standalone');
const staticDir = path.join(__dirname, '.next', 'static');
const publicDir = path.join(__dirname, 'public');

if (fs.existsSync(standaloneDir)) {
  console.log('✅ Found standalone build');

  // Create output directory
  const outDir = path.join(__dirname, 'out');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
  }

  // Copy static files
  if (fs.existsSync(staticDir)) {
    const outStaticDir = path.join(outDir, '_next', 'static');
    fs.cpSync(staticDir, outStaticDir, { recursive: true });
    console.log('✅ Copied static files');
  }

  // Copy public files
  if (fs.existsSync(publicDir)) {
    fs.cpSync(publicDir, outDir, { recursive: true });
    console.log('✅ Copied public files');
  }

  console.log('✅ Build prepared for Cloudflare Pages');
} else {
  console.log('⚠️  No standalone build found, using standard .next directory');
}