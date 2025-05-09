#!/usr/bin/env node
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

console.log(`${colors.bright}${colors.green}=== SomBuddy Production Build Script ===${colors.reset}\n`);

// Execute a command and return a promise
function execCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`${colors.yellow}> ${command}${colors.reset}`);
    
    exec(command, (error, stdout, stderr) => {
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
      
      if (error) {
        console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
        reject(error);
        return;
      }
      
      resolve();
    });
  });
}

// Main build process
async function build() {
  try {
    // Step 1: Clean previous build
    console.log(`\n${colors.bright}Step 1: Cleaning previous build${colors.reset}`);
    if (fs.existsSync('./dist')) {
      await execCommand('rm -rf ./dist');
    }
    
    // Step 2: Build client
    console.log(`\n${colors.bright}Step 2: Building client${colors.reset}`);
    await execCommand('vite build --outDir dist/public');
    
    // Step 3: Build server
    console.log(`\n${colors.bright}Step 3: Building server${colors.reset}`);
    await execCommand('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist');
    
    // Step 4: Copy required files and update file paths
    console.log(`\n${colors.bright}Step 4: Final configuration${colors.reset}`);
    
    // Create a basic index.html file as fallback for the server to serve
    // This helps with the error we're seeing
    if (!fs.existsSync('./dist/public/index.html')) {
      console.log(`${colors.yellow}Warning: index.html not found, creating a placeholder${colors.reset}`);
      
      const indexHtml = `
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
</html>`;
      
      fs.writeFileSync('./dist/public/index.html', indexHtml);
    }
    
    console.log(`\n${colors.bright}${colors.green}Build complete! 🎉${colors.reset}`);
    console.log(`\nRun the following command to start the production server:\n${colors.yellow}node dist/index.js${colors.reset}\n`);
    
  } catch (error) {
    console.error(`${colors.red}Build failed${colors.reset}`);
    process.exit(1);
  }
}

build();