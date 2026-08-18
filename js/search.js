/**
 * search.js
 * High-performance full-text search engine and deep linking for Dorea's Princess Journey.
 */

(function () {
  let searchIndex = [];
  let currentFilter = 'all';
  let selectedIndex = -1;

  let searchModal = null;
  let searchInput = null;
  let searchClearBtn = null;
  let searchCloseBtn = null;
  let searchResultsList = null;
  let searchInitialState = null;
  let searchCountAll = null;
  let filterChips = [];

  // 1. Load Search Index
  async function loadSearchIndex() {
    try {
      if (window.EMBEDDED_DATA && window.EMBEDDED_DATA['search_index.json']) {
        const raw = window.EMBEDDED_DATA['search_index.json'];
        searchIndex = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } else {
        const res = await fetch('data/search_index.json');
        if (res.ok) {
          searchIndex = await res.json();
        }
      }
      if (searchCountAll) {
        searchCountAll.textContent = searchIndex.length;
      }
    } catch (e) {
      console.warn('Could not load search_index.json:', e);
    }
  }

  // 2. Open / Close Modal
  function openSearchModal(initialQuery = '') {
    if (!searchModal) searchModal = document.getElementById('search-modal');
    if (!searchInput) searchInput = document.getElementById('search-input');
    if (!searchModal) return;

    searchModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    if (initialQuery) {
      searchInput.value = initialQuery;
      if (searchClearBtn) searchClearBtn.style.display = 'block';
      performSearch(initialQuery);
    } else {
      setTimeout(() => searchInput.focus(), 50);
    }
  }

  function closeSearchModal() {
    if (!searchModal) return;
    searchModal.style.display = 'none';
    document.body.style.overflow = '';
    selectedIndex = -1;
  }

  // 3. Highlight Text
  function highlightMatches(text, tokens) {
    if (!text || !tokens.length) return text || '';
    let escapedTokens = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    let regex = new RegExp(`(${escapedTokens.join('|')})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  // 4. Extract Relevant Snippet Around Match
  function extractSnippetWithMatch(content, tokens, fallbackSnippet) {
    if (!content || !tokens.length) return fallbackSnippet || '';
    const lowerContent = content.toLowerCase();
    let bestPos = -1;

    for (let t of tokens) {
      let pos = lowerContent.indexOf(t.toLowerCase());
      if (pos !== -1) {
        bestPos = pos;
        break;
      }
    }

    if (bestPos === -1) {
      return fallbackSnippet || content.substring(0, 160) + '...';
    }

    let start = Math.max(0, bestPos - 60);
    let end = Math.min(content.length, bestPos + 120);
    let snippet = content.substring(start, end);

    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';

    return snippet;
  }

  // 5. Core Search Logic
  let debounceTimer = null;
  function performSearch(query) {
    const q = (query || searchInput.value || '').trim();

    if (!q) {
      searchClearBtn.style.display = 'none';
      searchInitialState.style.display = 'block';
      searchResultsList.style.display = 'none';
      searchResultsList.innerHTML = '';
      return;
    }

    searchClearBtn.style.display = 'block';
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);

    let results = [];

    for (let item of searchIndex) {
      // Category filter check
      if (currentFilter !== 'all' && item.category !== currentFilter) {
        continue;
      }

      let titleLower = (item.title || '').toLowerCase();
      let keywordsLower = (item.keywords || '').toLowerCase();
      let contentLower = (item.content || '').toLowerCase();

      let score = 0;
      let allMatch = true;

      for (let token of tokens) {
        let tokenInTitle = titleLower.includes(token);
        let tokenInKeywords = keywordsLower.includes(token);
        let tokenInContent = contentLower.includes(token);

        if (tokenInTitle || tokenInKeywords || tokenInContent) {
          if (tokenInTitle) score += 50;
          if (tokenInKeywords) score += 25;
          if (tokenInContent) score += 10;
        } else {
          allMatch = false;
        }
      }

      if (allMatch && score > 0) {
        results.push({ item, score });
      }
    }

    // Sort by relevance score descending
    results.sort((a, b) => b.score - a.score);

    renderResults(results, tokens, q);
  }

  // 6. Render Search Results
  function renderResults(results, tokens, query) {
    searchInitialState.style.display = 'none';
    searchResultsList.style.display = 'block';
    searchResultsList.innerHTML = '';
    selectedIndex = -1;

    if (results.length === 0) {
      searchResultsList.innerHTML = `
        <li class="search-no-result">
          <p>ไม่พบผลการค้นหาสำหรับ "<strong>${escapeHtml(query)}</strong>"</p>
          <span style="font-size: 0.8rem; color: var(--text-muted);">ลองค้นหาด้วยคำอื่น เช่น โดเรีย, ATKD, ธาร์, รอยแยกมิติ หรือเลือกหมวดหมู่อื่น</span>
        </li>
      `;
      return;
    }

    results.slice(0, 30).forEach(({ item }, idx) => {
      const li = document.createElement('li');
      li.className = 'search-result-item';
      li.dataset.index = idx;

      const rawSnippet = extractSnippetWithMatch(item.content, tokens, item.snippet);
      const highlightedTitle = highlightMatches(escapeHtml(item.title), tokens);
      const highlightedSnippet = highlightMatches(escapeHtml(rawSnippet), tokens);

      let catBadgeClass = 'badge-' + (item.category || 'other').toLowerCase();
      let catLabel = item.category_label || item.category;

      li.innerHTML = `
        <div class="search-result-top">
          <span class="search-result-badge ${catBadgeClass}">${escapeHtml(catLabel)}</span>
          <h4 class="search-result-title">${highlightedTitle}</h4>
        </div>
        <p class="search-result-snippet">${highlightedSnippet}</p>
      `;

      li.addEventListener('click', () => {
        selectResultItem(item);
      });

      searchResultsList.appendChild(li);
    });
  }

  // 7. Handle Selection
  function selectResultItem(item) {
    closeSearchModal();

    if (item.file) {
      if (typeof window.loadChapter === 'function') {
        window.loadChapter(item.file);
      }
      
      // Update browser URL query without reloading
      const url = new URL(window.location);
      url.searchParams.set('chapter', item.file);
      window.history.replaceState({}, '', url);
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // 8. Keyboard Navigation
  function handleKeyDown(e) {
    if (searchModal.style.display !== 'flex') {
      // Global shortcut Ctrl+K / Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSearchModal();
      }
      return;
    }

    const items = searchResultsList.querySelectorAll('.search-result-item');
    if (e.key === 'Escape') {
      e.preventDefault();
      closeSearchModal();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (items.length > 0) {
        selectedIndex = (selectedIndex + 1) % items.length;
        updateSelectedVisual(items);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (items.length > 0) {
        selectedIndex = (selectedIndex - 1 + items.length) % items.length;
        updateSelectedVisual(items);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && items[selectedIndex]) {
        items[selectedIndex].click();
      } else if (items.length > 0) {
        items[0].click();
      }
    }
  }

  function updateSelectedVisual(items) {
    items.forEach((it, idx) => {
      if (idx === selectedIndex) {
        it.classList.add('selected');
        it.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else {
        it.classList.remove('selected');
      }
    });
  }

  // 9. Initialize & Event Listeners
  function init() {
    searchModal = document.getElementById('search-modal');
    searchInput = document.getElementById('search-input');
    searchClearBtn = document.getElementById('search-clear-btn');
    searchCloseBtn = document.getElementById('search-close-btn');
    searchResultsList = document.getElementById('search-results-list');
    searchInitialState = document.getElementById('search-initial-state');
    searchCountAll = document.getElementById('search-count-all');
    filterChips = document.querySelectorAll('.search-filter-chip');

    loadSearchIndex();

    // Trigger button
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => openSearchModal());
    }

    if (searchCloseBtn) {
      searchCloseBtn.addEventListener('click', closeSearchModal);
    }

    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        performSearch('');
        searchInput.focus();
      });
    }

    if (searchModal) {
      searchModal.addEventListener('click', (e) => {
        if (e.target === searchModal) {
          closeSearchModal();
        }
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          performSearch(searchInput.value);
        }, 120);
      });
    }

    // Category Filter Chips
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentFilter = chip.dataset.cat;
        performSearch(searchInput.value);
      });
    });

    // Suggestion tags
    const suggestTags = document.querySelectorAll('.search-suggest-tag');
    suggestTags.forEach(tag => {
      tag.addEventListener('click', () => {
        const word = tag.textContent.trim();
        searchInput.value = word;
        performSearch(word);
        searchInput.focus();
      });
    });

    // Global Key Listener
    window.addEventListener('keydown', handleKeyDown);

    // URL Query Parameter Check on Page Load (?q=... or ?search=...)
    const urlParams = new URLSearchParams(window.location.search);
    const queryParam = urlParams.get('q') || urlParams.get('search');
    if (queryParam) {
      setTimeout(() => {
        openSearchModal(queryParam);
      }, 300);
    }
  }

  window.SearchEngine = {
    open: openSearchModal,
    close: closeSearchModal,
    search: performSearch
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
