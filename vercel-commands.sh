#!/bin/bash
# Quick Vercel CLI commands for Nuclio staging setup
# Project ID: prj_u9ShzYLFKbqayCFHyp6PRwahmStt

PROJECT_ID="prj_u9ShzYLFKbqayCFHyp6PRwahmStt"

echo "Nuclio Staging - Vercel CLI Commands"
echo "====================================="
echo ""

# Pull environment variables
echo "To pull environment variables:"
echo "vercel env pull .env.local --project=$PROJECT_ID"
echo ""

# Link project
echo "To link this directory to Vercel project:"
echo "vercel link --project=$PROJECT_ID"
echo ""

# View project
echo "To view project details:"
echo "vercel inspect $PROJECT_ID"
echo ""

# Deploy
echo "To deploy:"
echo "vercel --prod --project=$PROJECT_ID"
echo ""

# List environment variables
echo "To list environment variables:"
echo "vercel env ls --project=$PROJECT_ID"
echo ""

# Add environment variable example
echo "To add an environment variable:"
echo "vercel env add DATABASE_URL production --project=$PROJECT_ID"
echo ""
