/**
 * HausPort AI — File Handler Module
 * XLSX upload (drag-drop + button), validation, progress, and download.
 */

const ALLOWED_EXTENSIONS = ['.xlsx', '.xls'];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

/* ------------------------------------------------------------------
   UPLOAD
   ------------------------------------------------------------------ */

/**
 * Validate and upload a file to /api/upload.
 * @param {File} file
 * @param {Function} onProgress — callback(percent: number)
 * @returns {Promise<Object>} parsed data from the server
 */
export async function handleFileUpload(file, onProgress) {
  // Validate extension
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error('Geçersiz dosya türü. Sadece .xlsx ve .xls dosyaları desteklenir.');
  }

  // Validate size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Dosya çok büyük. Maksimum dosya boyutu 25 MB.');
  }

  const formData = new FormData();
  formData.append('file', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          resolve({ success: true, raw: xhr.responseText });
        }
      } else {
        reject(new Error(`Yükleme başarısız: ${xhr.status} ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Ağ hatası oluştu.')));
    xhr.addEventListener('abort', () => reject(new Error('Yükleme iptal edildi.')));

    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  });
}

/* ------------------------------------------------------------------
   DOWNLOAD
   ------------------------------------------------------------------ */

/**
 * Request the backend to build an XLSX from data and trigger browser download.
 * Falls back to client-side generation via SheetJS if backend is unavailable.
 * @param {Array<Object>} data — array of row objects
 * @param {string} filename
 */
export async function downloadXLSX(data, filename = 'pazarpusulasi_export.xlsx') {
  try {
    const res = await fetch('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, filename }),
    });

    if (res.ok) {
      const blob = await res.blob();
      triggerDownload(blob, filename);
      return;
    }
  } catch {
    // Backend not available – fall through to client-side generation
  }

  // Client-side fallback with SheetJS
  if (typeof XLSX !== 'undefined') {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Veriler');
    XLSX.writeFile(wb, filename);
  } else {
    throw new Error('Excel indirme şu anda kullanılamıyor.');
  }
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

/* ------------------------------------------------------------------
   DRAG & DROP SETUP
   ------------------------------------------------------------------ */

/**
 * Initialise drag-and-drop on the chat main area.
 * @param {Function} onFile — callback(file: File)
 */
export function initDragAndDrop(onFile) {
  const chatMain = document.getElementById('chatMain');
  const dropZone = document.getElementById('fileDropZone');
  if (!chatMain || !dropZone) return;

  let dragCounter = 0;

  chatMain.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    dropZone.classList.add('active');
  });

  chatMain.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      dropZone.classList.remove('active');
    }
  });

  chatMain.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  chatMain.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    dropZone.classList.remove('active');

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      onFile(files[0]);
    }
  });
}

/* ------------------------------------------------------------------
   UPLOAD PROGRESS UI
   ------------------------------------------------------------------ */

/**
 * Create and insert an upload progress element into the messages container.
 * @param {string} fileName
 * @returns {{ element: HTMLElement, update(percent: number): void, complete(): void, error(msg: string): void }}
 */
export function createUploadProgressUI(fileName) {
  const container = document.getElementById('messagesContainer');
  if (!container) return null;

  const el = document.createElement('div');
  el.className = 'upload-progress';
  el.innerHTML = `
    <div class="upload-file-icon">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      </svg>
    </div>
    <div style="flex:1;min-width:0">
      <div class="upload-progress-text" style="margin-bottom:4px;font-weight:500;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(fileName)}</div>
      <div class="upload-progress-bar-track">
        <div class="upload-progress-bar" style="width:0%"></div>
      </div>
    </div>
    <div class="upload-progress-text upload-percent">0%</div>
  `;

  container.appendChild(el);
  container.scrollTop = container.scrollHeight;

  const bar = el.querySelector('.upload-progress-bar');
  const pct = el.querySelector('.upload-percent');

  return {
    element: el,
    update(percent) {
      bar.style.width = percent + '%';
      pct.textContent = percent + '%';
    },
    complete() {
      pct.textContent = '✓';
      pct.style.color = 'var(--accent-emerald)';
      bar.style.width = '100%';
    },
    error(msg) {
      pct.textContent = '✗';
      pct.style.color = 'var(--accent-red)';
      el.style.borderColor = 'rgba(239,68,68,0.3)';
    },
  };
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
