const fs = require('fs');
const path = require('path');

const mappings = {
  'ArrowLeft': 'ArrowLeft',
  'MessageCircle': 'ChatCircle',
  'AlertTriangle': 'Warning',
  'CheckCircle2': 'CheckCircle',
  'Loader2': 'CircleNotch',
  'XCircle': 'XCircle',
  'MessageSquare': 'ChatTeardropText',
  'Search': 'MagnifyingGlass',
  'FileText': 'FileText',
  'Activity': 'Activity',
  'ChevronDown': 'CaretDown',
  'Globe': 'Globe',
  'Fingerprint': 'Fingerprint',
  'Lock': 'LockKey',
  'Eye': 'Eye',
  'EyeOff': 'EyeSlash',
  'DatabaseZap': 'Lightning',
  'AlertCircle': 'WarningCircle',
  'Brain': 'Brain',
  'ShieldCheck': 'ShieldCheck',
  'Upload': 'Upload',
  'X': 'X',
  'LogOut': 'SignOut',
  'RefreshCw': 'ArrowsClockwise',
  'Trash2': 'Trash'
};

const mapLucideImports = (content) => {
  const importRegex = /import\s+\{([^}]+)\}\s+from\s+["']lucide-react["'];/g;
  let newContent = content;
  
  const matches = [...content.matchAll(importRegex)];
  
  for (const match of matches) {
    const importStr = match[1];
    const imports = importStr.split(',').map(i => i.trim()).filter(Boolean);
    
    let phosphorImports = [];
    let mappingsInFile = {};
    
    imports.forEach(imp => {
      let originalName = imp;
      let alias = null;
      if (imp.includes(' as ')) {
        const parts = imp.split(' as ');
        originalName = parts[0].trim();
        alias = parts[1].trim();
      }
      
      const mappedName = mappings[originalName] || originalName;
      if (alias) {
        phosphorImports.push(`${mappedName} as ${alias}`);
        mappingsInFile[alias] = mappedName;
      } else {
        phosphorImports.push(mappedName);
        mappingsInFile[originalName] = mappedName;
      }
    });
    
    // Replace the import statement
    const newImportStatement = `import { ${phosphorImports.join(', ')} } from "@phosphor-icons/react";`;
    newContent = newContent.replace(match[0], newImportStatement);
    
    // Replace JSX usages 
    Object.keys(mappingsInFile).forEach(lucideName => {
      const phosphorName = mappingsInFile[lucideName];
      if (lucideName !== phosphorName) {
         const tagRegex = new RegExp(`<${lucideName}(\\s|>|\\/)`, 'g');
         newContent = newContent.replace(tagRegex, `<${phosphorName}$1`);
      }
    });
  }
  
  return newContent;
};

const filePaths = [
  'src/pages/NotFound.tsx',
  'src/pages/Admin.tsx',
  'src/components/UsageStatsCard.tsx',
  'src/components/ui/accordion.tsx',
  'src/components/AdminAuth.tsx',
  'src/components/admin/AdminUploadCard.tsx',
  'src/components/admin/AdminPageHeader.tsx',
  'src/components/admin/AdminDocumentsCard.tsx',
  'src/components/FeaturesSection.tsx'
];

filePaths.forEach(relPath => {
  const fullPath = path.join('C:\\Users\\okidata\\clarainova02', relPath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const updated = mapLucideImports(content);
    if (content !== updated) {
      fs.writeFileSync(fullPath, updated);
      console.log(`Updated ${relPath}`);
    }
  }
});
