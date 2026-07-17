/**
 * HausPort AI — Settings Module
 * Manages the settings modal: API keys, theme, animations, and data wipe.
 */

import { loadSettings, saveSettings, clearAllData } from './memory.js';

const $ = (sel) => document.querySelector(sel);

/* ------------------------------------------------------------------
   OPEN / CLOSE
   ------------------------------------------------------------------ */

export function openSettings() {
  const modal = $('#settingsModal');
  if (!modal) return;
  populateFields();
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

export function closeSettings() {
  const modal = $('#settingsModal');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

/* ------------------------------------------------------------------
   POPULATE / SAVE
   ------------------------------------------------------------------ */

function populateFields() {
  const s = loadSettings();
  const orKey = $('#openrouterKey');
  const cseKey = $('#googleCseKey');
  const cseId = $('#googleCseId');
  const darkToggle = $('#darkModeToggle');
  const animToggle = $('#animationsToggle');

  if (orKey) orKey.value = s.apiKeys?.openrouter || '';
  if (cseKey) cseKey.value = s.apiKeys?.googleCse || '';
  if (cseId) cseId.value = s.apiKeys?.googleCseId || '';
  if (darkToggle) darkToggle.checked = s.theme !== 'light';
  if (animToggle) animToggle.checked = s.animations !== false;
}

export function persistSettings() {
  const orKey = $('#openrouterKey');
  const cseKey = $('#googleCseKey');
  const cseId = $('#googleCseId');
  const darkToggle = $('#darkModeToggle');
  const animToggle = $('#animationsToggle');

  const s = {
    apiKeys: {
      openrouter: orKey?.value.trim() || '',
      googleCse: cseKey?.value.trim() || '',
      googleCseId: cseId?.value.trim() || '',
    },
    theme: darkToggle?.checked ? 'dark' : 'light',
    animations: animToggle?.checked ?? true,
  };

  saveSettings(s);
  closeSettings();
  return s;
}

/* ------------------------------------------------------------------
   API KEY VALIDATION (basic format check)
   ------------------------------------------------------------------ */

export function validateApiKey(key, type) {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  switch (type) {
    case 'openrouter':
      return trimmed.startsWith('sk-or-') && trimmed.length > 20;
    case 'googleCse':
      return trimmed.startsWith('AIza') && trimmed.length > 20;
    case 'googleCseId':
      return trimmed.length > 5;
    default:
      return trimmed.length > 0;
  }
}

/* ------------------------------------------------------------------
   INITIALISE LISTENERS
   ------------------------------------------------------------------ */

export function initSettings() {
  // Open / close buttons
  $('#settingsBtn')?.addEventListener('click', openSettings);
  $('#settingsCloseBtn')?.addEventListener('click', closeSettings);
  $('#settingsCancelBtn')?.addEventListener('click', closeSettings);
  $('#settingsSaveBtn')?.addEventListener('click', persistSettings);

  // Click overlay to close
  const modal = $('#settingsModal');
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeSettings();
  });

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('active')) {
      closeSettings();
    }
  });

  // Toggle visibility on password fields
  document.querySelectorAll('.toggle-visibility-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      // swap icon opacity to indicate state
      btn.style.opacity = isPassword ? '1' : '0.5';
    });
  });

  // Clear all data
  $('#clearAllDataBtn')?.addEventListener('click', () => {
    if (confirm('Tüm sohbet geçmişi ve ayarlar silinecek. Emin misiniz?')) {
      clearAllData();
      window.location.reload();
    }
  });

  // Populate on init
  populateFields();
}
