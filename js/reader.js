// =============================================================
// Reader Core & State Module
// =============================================================

// Global Application State
const STATE = {
  theme: 'light',
  font: 'serif',
  fontSize: 18,
  align: 'justify',
  indent: true,
  chapters: [],
  currentChapterIndex: 0,
  commentFilter: 'chapter',
  datePreset: 'today'
};

// Fallback hardcoded list if chapters.json fetch fails completely
const FALLBACK_CHAPTERS = [
  { file: 'Chapter_Minus1_The_Legend_of_Creation.md', title: 'พงศาวดาร: การสรรค์สร้างโลก และปฐมบทแห่งดินแดน (The Chronicle of Creation)' },
  { file: 'World_Setting.md', title: '[Lore] ข้อมูลโลกและระบบพลังงาน (World Setting & Energy System)' },
  { file: 'Entity_Tiers.md', title: '[Lore] ระบบระดับตัวตนและระดับภัยคุกคาม (Entity & Threat Classification Tiers)' },
  { file: 'Skill_Database.md', title: '[Lore] ฐานข้อมูลทักษะและเวทมนตร์ (Skill & Magic Database)' },
  { file: 'Technology_Evolution.md', title: '[Lore] วิวัฒนาการทางเทคโนโลยี (Technology & Energy Evolution)' },
  { file: 'Species_Dragonoid.md', title: '[Lore] เผ่าพันธุ์ดราโกนอยด์ (Species: Dragonoid)' },
  { file: 'Species_Aeran.md', title: '[Lore] เผ่าพันธุ์เอร่า (Species: Aeran)' },
  { file: 'Species_Beastkin.md', title: '[Lore] เผ่าพันธุ์บีสต์คิน (Species: Beastkin)' },
  { file: 'Species_Automata.md', title: '[Lore] เผ่าพันธุ์ออโตมาตา (Species: Automata)' },
  { file: 'Species_Sylvan.md', title: '[Lore] เผ่าพันธุ์ซิลวาน (Species: Sylvan)' },
  { file: 'Characters/Character_Document.md', title: '[Character] สารบรรณรวบรวมตัวละคร (Character Database Overview)' },
  { file: 'Characters/Relationship_Map.md', title: '[Character] แผนผังความสัมพันธ์ตัวละคร (Character Relationship Map)' },
  { file: 'Characters/Design_Focus.md', title: '[Character] แนวคิดและการออกแบบรูปลักษณ์ (Character Design Focus)' },
  { file: 'Characters/Dorea.md', title: '[Character] เลดี้โดเรียแห่งตระกูลไวร์ชีล (Lady Dorea of Wyvernshield)' },
  { file: 'Characters/Thar.md', title: '[Character] คุณหมอธาร์ (Thar - Physician of Calamity)' },
  { file: 'Characters/Carlos.md', title: '[Character] คาร์ลอส หัวหน้าองครักษ์เกราะเงิน (Carlos)' },
  { file: 'Characters/Lady_Enya.md', title: '[Character] ท่านหญิงเอนย่า (Lady Enya)' },
  { file: 'Characters/Gideon.md', title: '[Character] ปู่กิเดียน (Gideon)' },
  { file: 'Characters/Eliza.md', title: '[Character] เอลิซ่า (Eliza)' },
  { file: 'Characters/Minor_Characters.md', title: '[Character] ตัวละครสมทบและเพื่อนสนิท (Minor Characters)' },
  { file: 'Plot_Structure/Timeline.md', title: '[Structure] ลำดับเหตุการณ์และช่วงอายุ (Chronological Timeline)' },
  { file: 'Plot_Structure/Chapters_Outline.md', title: '[Structure] โครงสร้างและเนื้อหาแต่ละตอน (Chapters Outline)' },
  { file: 'Creature/_Base.md', title: '[Creature] สารบรรณสิ่งมีชีวิตและอสุรกาย (Creature Classification)' },
  { file: 'Creature/Nebula_Vanir.md', title: '[Creature] อบิสโซเลียน: เนบิวลาวาเนียร์ (Nebula-Vanir)' },
  { file: 'Creature/Aurelius_Ancient_Dragon.md', title: '[Creature] พรีโมเดียน: มังกรบรรพกาลออเรลิอุส (Aurelius Ancient Dragon)' },
  { file: 'Creature/Cataclys_Golem.md', title: '[Creature] คาตาคริสเมียน: อสูรขุนเขาคลั่ง (Cataclys-Golem)' },
  { file: 'Creature/Ancient_Ruin_Golem.md', title: '[Creature] รูอิเนียน: เทพอัศวินจักรกลทลายค่าย (Ancient Ruin Golem)' },
  { file: 'Creature/Core_Eater_Parasite.md', title: '[Creature] มอร์เฟียน: ปรสิตกัดกินแกนเวท (Core-Eater Parasite)' },
  { file: 'Creature/Mana_Direwolf.md', title: '[Creature] ฮอร์เดียน: หมาป่าอสุรามานา (Mana Direwolf)' },
  { file: 'Creature/Acid_Clawed_Behemoth.md', title: '[Creature] เพริเลียน: อสูรพงไพรเล็บกรด (Acid-Clawed Behemoth)' },
  { file: 'Creature/Wild_Gale_Griffin.md', title: '[Creature] เพริเลียน: กริฟฟินป่าปีกวายุ (Wild Gale Griffin)' },
  { file: 'Creature/Snow_Pigeon.md', title: '[Creature] แพกเซียน: นกเขาหิมะขาว (Snow Pigeon)' },
  { file: 'Creature/Solar_Magic_Flower.md', title: '[Creature] แพกเซียน: ดอกไม้สุริยะมนตรา (Solar Magic Flower)' },
  { file: 'Creature/Dragon_Lily.md', title: '[Creature] แพกเซียน: ดอกลิลลี่มังกร (Dragon Lily)' },
  { file: 'Creature/Gloom_Centipede.md', title: '[Creature] ฮอร์เดียน: ตะขาบเงามืดสะท้อนแสง (Gloom Centipede)' },
  { file: 'Comment/Chapter_00-07_2026-05-27_01_Consistency_and_Pacing_Review.md', title: '[Review] บันทึกตรวจทานความสมเหตุสมผลและจังหวะเรื่อง (Pacing & Consistency Review)' },
  { file: 'Chapter_00_The_Cradle_of_Dorea.md', title: 'ตอนที่ 0: ของขวัญจากฟากฟ้า และคำสัญญาอันแสนอบอุ่น (The Cradle of Dorea)' },
  { file: 'Chapter_01_The_Ash_of_Draconia.md', title: 'ตอนที่ 1: วันที่ท้องฟ้าถล่ม และอ้อมกอดสุดท้าย (The Ash of Draconia)' },
  { file: 'Chapter_02_The_Origin_of_Tar.md', title: 'ตอนที่ 2: รอยแผลแห่งเอเธลการ์ด และคุณหมอผู้อ่อนโยน (The Origin of Thar)' },
  { file: 'Chapter_03_The_Cold_Embrace.md', title: 'ตอนที่ 3: แขนสีเงินกลางป่าลึก และอ้อมกอดของคนแปลกหน้า (The Cold Embrace)' },
  { file: 'Chapter_04_The_Doctors_Suture.md', title: 'ตอนที่ 4: คืนพายุโหม และเส้นทางสู่บ้าน (The Doctor\'s Suture - Journey)' },
  { file: 'Chapter_05_The_Tense_Distance_and_Shivered_Trust.md', title: 'ตอนที่ 5: ระยะห่างและเศษเสี้ยวความระแวง (The Tense Distance and Shivered Trust)' },
  { file: 'Chapter_06_The_Silent_Pages_and_the_Starry_Letters.md', title: 'ตอนที่ 6: ตัวอักษรดวงดาว กับภาษาที่เชื่อมใจ (The Silent Pages and the Starry Letters)' },
  { file: 'Chapter_07_The_Bound_Hearts_and_Five_Years_Dawn.md', title: 'ตอนที่ 7: คำสัญญาใต้ชายคา และห้าปีแห่งการเติบโต (The Bound Hearts and Five Years\' Dawn)' },
  { file: 'SideStory_02_The_Lingering_Scent_and_the_Midnight_Heat.md', title: '[Side Story] ตอนพิเศษ: กลิ่นหอมที่ตกค้าง กับไอร้อนใต้เงาราตรี (The Lingering Scent and the Midnight Heat)' }
];

// Comprehensive Emoji Removal Helper
function removeAllEmojis(str) {
  if (!str) return '';
  return str.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]|\uD83D[\uDE00-\uDE4F]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDE80-\uDEF6]|\uFE0F)/g, '');
}

// Preprocess Markdown text
function preprocessMarkdown(text) {
  if (!text) return '';
  let cleanText = removeAllEmojis(text);
  const lines = cleanText.split('\n');
  let firstNonEmpty = true;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;

    if (firstNonEmpty) {
      if (!line.startsWith('#')) {
        lines[i] = '# ' + line;
      }
      firstNonEmpty = false;
      continue;
    }

    if (line.startsWith('✦')) {
      lines[i] = '## ' + line.substring(1).trim();
    } else if (line.startsWith('🌿')) {
      lines[i] = '### ' + line.substring(1).trim();
    } else if (/^(วัย|อายุ)\s*\d+/.test(line) && line.length < 120 && !line.startsWith('#')) {
      lines[i] = '### ' + line;
    } else if (line === '---') {
      lines[i] = '\n---\n';
    }
  }

  return lines.join('\n');
}

// Thai Word Segmenter
function applyThaiWordBreaks(element) {
  if (!window.Intl || !window.Intl.Segmenter) return;
  try {
    const segmenter = new Intl.Segmenter('th', { granularity: 'word' });

    function walk(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue;
        if (/[\u0e00-\u0e7f]/.test(text)) {
          const segments = segmenter.segment(text);
          let result = '';
          for (const segment of segments) {
            result += segment.segment;
            if (segment.isWordLike) {
              result += '\u200B';
            }
          }
          node.nodeValue = result;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName !== 'SCRIPT' && node.tagName !== 'STYLE' && node.tagName !== 'TEXTAREA') {
          for (let child = node.firstChild; child; child = child.nextSibling) {
            walk(child);
          }
        }
      }
    }

    walk(element);
  } catch (e) {
    console.error('Error segmenting Thai words:', e);
  }
}

// Fetch & Load Chapter Content (with HTTP Fetch + EMBEDDED_DATA Fallback)
async function loadChapterContent(chapter) {
  if (!elements.readerContent) return;

  elements.readerContent.innerHTML = '';
  elements.readerContent.appendChild(elements.skeleton);
  elements.headerTitle.textContent = chapter.title.split('(')[0].trim();
  window.scrollTo(0, 0);

  if (STATE.currentChapterIndex > 0) {
    elements.prevBtn.classList.remove('disabled');
  } else {
    elements.prevBtn.classList.add('disabled');
  }

  if (STATE.currentChapterIndex < STATE.chapters.length - 1) {
    elements.nextBtn.classList.remove('disabled');
  } else {
    elements.nextBtn.classList.add('disabled');
  }

  try {
    let markdownText = null;

    // 1. Try Fetching via Network / Server
    try {
      const path = `data/${chapter.file}`;
      const response = await fetch(path);
      if (response.ok) {
        markdownText = await response.text();
      }
    } catch (fetchErr) {
      console.warn(`Fetch network error for ${chapter.file}, attempting EMBEDDED_DATA fallback`, fetchErr);
    }

    // 2. Fallback to window.EMBEDDED_DATA (Offline / file:// protocol support)
    if (!markdownText && window.EMBEDDED_DATA) {
      const filename = chapter.file;
      const basename = filename.split('/').pop();
      markdownText = window.EMBEDDED_DATA[filename] || window.EMBEDDED_DATA[basename];
    }

    if (!markdownText) {
      throw new Error(`Failed to load ${chapter.file}`);
    }

    markdownText = preprocessMarkdown(markdownText);

    if (window.marked) {
      elements.readerContent.innerHTML = marked.parse(markdownText);
    } else {
      elements.readerContent.innerHTML = `<h1>${chapter.title}</h1><p>${markdownText.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
    }

    renderCommentsForCurrentChapter();
    updateCommentBadge();
    applyThaiWordBreaks(elements.readerContent);
    renderMermaidDiagrams();
    if (window.loadChapterAudio) {
      window.loadChapterAudio(chapter.file);
    }

  } catch (err) {
    console.error('Error loading chapter markdown:', err);
    showFallbackMessage(chapter);
  }

  updateScrollProgress();
}

// Fallback message when both fetch and embedded data fail
function showFallbackMessage(chapter) {
  const isFileProtocol = window.location.protocol === 'file:';
  let helpHtml = '';

  if (isFileProtocol) {
    helpHtml = `
      <div class="fallback-card">
        <div class="fallback-title">เปิดอ่านผ่านระบบ Local Server เพื่อแสดงผลเนื้อหา</div>
        <div class="fallback-desc">
          บราวเซอร์ของคุณบล็อกการดึงไฟล์จำลอง (.md) ด้วยระบบความปลอดภัย CORS เนื่องจากการเปิดไฟล์ตรง ๆ (file://)<br>
          โปรดเปิดอ่านโดยใช้ Local Server เช่น Extension Live Server ใน VS Code หรือรันคำสั่งด้านล่างนี้ในโฟลเดอร์นี้:
        </div>
        <div class="code-instruction">python -m http.server 8000</div>
        <div class="fallback-desc">จากนั้นเข้าสู่ลิงก์ <a href="http://localhost:8000" target="_blank">http://localhost:8000</a></div>
      </div>
    `;
  } else {
    helpHtml = `
      <div class="fallback-card">
        <div class="fallback-title">ไม่สามารถดาวน์โหลดไฟล์บทประพันธ์ได้</div>
        <div class="fallback-desc">
          ไม่พบไฟล์ <code>data/${chapter.file}</code> ในโฟลเดอร์หรือบราวเซอร์ไม่ได้รับอนุญาตให้ดึงข้อมูล<br>
          โปรดตรวจสอบว่าได้คัดลอกไฟล์ Markdown ทั้งหมดเข้าไว้ในโฟลเดอร์ <code>MarkDownNovelReader/data/</code> แล้ว
        </div>
      </div>
    `;
  }
  elements.readerContent.innerHTML = helpHtml;
}

// Scroll progress bar
function updateScrollProgress() {
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollPos = window.scrollY;
  if (docHeight > 0) {
    const percentage = (scrollPos / docHeight) * 100;
    elements.progressBar.style.width = `${percentage}%`;
  } else {
    elements.progressBar.style.width = '0%';
  }
}
