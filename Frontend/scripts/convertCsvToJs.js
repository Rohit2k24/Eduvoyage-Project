import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the CSV file
const csvPath = join(__dirname, '../src/assets/world-universities.csv');
const outputPath = join(__dirname, '../src/utils/universities.js');

const csvData = readFileSync(csvPath, 'utf8');

// Parse CSV and create object
const universities = {};

csvData.split('\n').forEach(line => {
  if (line) {
    const [countryCode, name, url] = line.split(',');
    if (!universities[countryCode]) {
      universities[countryCode] = [];
    }
    universities[countryCode].push({
      name: name.trim(),
      url: url.trim()
    });
  }
});

// Create JavaScript code
const jsContent = `
// This file is auto-generated from CSV data
export const universitiesData = ${JSON.stringify(universities, null, 2)};
`;

// Write to file
writeFileSync(outputPath, jsContent);
console.log('Universities data converted successfully!'); 