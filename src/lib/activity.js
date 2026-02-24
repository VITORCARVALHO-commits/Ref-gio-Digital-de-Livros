const { readJson, writeJson } = require('./storage');
const { parseToken } = require('./auth');
const { activityFile, usersFile } = require('../config/paths');

function registerActivity({ token, type, payload }) {
  const decoded = parseToken(token);
  if (!decoded?.id) return null;

  const users = readJson(usersFile, []);
  const user = users.find(u => u.id === decoded.id);

  const activity = {
    id: Date.now().toString(),
    userId: decoded.id,
    userName: user?.name || null,
    userEmail: user?.email || decoded.email || null,
    type,
    payload: payload || {},
    createdAt: new Date().toISOString()
  };

  const activities = readJson(activityFile, []);
  activities.push(activity);
  writeJson(activityFile, activities);

  return activity;
}

module.exports = {
  registerActivity
};
