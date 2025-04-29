#!/bin/bash
if [ -f "/Users/kareemhassanein/Desktop/legal-case-tracker/legal-case-tracker/postcss.config.js" ]; then
  mv /Users/kareemhassanein/Desktop/legal-case-tracker/legal-case-tracker/postcss.config.js /Users/kareemhassanein/Desktop/legal-case-tracker/legal-case-tracker/postcss.config.js.bak
  echo "✅ Temporarily disabled parent PostCSS config"
else
  echo "⚠️ Parent PostCSS config not found"
fi
