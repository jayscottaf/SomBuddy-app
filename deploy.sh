#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== SomBuddy Production Deployment Script ===${NC}"

echo -e "\n${YELLOW}Step 1: Cleaning previous build${NC}"
rm -rf ./dist

echo -e "\n${YELLOW}Step 2: Building client${NC}"
npx vite build --outDir dist/public

echo -e "\n${YELLOW}Step 3: Building server${NC}"
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo -e "\n${YELLOW}Step 4: Final configuration${NC}"

# Create a basic index.html file as fallback for the server to serve if it doesn't exist
if [ ! -f "./dist/public/index.html" ]; then
  echo -e "${YELLOW}Warning: index.html not found, creating a placeholder${NC}"
  
  cat > ./dist/public/index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SomBuddy</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/assets/index.js"></script>
</body>
</html>
EOL
fi

echo -e "\n${GREEN}Build complete! 🎉${NC}"
echo -e "\nRun the following command to start the production server:\n${YELLOW}node dist/index.js${NC}\n"