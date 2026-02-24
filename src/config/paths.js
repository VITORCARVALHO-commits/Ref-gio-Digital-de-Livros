const path = require('path');

const rootDir = path.join(__dirname, '..', '..');
const publicDir = path.join(rootDir, 'public');
const dataDir = path.join(rootDir, 'data');
const uploadDir = path.join(publicDir, 'uploads');

const livrosFile = path.join(dataDir, 'livros.json');
const usersFile = path.join(dataDir, 'users.json');
const activityFile = path.join(dataDir, 'activity.json');

module.exports = {
  rootDir,
  publicDir,
  dataDir,
  uploadDir,
  livrosFile,
  usersFile,
  activityFile
};
