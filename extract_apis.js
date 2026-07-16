const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('client/lib/api_legacy_temp.ts', 'utf8');

const modulesToExtract = [
  'locations', 'shifts', 'holidays', 'payroll', 'compensation', 
  'wallets', 'currency', 'notifications', 'scheduler', 'queue', 
  'performance', 'recruitment', 'assets', 'i18n', 'payouts', 
  'audit', 'emailTemplates', 'invoiceTemplates'
];

for (const modName of modulesToExtract) {
  // Regex to match the export block. It uses brace counting if needed, but since it's just object literals with a few methods, a basic regex might work.
  // Actually, a simpler approach is matching from `export const ${modName}Api = {` to the next `export const` or end of file.
  
  const startIndex = content.indexOf(`export const ${modName}Api = {`);
  if (startIndex === -1) {
    console.log(`Could not find ${modName}Api`);
    continue;
  }
  
  // Find the end of this block by finding the next `export const ` after this one
  let endIndex = content.indexOf('export const ', startIndex + 1);
  if (endIndex === -1) {
    endIndex = content.length;
  } else {
    // Backtrack to previous blank line or closing brace
    const block = content.slice(startIndex, endIndex);
    const lastBrace = block.lastIndexOf('};');
    if (lastBrace !== -1) {
      endIndex = startIndex + lastBrace + 2;
    }
  }

  const block = content.slice(startIndex, endIndex).trim();
  
  // Clean up directory name (e.g. emailTemplates -> email-templates)
  const dirName = modName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  const dirPath = path.join('client', 'features', dirName);
  
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // Ensure it has apiClient
  const fileContent = `import { apiClient, buildQuery } from '@/lib/api-client';\nimport * as types from '@/lib/types'; // Using generic types for now\n\n${block}\n`;
  
  fs.writeFileSync(path.join(dirPath, 'api.ts'), fileContent, 'utf8');
  console.log(`Extracted ${modName} to ${dirPath}/api.ts`);
}
