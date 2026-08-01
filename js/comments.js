// =============================================================
// Selection-Based Commenting System Module
// =============================================================

let commentsDb = [];
let currentSelectionData = null;
let currentCommentType = 'praise';

// Initialize Comments from LocalStorage
function initComments() {
  try {
    const saved = localStorage.getItem('novel_reader_comments');
    if (saved) {
      commentsDb = JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load comments from local storage', e);
    commentsDb = [];
  }
  updateCommentBadge();
  setupCommentEventListeners();
}

// Save Comments to LocalStorage
function saveCommentsToStorage() {
  try {
    localStorage.setItem('novel_reader_comments', JSON.stringify(commentsDb));
  } catch (e) {
    console.error('Failed to save comments to local storage', e);
  }
  updateCommentBadge();
}

// Update Header & Tab Comment Counters
function updateCommentBadge() {
  const currentFile = STATE.chapters[STATE.currentChapterIndex]?.file;
  const chapterCount = commentsDb.filter(c => c.chapterFile === currentFile).length;
  const totalCount = commentsDb.length;

  const badge = document.getElementById('comment-count-badge');
  if (badge) {
    if (totalCount > 0) {
      badge.textContent = totalCount;
      badge.title = `ความคิดเห็นบทนี้: ${chapterCount} / ทั้งหมด: ${totalCount}`;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

  const tabChapterCount = document.getElementById('tab-count-chapter');
  const tabAllCount = document.getElementById('tab-count-all');
  if (tabChapterCount) tabChapterCount.textContent = chapterCount;
  if (tabAllCount) tabAllCount.textContent = totalCount;
}

// Render Highlights for Current Chapter
function renderCommentsForCurrentChapter() {
  const currentFile = STATE.chapters[STATE.currentChapterIndex]?.file;
  if (!currentFile || !elements.readerContent) return;

  const chapterComments = commentsDb.filter(c => c.chapterFile === currentFile);
  const blocks = elements.readerContent.children;

  const commentsByBlock = {};
  chapterComments.forEach(comment => {
    if (!commentsByBlock[comment.blockIndex]) {
      commentsByBlock[comment.blockIndex] = [];
    }
    commentsByBlock[comment.blockIndex].push(comment);
  });

  for (const blockIdx in commentsByBlock) {
    const blockEl = blocks[blockIdx];
    if (!blockEl) continue;

    const blockComments = commentsByBlock[blockIdx].sort((a, b) => b.startOffset - a.startOffset);

    blockComments.forEach(comment => {
      const textAtRange = blockEl.textContent.substring(comment.startOffset, comment.endOffset);
      let matchStart = comment.startOffset;
      let matchEnd = comment.endOffset;

      if (textAtRange === comment.selectedText) {
        wrapTextRange(
          blockEl, 
          matchStart, 
          matchEnd, 
          `comment-highlight status-${comment.type}`, 
          comment.id, 
          (comment.type === 'replace' && comment.replacement) ? comment.replacement : null, 
          comment.selectedText
        );
      } else {
        const firstIdx = blockEl.textContent.indexOf(comment.selectedText);
        const lastIdx = blockEl.textContent.lastIndexOf(comment.selectedText);
        if (firstIdx !== -1 && firstIdx === lastIdx) {
          wrapTextRange(
            blockEl, 
            firstIdx, 
            firstIdx + comment.selectedText.length, 
            `comment-highlight status-${comment.type}`, 
            comment.id, 
            (comment.type === 'replace' && comment.replacement) ? comment.replacement : null, 
            comment.selectedText
          );
        }
      }
    });
  }
}

// Wrap Text Range with Highlight Element (supports replacing text in reader DOM)
function wrapTextRange(element, start, end, className, commentId, replacementText, originalText) {
  const textNodes = [];
  const walk = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
  let node;
  while (node = walk.nextNode()) {
    textNodes.push(node);
  }

  let currentPos = 0;
  for (const textNode of textNodes) {
    const len = textNode.nodeValue.length;
    const nodeStart = currentPos;
    const nodeEnd = currentPos + len;

    if (nodeEnd > start && nodeStart < end) {
      let splitNode = textNode;
      let wrapStart = Math.max(0, start - nodeStart);
      let wrapEnd = Math.min(len, end - nodeStart);

      if (wrapStart > 0) {
        splitNode = splitNode.splitText(wrapStart);
        wrapEnd -= wrapStart;
      }
      if (wrapEnd < splitNode.nodeValue.length) {
        splitNode.splitText(wrapEnd);
      }

      const span = document.createElement('span');
      span.className = className;
      if (commentId) span.setAttribute('data-comment-id', commentId);

      if (replacementText) {
        span.textContent = replacementText;
        span.setAttribute('data-original-text', originalText || splitNode.nodeValue);
        span.title = `คำเดิม: "${originalText || splitNode.nodeValue}"`;
        splitNode.parentNode.replaceChild(span, splitNode);
      } else {
        if (originalText) span.setAttribute('data-original-text', originalText);
        splitNode.parentNode.insertBefore(span, splitNode);
        span.appendChild(splitNode);
      }
    }
    currentPos = nodeEnd;
  }
}

// Text Selection Event Listener
function checkSelection(e) {
  const selMenu = document.getElementById('selection-menu');
  if (!selMenu) return;

  if (e && e.target && (e.target.closest('#selection-menu') || e.target.closest('#comment-modal'))) {
    return;
  }

  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) {
    selMenu.classList.remove('active');
    return;
  }

  const selectedText = selection.toString().trim();
  if (selectedText.length < 2) {
    selMenu.classList.remove('active');
    return;
  }

  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;
  const paragraphBlock = (container.nodeType === Node.ELEMENT_NODE) ? container.closest('.reader-content > *') : container.parentNode?.closest('.reader-content > *');

  if (!paragraphBlock || !elements.readerContent.contains(paragraphBlock)) {
    selMenu.classList.remove('active');
    return;
  }

  const blocks = Array.from(elements.readerContent.children);
  const blockIndex = blocks.indexOf(paragraphBlock);

  if (blockIndex === -1) {
    selMenu.classList.remove('active');
    return;
  }

  const preRange = document.createRange();
  preRange.selectNodeContents(paragraphBlock);
  preRange.setEnd(range.startContainer, range.startOffset);
  const startOffset = preRange.toString().length;
  const endOffset = startOffset + selectedText.length;

  currentSelectionData = {
    chapterFile: STATE.chapters[STATE.currentChapterIndex]?.file,
    blockIndex: blockIndex,
    selectedText: selectedText,
    startOffset: startOffset,
    endOffset: endOffset
  };

  const rect = range.getBoundingClientRect();
  const menuWidth = selMenu.offsetWidth || 120;
  let top = rect.top + window.scrollY - 44;
  let left = rect.left + window.scrollX + (rect.width / 2) - (menuWidth / 2);

  if (top < window.scrollY + 60) {
    top = rect.bottom + window.scrollY + 8;
  }
  if (left < 10) left = 10;
  if (left + menuWidth > window.innerWidth - 10) {
    left = window.innerWidth - menuWidth - 10;
  }

  selMenu.style.top = `${top}px`;
  selMenu.style.left = `${left}px`;
  selMenu.classList.add('active');
}

// Open Comment Creation Modal
function openCommentModal(type) {
  currentCommentType = type;
  const modal = document.getElementById('comment-modal');
  const titleEl = document.getElementById('comment-modal-title');
  const quoteEl = document.getElementById('comment-modal-quote');
  const textarea = document.getElementById('comment-modal-textarea');
  const replaceContainer = document.getElementById('comment-modal-replace-container');
  const replaceInput = document.getElementById('comment-modal-replace-input');
  const selMenu = document.getElementById('selection-menu');

  if (selMenu) selMenu.classList.remove('active');

  let titleStr = 'เสนอแนะให้แก้ไข';
  let titleClass = 'suggest';
  if (type === 'praise') {
    titleStr = 'ชื่นชมเนื้อหา';
    titleClass = 'praise';
  } else if (type === 'replace') {
    titleStr = 'แทนที่คำ / ประโยค';
    titleClass = 'replace';
  }

  titleEl.textContent = titleStr;
  titleEl.className = `modal-title ${titleClass}`;
  quoteEl.textContent = `"${currentSelectionData.selectedText}"`;
  textarea.value = '';

  if (replaceContainer && replaceInput) {
    if (type === 'replace') {
      replaceContainer.style.display = 'block';
      replaceInput.value = '';
    } else {
      replaceContainer.style.display = 'none';
    }
  }

  modal.classList.add('open');

  if (type === 'replace' && replaceInput) {
    setTimeout(() => replaceInput.focus(), 100);
  } else {
    setTimeout(() => textarea.focus(), 100);
  }
}

// Close Comment Creation Modal
function closeCommentModal() {
  const modal = document.getElementById('comment-modal');
  if (modal) modal.classList.remove('open');
  window.getSelection()?.removeAllRanges();
}

// Floating Tooltip Functions
function showTooltip(targetEl, comment) {
  const tooltip = document.getElementById('comment-tooltip');
  if (!tooltip) return;

  let typeStr = 'เสนอแนะ';
  if (comment.type === 'praise') typeStr = 'ชื่นชม';
  if (comment.type === 'replace') typeStr = 'แทนที่คำ';

  let replaceHtml = '';
  if (comment.type === 'replace' && comment.selectedText) {
    replaceHtml = `<div style="margin-top: 6px; font-weight: 500; color: var(--text-muted); font-size: 0.85em;">คำเดิม: <span style="background-color: rgba(239, 68, 68, 0.15); padding: 2px 6px; border-radius: 4px; color: #ef4444; text-decoration: line-through;">${comment.selectedText}</span></div>`;
  }

  tooltip.innerHTML = `
    <div class="tooltip-header ${comment.type}">
      <span>${typeStr}</span>
      <span class="tooltip-time">${new Date(comment.timestamp).toLocaleDateString('th-TH')}</span>
    </div>
    ${replaceHtml}
    <div style="font-weight: 500; margin-top: 4px; color: var(--text-color);">${comment.text}</div>
  `;

  tooltip.classList.add('active');

  const rect = targetEl.getBoundingClientRect();
  const tooltipHeight = tooltip.offsetHeight;
  const tooltipWidth = tooltip.offsetWidth;

  let top = rect.top + window.scrollY - tooltipHeight - 8;
  let left = rect.left + window.scrollX + (rect.width / 2) - (tooltipWidth / 2);

  if (top < window.scrollY + 60) {
    top = rect.bottom + window.scrollY + 8;
  }
  if (left < 10) left = 10;
  if (left + tooltipWidth > window.innerWidth - 10) {
    left = window.innerWidth - tooltipWidth - 10;
  }

  tooltip.style.top = `${top}px`;
  tooltip.style.left = `${left}px`;
}

function hideTooltip() {
  const tooltip = document.getElementById('comment-tooltip');
  if (tooltip) tooltip.classList.remove('active');
}

// Toggle Right Comment Sidebar
function toggleCommentSidebar(open) {
  const commentSidebar = document.getElementById('comment-sidebar');
  if (!commentSidebar) return;

  if (open) {
    commentSidebar.classList.add('open');
    renderCommentSidebarList();
    toggleSidebar(false);
  } else {
    commentSidebar.classList.remove('open');
  }
}

// Date Filter Functions
function isSameDate(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

function filterCommentsByDate(comments) {
  const presetSelect = document.getElementById('comment-date-preset');
  const preset = presetSelect ? presetSelect.value : (STATE.datePreset || 'today');
  const now = new Date();

  if (preset === 'today') {
    return comments.filter(c => isSameDate(new Date(c.timestamp), now));
  }

  if (preset === '7days') {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    return comments.filter(c => new Date(c.timestamp) >= sevenDaysAgo);
  }

  if (preset === 'custom') {
    const startEl = document.getElementById('comment-date-start');
    const endEl = document.getElementById('comment-date-end');

    let startDate = startEl && startEl.value ? new Date(startEl.value) : null;
    let endDate = endEl && endEl.value ? new Date(endEl.value) : null;

    if (startDate) startDate.setHours(0, 0, 0, 0);
    if (endDate) endDate.setHours(23, 59, 59, 999);

    return comments.filter(c => {
      const cDate = new Date(c.timestamp);
      if (startDate && cDate < startDate) return false;
      if (endDate && cDate > endDate) return false;
      return true;
    });
  }

  return comments;
}

// Render Comment Sidebar Cards List
function renderCommentSidebarList() {
  const listEl = document.getElementById('comment-sidebar-list');
  if (!listEl) return;

  listEl.innerHTML = '';
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

  const finalComments = filterCommentsByDate(targetComments);

  const tag = document.getElementById('filtered-comments-tag');
  if (tag) tag.textContent = `${finalComments.length} รายการ`;

  if (finalComments.length === 0) {
    let msg = 'ไม่มีความคิดเห็นตามเงื่อนไขที่เลือก';
    const preset = document.getElementById('comment-date-preset')?.value || 'today';
    if (preset === 'today') msg = 'ไม่มีความคิดเห็นในวันนี้';

    listEl.innerHTML = `<div class="empty-comments">${msg}<br><small style="opacity: 0.6; display: block; margin-top: 4px;">ลองเปลี่ยนตัวกรองวันที่หรือไฮไลท์ข้อความใหม่</small></div>`;
    return;
  }

  finalComments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  finalComments.forEach(comment => {
    const card = document.createElement('div');
    card.className = 'comment-card';
    card.title = 'คลิกเพื่อวาร์ปไปยังจุดที่บันทึกความคิดเห็น';

    card.addEventListener('click', (e) => {
      if (e.target.closest('.comment-card-btn')) return;
      jumpToComment(comment.chapterFile, comment.id);
    });

    const chapterObj = STATE.chapters.find(ch => ch.file === comment.chapterFile);
    const chapterTitle = chapterObj ? chapterObj.title.split('(')[0].trim() : comment.chapterFile;

    const chapterBadge = document.createElement('div');
    chapterBadge.className = 'comment-card-chapter-badge';
    chapterBadge.innerHTML = `<span>[บท]</span> <span>${chapterTitle}</span>`;
    chapterBadge.title = 'คลิกเพื่อข้ามไปอ่านบทนี้';

    const quote = document.createElement('blockquote');
    quote.className = 'comment-card-quote';
    quote.textContent = `"${comment.selectedText}"`;
    quote.title = 'คลิกเพื่อเลื่อนไปยังข้อความที่ไฮไลท์';

    const header = document.createElement('div');
    header.className = 'comment-card-header';

    const badge = document.createElement('span');
    badge.className = `comment-card-badge ${comment.type}`;
    let typeLabel = 'เสนอแนะ';
    if (comment.type === 'praise') typeLabel = 'ชื่นชม';
    if (comment.type === 'replace') typeLabel = 'แทนที่';
    badge.textContent = typeLabel;

    header.appendChild(badge);

    const text = document.createElement('div');
    text.className = 'comment-card-text';

    if (comment.type === 'replace' && comment.replacement) {
      const repHtml = document.createElement('div');
      repHtml.style.marginBottom = '6px';
      repHtml.style.color = 'var(--text-color)';
      repHtml.style.fontWeight = '500';
      repHtml.innerHTML = `แทนที่ด้วย: <span style="background-color: rgba(139, 92, 246, 0.15); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(139, 92, 246, 0.3); color: #8b5cf6;">${comment.replacement}</span>`;
      text.appendChild(repHtml);
    }

    const noteHtml = document.createElement('div');
    noteHtml.textContent = comment.text;
    text.appendChild(noteHtml);

    const footer = document.createElement('div');
    footer.className = 'comment-card-footer';

    const time = document.createElement('span');
    time.className = 'comment-card-time';
    time.textContent = new Date(comment.timestamp).toLocaleDateString('th-TH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const btns = document.createElement('div');
    btns.className = 'comment-card-btns';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'comment-card-btn';
    copyBtn.title = 'คัดลอกข้อความฟีดแบ็ก';
    copyBtn.innerHTML = '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyCommentText(comment);
    });

    const delBtn = document.createElement('button');
    delBtn.className = 'comment-card-btn delete';
    delBtn.title = 'ลบความคิดเห็น';
    delBtn.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('คุณต้องการลบความคิดเห็นนี้ใช่หรือไม่?')) {
        deleteComment(comment.id);
      }
    });

    btns.appendChild(copyBtn);
    btns.appendChild(delBtn);

    footer.appendChild(time);
    footer.appendChild(btns);

    card.appendChild(chapterBadge);
    card.appendChild(quote);
    card.appendChild(header);
    card.appendChild(text);
    card.appendChild(footer);

    listEl.appendChild(card);
  });
}

// Jump to Comment Highlight Location
function jumpToComment(chapterFile, commentId) {
  if (window.innerWidth <= 768) {
    toggleCommentSidebar(false);
  }

  const targetIdx = STATE.chapters.findIndex(c => c.file === chapterFile);
  if (targetIdx !== -1) {
    if (STATE.currentChapterIndex !== targetIdx) {
      selectChapter(targetIdx);
      setTimeout(() => {
        scrollToCommentHighlight(commentId);
      }, 450);
    } else {
      scrollToCommentHighlight(commentId);
    }
  }
}

function scrollToCommentHighlight(commentId) {
  const targetComment = commentsDb.find(c => c.id === commentId);
  let span = document.querySelector(`.comment-highlight[data-comment-id="${commentId}"]`);

  if (!span && targetComment) {
    renderCommentsForCurrentChapter();
    span = document.querySelector(`.comment-highlight[data-comment-id="${commentId}"]`);
  }

  if (span) {
    span.scrollIntoView({ behavior: 'smooth', block: 'center' });
    span.classList.remove('jump-active');
    void span.offsetWidth;
    span.classList.add('jump-active');

    if (targetComment) {
      showTooltip(span, targetComment);
      setTimeout(hideTooltip, 4000);
    }
  } else if (targetComment && elements.readerContent) {
    const blocks = elements.readerContent.children;
    const blockEl = blocks[targetComment.blockIndex];
    if (blockEl) {
      blockEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      blockEl.style.transition = 'background-color 0.5s ease';
      const originalBg = blockEl.style.backgroundColor;
      blockEl.style.backgroundColor = 'rgba(245, 158, 11, 0.3)';
      setTimeout(() => {
        blockEl.style.backgroundColor = originalBg;
      }, 2500);
    }
  }
}

// Delete Comment
function deleteComment(commentId) {
  commentsDb = commentsDb.filter(c => c.id !== commentId);
  saveCommentsToStorage();
  renderCommentSidebarList();

  const spans = document.querySelectorAll(`.comment-highlight[data-comment-id="${commentId}"]`);
  spans.forEach(span => {
    const originalText = span.getAttribute('data-original-text');
    const parent = span.parentNode;
    if (originalText) {
      const textNode = document.createTextNode(originalText);
      parent.insertBefore(textNode, span);
      parent.removeChild(span);
    } else {
      while (span.firstChild) {
        parent.insertBefore(span.firstChild, span);
      }
      parent.removeChild(span);
    }
    parent.normalize();
  });
}

// Copy Comment Text
function copyCommentText(comment) {
  let typeStr = 'เสนอแนะให้แก้ไข';
  if (comment.type === 'praise') typeStr = 'ชื่นชม';
  if (comment.type === 'replace') typeStr = 'แทนที่คำ';

  let replaceStr = (comment.type === 'replace' && comment.replacement) ? `\n> แทนที่ด้วย: "${comment.replacement}"` : '';

  const chapterTitle = STATE.chapters[STATE.currentChapterIndex]?.title || comment.chapterFile;
  const textToCopy = `**[${typeStr}]** ในบท: ${chapterTitle}\n> ข้อความ: "${comment.selectedText}"${replaceStr}\n\nความเห็น: ${comment.text}`;

  navigator.clipboard.writeText(textToCopy).then(() => {
    alert('คัดลอกข้อความเรียบร้อยแล้ว!');
  }).catch(err => {
    console.error('Failed to copy text', err);
  });
}

// Setup Event Listeners for Comments UI
function setupCommentEventListeners() {
  document.addEventListener('pointerup', checkSelection);

  document.getElementById('sel-btn-praise')?.addEventListener('click', (e) => {
    e.stopPropagation();
    openCommentModal('praise');
  });

  document.getElementById('sel-btn-suggest')?.addEventListener('click', (e) => {
    e.stopPropagation();
    openCommentModal('suggest');
  });

  document.getElementById('sel-btn-replace')?.addEventListener('click', (e) => {
    e.stopPropagation();
    openCommentModal('replace');
  });

  const modalCancel = document.getElementById('comment-modal-cancel');
  const modalSave = document.getElementById('comment-modal-save');
  const modalTextarea = document.getElementById('comment-modal-textarea');

  modalCancel?.addEventListener('click', closeCommentModal);
  modalSave?.addEventListener('click', () => {
    const text = modalTextarea.value.trim();
    if (!text) {
      alert('กรุณากรอกความคิดเห็น');
      return;
    }

    const replaceInput = document.getElementById('comment-modal-replace-input');
    const replacementText = (currentCommentType === 'replace') ? replaceInput.value.trim() : undefined;

    const newComment = {
      id: 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      chapterFile: currentSelectionData.chapterFile,
      blockIndex: currentSelectionData.blockIndex,
      selectedText: currentSelectionData.selectedText,
      startOffset: currentSelectionData.startOffset,
      endOffset: currentSelectionData.endOffset,
      type: currentCommentType,
      text: text,
      replacement: replacementText,
      timestamp: new Date().toISOString()
    };

    commentsDb.push(newComment);
    saveCommentsToStorage();
    closeCommentModal();

    const blockEl = elements.readerContent.children[newComment.blockIndex];
    if (blockEl) {
      wrapTextRange(
        blockEl, 
        newComment.startOffset, 
        newComment.endOffset, 
        `comment-highlight status-${newComment.type}`, 
        newComment.id, 
        (newComment.type === 'replace' && newComment.replacement) ? newComment.replacement : null, 
        newComment.selectedText
      );
    }

    toggleCommentSidebar(true);
  });
}
