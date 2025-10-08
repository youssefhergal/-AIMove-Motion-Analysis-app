#!/bin/bash

# Manual deployment script for GitHub Pages
# This script builds the project and pushes to gh-pages branch

echo "🚀 Starting GitHub Pages deployment..."

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

echo "✅ Deployment complete!"
echo "🌐 Your app will be available at: https://youssefhergal.github.io/-AIMove-Motion-Analysis-app/"
