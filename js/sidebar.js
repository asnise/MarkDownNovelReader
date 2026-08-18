// =============================================================
// Sidebar & Chapter Navigation Module
// =============================================================

// Toggle Left Navigation Sidebar
function toggleSidebar(open) {
  if (open) {
    elements.sidebar.classList.add('open');
    elements.overlay.classList.add('open');
  } else {
    elements.sidebar.classList.remove('open');
    elements.overlay.classList.remove('open');
  }
}

// Load Chapters List (HTTP fetch + EMBEDDED_DATA fallback + FALLBACK_CHAPTERS array)
async function loadChaptersList() {
  try {
    const response = await fetch('data/chapters.json');
    if (!response.ok) throw new Error('CORS or file not found');
    STATE.chapters = await response.json();
  } catch (err) {
    console.warn('Could not fetch data/chapters.json, trying EMBEDDED_DATA / local fallback.', err);
    if (window.EMBEDDED_DATA && window.EMBEDDED_DATA['chapters.json']) {
      try {
        STATE.chapters = JSON.parse(window.EMBEDDED_DATA['chapters.json']);
      } catch (e) {
        STATE.chapters = FALLBACK_CHAPTERS;
      }
    } else {
      STATE.chapters = FALLBACK_CHAPTERS;
    }
  }
  renderChapterList();
}

// Render Chapters in Sidebar
function renderChapterList() {
  if (!elements.chapterListUl) return;
  elements.chapterListUl.innerHTML = '';

  STATE.chapters.forEach((chapter, index) => {
    const li = document.createElement('li');
    li.className = 'chapter-item';
    if (index === STATE.currentChapterIndex) {
      li.classList.add('active');
    }

    let cleanTitle = chapter.title.split('(')[0].trim();
    li.textContent = cleanTitle;
    li.addEventListener('click', () => {
      selectChapter(index);
      toggleSidebar(false);
    });
    elements.chapterListUl.appendChild(li);
  });
}

// Select and load chapter by index
function selectChapter(index) {
  if (index < 0 || index >= STATE.chapters.length) return;
  STATE.currentChapterIndex = index;
  localStorage.setItem('chapterIndex', index);

  if (elements.chapterListUl) {
    const items = elements.chapterListUl.querySelectorAll('.chapter-item');
    items.forEach((item, idx) => {
      if (idx === index) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  loadChapterContent(STATE.chapters[index]);
}

// Global Chapter Loader for Search Engine & Deep Linking
window.loadChapter = function (fileOrIndex) {
  if (typeof fileOrIndex === 'number') {
    selectChapter(fileOrIndex);
    return;
  }
  if (!STATE.chapters || !STATE.chapters.length) return;
  const index = STATE.chapters.findIndex(c => c.file === fileOrIndex || c.file.endsWith('/' + fileOrIndex) || fileOrIndex.endsWith('/' + c.file));
  if (index !== -1) {
    selectChapter(index);
  } else {
    const customChapter = { file: fileOrIndex, title: fileOrIndex.split('/').pop().replace('.md', '') };
    loadChapterContent(customChapter);
  }
};
window.selectChapter = selectChapter;

