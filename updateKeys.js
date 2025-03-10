const fs = require('fs');
const path = require('path');

// Function to convert snake_case to camelCase
const toCamelCase = (str) => str.replace(/_([a-z])/g, (match, p1) => p1.toUpperCase());

// Function to process files
const processFile = (filePath) => {
  let data = fs.readFileSync(filePath, 'utf8');

  // Regex to match object keys and their references, ignoring those that start with an underscore
  const objectKeyRegex = /(['"])(\w+_+\w+)\1\s*:/g;
  const referenceRegex = /\.([a-zA-Z_]+[a-zA-Z0-9_]*)/g;

  // Replace object keys
  data = data.replace(objectKeyRegex, (match, p1, p2) => {
    if (p2.startsWith('_')) {
      return match; // Ignore keys that start with an underscore
    }
    return `${p1}${toCamelCase(p2)}${p1}:`;
  });

  // Replace references
  data = data.replace(referenceRegex, (match, p1) => {
    if (p1.startsWith('_')) {
      return match; // Ignore references that start with an underscore
    }
    return `.${toCamelCase(p1)}`;
  });

  fs.writeFileSync(filePath, data, 'utf8');
};

// Function to recursively traverse directories
const traverseDirectory = (dir) => {
  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      traverseDirectory(filePath);
    } else if (filePath.endsWith('.js') || filePath.endsWith('.njk')) {
      processFile(filePath);
    }
  });
};

// Directories to process
const directories = ['./server', './client', './client/templates'];

directories.forEach(traverseDirectory);

console.log('Object keys and references updated to camelCase.');
