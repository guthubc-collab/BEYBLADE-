// Simple in-memory session store with optional TTL.
// NOTE: In-memory = not persistent and not shared across instances. Use Redis in production.
const SESSION_TTL_MS = parseInt(process.env.SESSION_TTL_MS || '900000'); // 15 min default

const store = new Map();

function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

function set(key, value) {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  store.set(key, { value, expiresAt });
  return value;
}

function del(key) {
  return store.delete(key);
}

module.exports = { get, set, del };