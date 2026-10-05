import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = __dirname;
const srcDir = path.join(rootDir, 'src');

console.log('==================================================');
console.log('STARTING AUTOMATED FRONTEND VERIFICATION SUITE');
console.log('==================================================');

let failedTests = 0;
let passedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${message}`);
    failedTests++;
  }
}

// -------------------------------------------------------------
// 1. SECURITY & CODE INTEGRITY AUDIT
// -------------------------------------------------------------
console.log('\n--- 1. Security & Code Integrity Checks ---');

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const allSrcFiles = getAllFiles(srcDir);

let hasDangerouslySetInnerHTML = false;
let hasQdrant = false;
let hasHardcodedApiKey = false;
let storesPasswordInStorage = false;

for (const filePath of allSrcFiles) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relPath = path.relative(rootDir, filePath);

  if (content.includes('dangerouslySetInnerHTML')) {
    console.error(`Found dangerouslySetInnerHTML in ${relPath}`);
    hasDangerouslySetInnerHTML = true;
  }
  if (content.toLowerCase().includes('qdrant')) {
    console.error(`Found Qdrant reference in ${relPath}`);
    hasQdrant = true;
  }
  if (/sk-[a-zA-Z0-9]{20,}/.test(content) || /api_key\s*=\s*['"][^'"]+['"]/.test(content)) {
    console.error(`Found potential hardcoded API key in ${relPath}`);
    hasHardcodedApiKey = true;
  }
  if (/localStorage\.setItem\([^)]*password/i.test(content)) {
    console.error(`Found potential password storage in ${relPath}`);
    storesPasswordInStorage = true;
  }
}

assert(!hasDangerouslySetInnerHTML, 'No dangerouslySetInnerHTML used in frontend source');
assert(!hasQdrant, 'Zero Qdrant references or direct connections in frontend');
assert(!hasHardcodedApiKey, 'No hardcoded private API keys in frontend code');
assert(!storesPasswordInStorage, 'User raw password is never stored in browser storage');

// -------------------------------------------------------------
// 2. CLIENT-SIDE VALIDATORS VERIFICATION
// -------------------------------------------------------------
console.log('\n--- 2. Client-side Validators ---');
import { validateUploadFile, validateLoginInput } from './src/utils/validators.js';

// Test PDF validation
const mockPdf = { name: 'test.pdf', size: 1024 * 1024, type: 'application/pdf' };
const pdfRes = validateUploadFile(mockPdf);
assert(pdfRes.isValid === true, 'Accepts valid PDF document');

// Test DOCX validation
const mockDocx = { name: 'syllabus.docx', size: 2 * 1024 * 1024, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
const docxRes = validateUploadFile(mockDocx);
assert(docxRes.isValid === true, 'Accepts valid DOCX document');

// Test TXT validation
const mockTxt = { name: 'notes.txt', size: 500, type: 'text/plain' };
const txtRes = validateUploadFile(mockTxt);
assert(txtRes.isValid === true, 'Accepts valid TXT document');

// Test Disallowed File Type
const mockExe = { name: 'malware.exe', size: 1024, type: 'application/x-msdownload' };
const exeRes = validateUploadFile(mockExe);
assert(exeRes.isValid === false, 'Rejects unauthorized file types (.exe)');

// Test Oversized File (>25MB)
const mockBig = { name: 'huge.pdf', size: 30 * 1024 * 1024, type: 'application/pdf' };
const bigRes = validateUploadFile(mockBig);
assert(bigRes.isValid === false, 'Rejects files exceeding size limit (>25MB)');

// Test Empty File (0 bytes)
const mockEmpty = { name: 'empty.pdf', size: 0, type: 'application/pdf' };
const emptyRes = validateUploadFile(mockEmpty);
assert(emptyRes.isValid === false, 'Rejects empty 0-byte files');

// Test Login validation
assert(validateLoginInput('', '').isValid === false, 'Login rejects empty email and password');
assert(validateLoginInput('admin@college.edu', '').isValid === false, 'Login rejects empty password');
assert(validateLoginInput('admin@college.edu', 'secret123').isValid === true, 'Login accepts valid inputs');

// -------------------------------------------------------------
// 3. HUMAN-READABLE DATE FORMATTING
// -------------------------------------------------------------
console.log('\n--- 3. Date & Formatters Utility ---');
import { formatHumanDate, formatDuration } from './src/utils/date.js';
import { formatBytes, normalizeFileType } from './src/utils/formatters.js';

const today = new Date().toISOString();
assert(formatHumanDate(today).startsWith('Today,'), 'Formats today date as "Today, HH:MM AM/PM"');
assert(formatHumanDate(null) === '—', 'Gracefully handles null date inputs');
assert(formatBytes(1048576) === '1 MB', 'Formats bytes to MB correctly');
assert(formatBytes(2048) === '2 KB', 'Formats bytes to KB correctly');
assert(normalizeFileType('test.pdf') === 'PDF', 'Normalizes file type extension');
assert(formatDuration(45000) === '45.0s', 'Formats seconds duration');
assert(formatDuration(90000) === '1m 30s', 'Formats minutes and seconds duration');

// -------------------------------------------------------------
// 4. PRODUCTION BUILD ARTIFACTS VERIFICATION
// -------------------------------------------------------------
console.log('\n--- 4. Build Artifacts Verification ---');
const distDir = path.join(rootDir, 'dist');
assert(fs.existsSync(path.join(distDir, 'index.html')), 'Production dist/index.html generated');
assert(fs.existsSync(path.join(distDir, 'assets')), 'Production dist/assets generated');

// -------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------
console.log('\n==================================================');
console.log(`TOTAL PASSED: ${passedTests} | TOTAL FAILED: ${failedTests}`);
console.log('==================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
