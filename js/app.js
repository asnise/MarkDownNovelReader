// =============================================================
// Application Entry Point & UI Control Module
// =============================================================

// DOM Elements Registry
const elements = {
  html: document.documentElement,
  body: document.body,
  progressBar: document.getElementById('progress-bar'),
  menuBtn: document.getElementById('menu-btn'),
  themeBtn: document.getElementById('theme-btn'),
  fontBtn: document.getElementById('font-btn'),
  sizeDecBtn: document.getElementById('size-dec-btn'),
  sizeIncBtn: document.getElementById('size-inc-btn'),
  indentBtn: document.getElementById('indent-btn'),
  alignBtn: document.getElementById('align-btn'),
  sidebar: document.getElementById('sidebar'),
  closeSidebarBtn: document.getElementById('close-sidebar-btn'),
  overlay: document.getElementById('overlay'),
  chapterListUl: document.getElementById('chapter-list-ul'),
  readerContent: document.getElementById('reader-content'),
  headerTitle: document.getElementById('header-title'),
  prevBtn: document.getElementById('prev-chapter-btn'),
  nextBtn: document.getElementById('next-chapter-btn'),
  skeleton: document.getElementById('skeleton-loader')?.cloneNode(true)
};


// Initialize Settings from LocalStorage
function initSettings() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  STATE.theme = savedTheme;
  elements.html.setAttribute('data-theme', savedTheme);

  const savedFont = localStorage.getItem('font') || 'serif';
  STATE.font = savedFont;
  if (savedFont === 'sans') {
    elements.body.classList.add('use-sans');
  } else {
    elements.body.classList.remove('use-sans');
  }

  const savedFontSize = parseInt(localStorage.getItem('fontSize')) || 18;
  STATE.fontSize = savedFontSize;
  elements.body.style.setProperty('--font-size-base', `${savedFontSize}px`);

  const savedAlign = localStorage.getItem('align') || 'justify';
  STATE.align = savedAlign;
  if (savedAlign === 'left') {
    elements.body.classList.add('align-left');
  } else {
    elements.body.classList.remove('align-left');
  }

  const savedIndent = localStorage.getItem('indent') !== 'false';
  STATE.indent = savedIndent;
  if (savedIndent) {
    elements.body.classList.add('indent-enabled');
  } else {
    elements.body.classList.remove('indent-enabled');
  }

  const savedIndex = parseInt(localStorage.getItem('chapterIndex')) || 0;
  STATE.currentChapterIndex = savedIndex;
}

// Toggle Theme (Light / Dark)
function toggleTheme() {
  const newTheme = STATE.theme === 'light' ? 'dark' : 'light';
  STATE.theme = newTheme;
  elements.html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  renderMermaidDiagrams();
}

// Toggle Font (Serif / Sans)
function toggleFont() {
  const newFont = STATE.font === 'serif' ? 'sans' : 'serif';
  STATE.font = newFont;
  if (newFont === 'sans') {
    elements.body.classList.add('use-sans');
  } else {
    elements.body.classList.remove('use-sans');
  }
  localStorage.setItem('font', newFont);
}

// Font Size Adjustment
function changeFontSize(direction) {
  let newSize = STATE.fontSize + direction;
  if (newSize < 14) newSize = 14;
  if (newSize > 28) newSize = 28;

  STATE.fontSize = newSize;
  elements.body.style.setProperty('--font-size-base', `${newSize}px`);
  localStorage.setItem('fontSize', newSize);
}

// Text Align Toggle
function toggleAlign() {
  const newAlign = STATE.align === 'justify' ? 'left' : 'justify';
  STATE.align = newAlign;
  if (newAlign === 'left') {
    elements.body.classList.add('align-left');
  } else {
    elements.body.classList.remove('align-left');
  }
  localStorage.setItem('align', newAlign);
}

// Paragraph Indent Toggle
function toggleIndent() {
  const newIndent = !STATE.indent;
  STATE.indent = newIndent;
  if (newIndent) {
    elements.body.classList.add('indent-enabled');
  } else {
    elements.body.classList.remove('indent-enabled');
  }
  localStorage.setItem('indent', newIndent);
}


// Lightbox Modal Functions
function openImageModal(src, caption) {
  const imageModal = document.getElementById('image-modal');
  const imageModalImg = document.getElementById('image-modal-img');
  const imageModalCaption = document.getElementById('image-modal-caption');

  if (!imageModal || !imageModalImg) return;
  imageModalImg.src = src;
  imageModalImg.classList.remove('zoomed');
  if (imageModalCaption) imageModalCaption.textContent = caption || '';
  imageModal.classList.add('open');
}

function closeImageModal() {
  const imageModal = document.getElementById('image-modal');
  const imageModalImg = document.getElementById('image-modal-img');
  if (imageModal) {
    imageModal.classList.remove('open');
    if (imageModalImg) imageModalImg.classList.remove('zoomed');
  }
}

// Global Event Handlers Setup
function setupGlobalEventListeners() {
  elements.menuBtn?.addEventListener('click', () => toggleSidebar(true));
  elements.closeSidebarBtn?.addEventListener('click', () => toggleSidebar(false));
  elements.overlay?.addEventListener('click', () => toggleSidebar(false));
  elements.themeBtn?.addEventListener('click', toggleTheme);
  elements.fontBtn?.addEventListener('click', toggleFont);
  elements.sizeDecBtn?.addEventListener('click', () => changeFontSize(-1));
  elements.sizeIncBtn?.addEventListener('click', () => changeFontSize(1));
  elements.alignBtn?.addEventListener('click', toggleAlign);
  elements.indentBtn?.addEventListener('click', toggleIndent);

  elements.prevBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    if (STATE.currentChapterIndex > 0) {
      selectChapter(STATE.currentChapterIndex - 1);
    }
  });

  elements.nextBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    if (STATE.currentChapterIndex < STATE.chapters.length - 1) {
      selectChapter(STATE.currentChapterIndex + 1);
    }
  });

  window.addEventListener('scroll', updateScrollProgress);

  // Lightbox modal buttons & click handlers
  const closeImageModalBtn = document.getElementById('close-image-modal-btn');
  const imageZoomBtn = document.getElementById('image-zoom-btn');
  const imageModal = document.getElementById('image-modal');
  const imageModalImg = document.getElementById('image-modal-img');

  closeImageModalBtn?.addEventListener('click', closeImageModal);

  imageModal?.addEventListener('click', (e) => {
    if (e.target === imageModal || e.target.classList.contains('image-modal-container')) {
      closeImageModal();
    }
  });

  imageModalImg?.addEventListener('click', (e) => {
    e.stopPropagation();
    imageModalImg.classList.toggle('zoomed');
  });

  imageZoomBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    imageModalImg?.classList.toggle('zoomed');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeImageModal();
    }
  });

  // Reader Content Click & Hover Delegation (Doc Links, Image Preview, Highlight Tooltips)
  elements.readerContent?.addEventListener('mouseover', (e) => {
    const highlight = e.target.closest('.comment-highlight');
    if (highlight) {
      const commentId = highlight.getAttribute('data-comment-id');
      const comment = commentsDb.find(c => c.id === commentId);
      if (comment) {
        showTooltip(highlight, comment);
      }
    }
  });

  elements.readerContent?.addEventListener('mouseout', (e) => {
    if (e.target.closest('.comment-highlight')) {
      hideTooltip();
    }
  });

  elements.readerContent?.addEventListener('click', (e) => {
    const docLink = e.target.closest('.internal-doc-link');
    if (docLink) {
      e.preventDefault();
      e.stopPropagation();
      const targetIdx = parseInt(docLink.getAttribute('data-chapter-index'), 10);
      if (!isNaN(targetIdx) && STATE.chapters[targetIdx]) {
        selectChapter(targetIdx);
      }
      return;
    }

    const imgLink = e.target.closest('[data-preview-img]');
    if (imgLink) {
      e.preventDefault();
      e.stopPropagation();
      const imgSrc = imgLink.getAttribute('data-preview-img');
      const caption = imgLink.getAttribute('alt') || imgLink.getAttribute('title') || '';
      openImageModal(imgSrc, caption);
      return;
    }

    const highlight = e.target.closest('.comment-highlight');
    if (highlight) {
      e.stopPropagation();
      const commentId = highlight.getAttribute('data-comment-id');
      const comment = commentsDb.find(c => c.id === commentId);
      if (comment) {
        showTooltip(highlight, comment);
        if ('ontouchstart' in window) {
          setTimeout(hideTooltip, 4000);
        }
      }
    } else {
      hideTooltip();
    }
  });

  document.addEventListener('click', () => {
    hideTooltip();
  });

  // Comments Sidebar Filters & Export Handlers
  const tabBtns = document.querySelectorAll('.comment-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.commentFilter = btn.dataset.filter;
      renderCommentSidebarList();
    });
  });

  const datePresetSelect = document.getElementById('comment-date-preset');
  const customDateGroup = document.getElementById('comment-custom-date-group');
  const dateStartInput = document.getElementById('comment-date-start');
  const dateEndInput = document.getElementById('comment-date-end');

  if (datePresetSelect) {
    datePresetSelect.addEventListener('change', (e) => {
      STATE.datePreset = e.target.value;
      if (customDateGroup) {
        customDateGroup.style.display = (e.target.value === 'custom') ? 'flex' : 'none';
      }
      renderCommentSidebarList();
    });
  }

  dateStartInput?.addEventListener('change', () => renderCommentSidebarList());
  dateEndInput?.addEventListener('change', () => renderCommentSidebarList());

  document.getElementById('comment-sidebar-btn')?.addEventListener('click', () => {
    const commentSidebar = document.getElementById('comment-sidebar');
    const isOpen = commentSidebar?.classList.contains('open');
    toggleCommentSidebar(!isOpen);
  });

  document.getElementById('close-comment-sidebar-btn')?.addEventListener('click', () => {
    toggleCommentSidebar(false);
  });

  document.getElementById('comment-delete-all-btn')?.addEventListener('click', () => {
    if (commentsDb.length === 0) return;
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบคอมเมนต์ทั้งหมด? (ลบแล้วกู้คืนไม่ได้)')) {
      commentsDb = [];
      saveCommentsToStorage();
      renderCommentSidebarList();
      document.querySelectorAll('.comment-highlight').forEach(span => {
        const parent = span.parentNode;
        while (span.firstChild) {
          parent.insertBefore(span.firstChild, span);
        }
        parent.removeChild(span);
        parent.normalize();
      });
      updateCommentBadge();
    }
  });

  document.getElementById('comment-export-btn')?.addEventListener('click', () => {
    const currentFile = STATE.chapters[STATE.currentChapterIndex]?.file;
    const filter = STATE.commentFilter || 'chapter';

    let targetComments = [];
    if (filter === 'chapter') {
      targetComments = commentsDb.filter(c => c.chapterFile === currentFile);
    } else if (filter === 'all') {
      targetComments = [...commentsDb];
    } else if (filter === 'praise') {
      targetComments = commentsDb.filter(c => c.type === 'praise');
    } else if (filter === 'suggest') {
      targetComments = commentsDb.filter(c => c.type === 'suggest');
    } else if (filter === 'replace') {
      targetComments = commentsDb.filter(c => c.type === 'replace');
    }

    const commentsToExport = filterCommentsByDate(targetComments);

    if (commentsToExport.length === 0) {
      alert('ไม่พบความคิดเห็นในเงื่อนไขการกรอง/ช่วงวันที่ที่เลือก');
      return;
    }

    const preset = STATE.datePreset || 'filtered';
    const dateStr = new Date().toISOString().split('T')[0];
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(commentsToExport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `novel_comments_${preset}_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  });
}

// Application Initialization Routine
async function init() {
  initSettings();
  initMarkedParser();
  initComments();
  setupGlobalEventListeners();

  await loadChaptersList();

  if (STATE.chapters && STATE.chapters.length > 0) {
    if (STATE.currentChapterIndex < 0 || STATE.currentChapterIndex >= STATE.chapters.length) {
      STATE.currentChapterIndex = 0;
    }
    selectChapter(STATE.currentChapterIndex);
  }
}

// Start App when DOM Ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
