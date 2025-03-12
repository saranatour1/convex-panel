const fs = require('fs');
const path = require('path');

// Create src directory if it doesn't exist
if (!fs.existsSync('src')) {
  fs.mkdirSync('src');
}

// Function to copy a directory recursively
function copyDir(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Get all files and directories in the source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy subdirectories
      copyDir(srcPath, destPath);
    } else {
      // Read the file content
      let content = fs.readFileSync(srcPath, 'utf8');
      
      // Remove "use client" directive if present at the beginning of the file
      if (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx')) {
        content = content.replace(/^"use client";(\r?\n|\r)/, '');
      }
      
      // Write the modified content to the destination file
      fs.writeFileSync(destPath, content);
      console.log(`Copied: ${srcPath} -> ${destPath}`);
    }
  }
}

// Copy the source files
copyDir('convex-panel/src', 'src');

console.log('Source files copied successfully!'); 