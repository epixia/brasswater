#!/bin/bash
# Build and deploy to document root
# Restores source index.html for Vite, builds, then copies dist output

# Save source index.html
cp index.html index.html.src 2>/dev/null

# Restore source version if it was overwritten by a previous build
if ! grep -q 'src="/src/main.jsx"' index.html; then
  cat > index.html <<'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>brasswaterapp</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF
fi

# Build
npx vite build || exit 1

# Deploy dist to root
rm -rf assets
cp -r dist/assets .
cp -r dist/logo .
cp dist/favicon.svg .
cp dist/icons.svg .
cp dist/index.html .

echo "Deploy complete!"
