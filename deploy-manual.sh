#!/bin/bash

# Manual GitHub Pages Deployment Script
# Run this script locally to deploy your app to GitHub Pages

echo "🚀 Starting manual GitHub Pages deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Build the project
echo "📦 Building project..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "✅ Build successful"

# Create or switch to gh-pages branch
echo "🌿 Setting up gh-pages branch..."
git checkout --orphan gh-pages 2>/dev/null || git checkout gh-pages

# Remove all files except .git
git rm -rf . 2>/dev/null || true

# Copy dist contents to root
cp -r dist/* .

# Add all files
git add .

# Commit
git commit -m "Deploy to GitHub Pages - $(date)"

# Push to gh-pages branch
echo "📤 Pushing to gh-pages branch..."
git push origin gh-pages --force

# Switch back to master
git checkout master

echo "✅ Manual deployment complete!"
echo "🌐 Your app will be available at: https://youssefhergal.github.io/-AIMove-Motion-Analysis-app/"
echo ""
echo "📋 Next steps:"
echo "1. Go to your repository Settings → Pages"
echo "2. Under 'Source', select 'Deploy from a branch'"
echo "3. Under 'Branch', select 'gh-pages' and '/ (root)'"
echo "4. Click 'Save'"
echo "5. Wait a few minutes for GitHub Pages to update"
