const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

async function processTailwind() {
  try {
    // Ensure the dist/styles directory exists
    const stylesDir = path.join(__dirname, 'dist', 'styles');
    if (!fs.existsSync(stylesDir)) {
      fs.mkdirSync(stylesDir, { recursive: true });
    }

    // Read the Tailwind CSS source file
    const tailwindSource = fs.readFileSync(
      path.join(__dirname, 'src', 'styles', 'tailwind.css'),
      'utf8'
    );

    // Process the CSS with PostCSS and Tailwind
    const result = await postcss([
      tailwindcss(require('./tailwind.config.js')),
      autoprefixer,
    ]).process(tailwindSource, {
      from: path.join(__dirname, 'src', 'styles', 'tailwind.css'),
      to: path.join(__dirname, 'dist', 'styles', 'convex-panel.css'),
    });

    // Write the processed CSS to the output file
    fs.writeFileSync(
      path.join(__dirname, 'dist', 'styles', 'convex-panel.css'),
      result.css
    );

    console.log('Tailwind CSS processed successfully!');
  } catch (error) {
    console.error('Error processing Tailwind CSS:', error);
    process.exit(1);
  }
}

processTailwind(); 