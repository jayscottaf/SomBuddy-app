#!/usr/bin/env node

// This is a special script to help Replit deployments
// It creates the necessary configuration files during deployment

import fs from 'fs';
import path from 'path';

// Check if we're running in a Replit environment
const isReplit = process.env.REPL_ID || process.env.REPL_SLUG;

if (isReplit) {
  console.log('Detected Replit environment, setting up deployment configuration...');
  
  // Create or update .replit file with deployment section
  try {
    const replitPath = './.replit';
    let content = '';
    
    if (fs.existsSync(replitPath)) {
      content = fs.readFileSync(replitPath, 'utf8');
      
      // Check if it already has deployment section
      if (!content.includes('[deployment]')) {
        content += `\n\n[deployment]
run = "node dist/index.js"
build = ["npm install", "npm run build"]
deploymentTarget = "cloudrun"
ignorePorts = false\n`;
      }
    } else {
      content = `modules = ["nodejs-20"]
run = "npm run dev"

[[ports]]
localPort = 5000
externalPort = 80

[deployment]
run = "node dist/index.js"
build = ["npm install", "npm run build"]
deploymentTarget = "cloudrun"
ignorePorts = false\n`;
    }
    
    // Write the updated content
    fs.writeFileSync(replitPath, content);
    console.log('Updated .replit file with deployment configuration');
  } catch (error) {
    console.error('Error updating .replit file:', error.message);
  }
}

console.log('Deployment helper completed');