/**
 * Audio Player & Highlighting Logic
 */

let currentAudioTimestamps = null;
let currentHighlightNode = null;
let audioElements = {};

function initAudioPlayer() {
  audioElements = {
    container: document.getElementById('audio-player-container'),
    audio: document.getElementById('chapter-audio'),
    playBtn: document.getElementById('audio-play-btn'),
    iconPlay: document.getElementById('icon-play'),
    iconPause: document.getElementById('icon-pause'),
    progressWrapper: document.getElementById('audio-progress-wrapper'),
    progressFill: document.getElementById('audio-progress-fill'),
    timeDisplay: document.getElementById('audio-time-display'),
    closeBtn: document.getElementById('audio-close-btn')
  };

  if (!audioElements.container) return;

  // Event Listeners
  audioElements.playBtn.addEventListener('click', toggleAudioPlay);
  audioElements.closeBtn.addEventListener('click', hideAudioPlayer);
  audioElements.audio.addEventListener('timeupdate', updateAudioProgress);
  audioElements.audio.addEventListener('ended', onAudioEnded);
  audioElements.progressWrapper.addEventListener('click', seekAudio);
}

function loadChapterAudio(chapterFile) {
  hideAudioPlayer();
  removeAudioHighlight();
  currentAudioTimestamps = null;

  if (!chapterFile) return;

  const baseName = chapterFile.split('/').pop().replace('.md', '');
  const mp3Path = `data/Audiobooks/${baseName}.mp3`;
  const jsonPath = `data/Audiobooks/${baseName}.json`;

  let hasData = false;
  
  const jsonKeyFull = `Audiobooks/${baseName}.json`;
  const jsonKeyBase = `${baseName}.json`;
  const jsonStr = window.EMBEDDED_DATA ? (window.EMBEDDED_DATA[jsonKeyFull] || window.EMBEDDED_DATA[jsonKeyBase] || window.EMBEDDED_DATA[jsonPath]) : null;

  if (jsonStr) {
    try {
      currentAudioTimestamps = JSON.parse(jsonStr);
      hasData = true;
    } catch(e) {
      console.error("Failed to parse audio JSON:", e);
    }
  }

  if (hasData) {
    audioElements.audio.src = mp3Path;
    audioElements.container.style.display = 'flex';
    audioElements.iconPlay.style.display = 'block';
    audioElements.iconPause.style.display = 'none';
    audioElements.progressFill.style.width = '0%';
    audioElements.timeDisplay.textContent = '0:00 / 0:00';
  }
}

function toggleAudioPlay() {
  if (audioElements.audio.paused) {
    audioElements.audio.play();
    audioElements.iconPlay.style.display = 'none';
    audioElements.iconPause.style.display = 'block';
  } else {
    audioElements.audio.pause();
    audioElements.iconPlay.style.display = 'block';
    audioElements.iconPause.style.display = 'none';
  }
}

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function updateAudioProgress() {
  const current = audioElements.audio.currentTime;
  const duration = audioElements.audio.duration;
  
  if (duration > 0) {
    const percent = (current / duration) * 100;
    audioElements.progressFill.style.width = `${percent}%`;
    audioElements.timeDisplay.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
  }

  syncHighlight(current);
}

function seekAudio(e) {
  const rect = audioElements.progressWrapper.getBoundingClientRect();
  const pos = (e.clientX - rect.left) / rect.width;
  if (audioElements.audio.duration) {
    audioElements.audio.currentTime = pos * audioElements.audio.duration;
  }
}

function onAudioEnded() {
  audioElements.iconPlay.style.display = 'block';
  audioElements.iconPause.style.display = 'none';
  removeAudioHighlight();
}

function hideAudioPlayer() {
  if(audioElements.audio) audioElements.audio.pause();
  if(audioElements.container) audioElements.container.style.display = 'none';
  removeAudioHighlight();
}

let lastSentenceIndex = -1;

function syncHighlight(currentTime) {
  if (!currentAudioTimestamps) return;

  let activeIndex = -1;
  for (let i = 0; i < currentAudioTimestamps.length; i++) {
    const seg = currentAudioTimestamps[i];
    if (currentTime >= seg.start - 0.1 && currentTime <= seg.end + 0.1) {
      activeIndex = i;
      break;
    }
  }

  if (activeIndex !== lastSentenceIndex) {
    removeAudioHighlight();
    lastSentenceIndex = activeIndex;

    if (activeIndex !== -1) {
      highlightTextInDOM(currentAudioTimestamps[activeIndex].text);
    }
  }
}

function removeAudioHighlight() {
  const highlights = document.querySelectorAll('.audio-highlight');
  highlights.forEach(h => {
    const parent = h.parentNode;
    if(parent) {
      parent.replaceChild(document.createTextNode(h.textContent), h);
      parent.normalize();
    }
  });
  lastSentenceIndex = -1;
}

function highlightTextInDOM(searchText) {
  if (!searchText) return;
  const readerContent = document.getElementById('reader-content');
  if (!readerContent) return;

  const cleanRegex = /[\s\u200B-\u200D\uFEFF"'.,!?()[\]{}:;<>_/\\-]/g;
  let cleanSearch = searchText.replace(cleanRegex, '');
  if (cleanSearch.length < 3) return;

  const textNodes = [];
  const treeWalker = document.createTreeWalker(
    readerContent,
    NodeFilter.SHOW_TEXT,
    { acceptNode: function(node) {
        if (node.parentNode.nodeName === 'CODE') return NodeFilter.FILTER_REJECT;
        if (node.parentNode.classList.contains('audio-highlight')) return NodeFilter.FILTER_SKIP;
        return NodeFilter.FILTER_ACCEPT;
    }},
    false
  );

  let node;
  while (node = treeWalker.nextNode()) {
    textNodes.push(node);
  }

  let combinedText = '';
  const nodeMap = [];
  
  for (let i = 0; i < textNodes.length; i++) {
    const text = textNodes[i].nodeValue;
    for (let j = 0; j < text.length; j++) {
      const char = text[j];
      if (!cleanRegex.test(char)) {
        combinedText += char;
        nodeMap.push({ nodeIndex: i, charIndex: j });
      }
      cleanRegex.lastIndex = 0; // reset regex state
    }
  }

  const matchStart = combinedText.indexOf(cleanSearch);
  
  if (matchStart !== -1) {
    const matchEnd = matchStart + cleanSearch.length - 1;
    const startInfo = nodeMap[matchStart];
    const endInfo = nodeMap[matchEnd];
    
    let nodesToWrap = [];
    for (let i = startInfo.nodeIndex; i <= endInfo.nodeIndex; i++) {
      const originalNode = textNodes[i];
      let startOffset = (i === startInfo.nodeIndex) ? startInfo.charIndex : 0;
      let endOffset = (i === endInfo.nodeIndex) ? endInfo.charIndex + 1 : originalNode.nodeValue.length;
      
      nodesToWrap.push({
        node: originalNode,
        start: startOffset,
        end: endOffset
      });
    }
    
    let firstSpan = null;
    for (let i = nodesToWrap.length - 1; i >= 0; i--) {
      const item = nodesToWrap[i];
      if (item.start >= item.end) continue;
      
      const span = document.createElement('span');
      span.className = 'audio-highlight';
      
      const nodeToSplit = item.node;
      const split1 = nodeToSplit.splitText(item.start);
      if (item.end - item.start < split1.nodeValue.length) {
         split1.splitText(item.end - item.start);
      }
      
      span.textContent = split1.nodeValue;
      split1.parentNode.replaceChild(span, split1);
      
      if (i === 0) firstSpan = span;
    }
    
    if (firstSpan) {
       const rect = firstSpan.getBoundingClientRect();
       const isInViewport = rect.top >= 100 && rect.bottom <= (window.innerHeight - 100);
       if (!isInViewport) {
          window.scrollBy({
            top: rect.top - (window.innerHeight / 2),
            behavior: 'smooth'
          });
       }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initAudioPlayer();
});

window.loadChapterAudio = loadChapterAudio;
