const fs = require('fs');
const path = require('path');

// Create destination directory if it doesn't exist
const destDir = path.join(__dirname, 'dist');
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Function to copy a directory recursively
function copyDir(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  // Get all files and directories in the source directory
  const entries = fs.readdirSync(src);
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    
    const stat = fs.statSync(srcPath);
    
    if (stat.isDirectory()) {
      // Recursively copy subdirectories
      copyDir(srcPath, destPath);
    } else {
      // Copy files
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Source and destination paths
const srcDir = path.join(__dirname, 'src');
const distDir = path.join(__dirname, 'dist');

// Check if source directory exists
if (!fs.existsSync(srcDir)) {
  console.error(`Error: Source directory '${srcDir}' does not exist.`);
  process.exit(1);
}

// Copy the source directory to the destination
copyDir(srcDir, distDir);

console.log('Source files copied successfully!'); 