/**
 * HausPort AI — Memory Module
 * localStorage-based persistence for chats, user profiles, and settings.
 */

function migrateKey(oldKey, newKey) {
  try {
    const val = localStorage.getItem(oldKey);
    if (val && !localStorage.getItem(newKey)) {
      localStorage.setItem(newKey, val);
      localStorage.removeItem(oldKey);
    }
  } catch (e) {}
}

// Migrate old HausPort data if present
migrateKey('hausport_chats', 'pazarpusulasi_chats');
migrateKey('hausport_active_chat', 'pazarpusulasi_active_chat');
migrateKey('hausport_user_profile', 'pazarpusulasi_user_profile');
migrateKey('hausport_settings', 'pazarpusulasi_settings');

const STORAGE_KEYS = {
  CHATS: 'pazarpusulasi_chats',
  ACTIVE_CHAT: 'pazarpusulasi_active_chat',
  PROFILE: 'pazarpusulasi_user_profile',
  SETTINGS: 'pazarpusulasi_settings',
};

const MAX_CHATS = 50;

/* ------------------------------------------------------------------
   CHAT MANAGEMENT
   ------------------------------------------------------------------ */

/**
 * Generate a unique chat id.
 */
export function generateChatId() {
  return 'chat_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

/**
 * Derive a short title from the first user message.
 * @param {string} firstMessage
 * @returns {string}
 */
export function generateChatTitle(firstMessage) {
  if (!firstMessage) return 'Yeni Sohbet';
  const cleaned = firstMessage.replace(/\n/g, ' ').trim();
  return cleaned.length > 45 ? cleaned.slice(0, 45) + '…' : cleaned;
}

/**
 * Get all chats as an array, sorted by updatedAt desc.
 * @returns {Array}
 */
export function listChats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHATS);
    const chats = raw ? JSON.parse(raw) : [];
    return chats.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } catch {
    return [];
  }
}

/**
 * Load a single chat by id.
 * @param {string} chatId
 * @returns {Object|null}
 */
export function loadChat(chatId) {
  const chats = listChats();
  return chats.find((c) => c.id === chatId) || null;
}

/**
 * Save (create or update) a chat.
 * @param {string} chatId
 * @param {Array} messages
 * @param {string} [title]
 * @returns {Object} the saved chat object
 */
export function saveChat(chatId, messages, title) {
  let chats = listChats();
  const now = Date.now();
  const existing = chats.find((c) => c.id === chatId);

  if (existing) {
    existing.messages = messages;
    existing.updatedAt = now;
    if (title) existing.title = title;
    // If no title yet and there's a first user message, auto-title
    if (!existing.title || existing.title === 'Yeni Sohbet') {
      const firstUserMsg = messages.find((m) => m.role === 'user');
      if (firstUserMsg) {
        existing.title = generateChatTitle(firstUserMsg.content);
      }
    }
  } else {
    const firstUserMsg = messages.find((m) => m.role === 'user');
    const chat = {
      id: chatId,
      title: title || generateChatTitle(firstUserMsg?.content) || 'Yeni Sohbet',
      messages,
      createdAt: now,
      updatedAt: now,
    };
    chats.unshift(chat);
  }

  // Enforce max limit
  if (chats.length > MAX_CHATS) {
    chats = chats.slice(0, MAX_CHATS);
  }

  try {
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
  } catch {
    // localStorage might be full; drop oldest chats
    chats = chats.slice(0, Math.floor(MAX_CHATS / 2));
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
  }

  return chats.find((c) => c.id === chatId);
}

/**
 * Delete a chat by id.
 * @param {string} chatId
 */
export function deleteChat(chatId) {
  let chats = listChats();
  chats = chats.filter((c) => c.id !== chatId);
  localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
}

/**
 * Get / set the active chat id.
 */
export function getActiveChatId() {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_CHAT) || null;
}

export function setActiveChatId(chatId) {
  if (chatId) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CHAT, chatId);
  } else {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_CHAT);
  }
}

/* ------------------------------------------------------------------
   USER PROFILE
   ------------------------------------------------------------------ */

/**
 * Save user profile data.
 * @param {Object} profile — { name, city, preferences[], favoriteStores[] }
 */
export function saveUserProfile(profile) {
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
}

/**
 * Load user profile data.
 * @returns {Object}
 */
export function loadUserProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return raw
      ? JSON.parse(raw)
      : { name: '', city: '', preferences: [], favoriteStores: [] };
  } catch {
    return { name: '', city: '', preferences: [], favoriteStores: [] };
  }
}

/* ------------------------------------------------------------------
   SETTINGS
   ------------------------------------------------------------------ */

const DEFAULT_SETTINGS = {
  apiKeys: {
    openrouter: '',
    googleCse: '',
    googleCseId: '',
  },
  theme: 'dark',
  animations: true,
};

/**
 * Save application settings.
 * @param {Object} settings
 */
export function saveSettings(settings) {
  const merged = { ...DEFAULT_SETTINGS, ...settings };
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
}

/**
 * Load application settings.
 * @returns {Object}
 */
export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/* ------------------------------------------------------------------
   CLEAR ALL
   ------------------------------------------------------------------ */

/**
 * Wipe all HausPort data from localStorage.
 */
export function clearAllData() {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}
