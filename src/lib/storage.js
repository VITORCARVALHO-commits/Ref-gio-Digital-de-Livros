const fs = require('fs');

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;

  const raw = fs.readFileSync(filePath, 'utf8');
  if (!raw || !raw.trim()) return fallback;

  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

module.exports = {
  readJson,
  writeJson,
  ensureDir
};
