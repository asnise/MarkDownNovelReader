/**
 * ai_helper.js
 * AI Knowledge, Prompt Exporter, and Context Pack Generator for external LLMs.
 */

(function () {
  let aiData = null;
  let activePack = 'prompt_pack';

  let aiModal = null;
  let aiHelperBtn = null;
  let aiModalCloseBtn = null;
  let aiCopyBtn = null;
  let aiPromptPreview = null;
  let aiTabButtons = [];

  // 1. Load AI Data Index
  async function loadAiData() {
    try {
      if (window.EMBEDDED_DATA && window.EMBEDDED_DATA['ai_index.json']) {
        const raw = window.EMBEDDED_DATA['ai_index.json'];
        aiData = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } else {
        const res = await fetch('data/ai_index.json');
        if (res.ok) {
          aiData = await res.json();
        }
      }
    } catch (e) {
      console.warn('Could not load ai_index.json:', e);
    }
  }

  // 2. Context Generators
  function generatePromptPack() {
    const dict = (aiData && aiData.dictionary) || {};
    return `# [Context] Dorea's Princess Journey (การเดินทางของเจ้าหญิงมังกร)
คุณคือ AI ผู้เชี่ยวชาญด้านวรรณกรรมและเนื้อเรื่องของนิยาย "Dorea's Princess Journey"
โปรดใช้ข้อมูลบริบทและกฎเกณฑ์ของโลกต่อไปนี้ในการตอบคำถาม วิเคราะห์ หรือช่วยเขียนต่อ:

## 1. ข้อมูลโลกและแกนหลัก (Core Setting)
- เรื่องราว: แฟนตาซี-ไซไฟดาร์กโรมานซ์และวิทยาการเวทมนตร์
- ตัวเอก: "โดเรีย" (Dorea) เจ้าหญิงมังกร และ "ธาร์" (Thar) แพทย์สนามอัจฉริยะชาวเอร่า
- เมืองหลัก: นครหลวง "เอเธลการ์ด" (Aethelgard) ศูนย์กลางวิทยาการเวทมนตร์และการแพทย์
- ภัยคุกคาม: "รอยแยกมิติ" (Dimensional Rifts) ที่ปลดปล่อยมอนสเตอร์กลายพันธุ์
- เทคโนโลยีเด่น: "ATKD" (Aether-Thigh Kinetic Drive) ชุดขับเคลื่อนต้านแรงโน้มถ่วงสำหรับมนุษย์

## 2. มาตรฐานเผ่าพันธุ์ (Species Registry)
- มนุษย์ ➔ ชาวเอร่า / เอร่า (Aera / Aeran)
- มนุษย์มังกร ➔ ดราโกนอยด์ (Dragonoid)
- ครึ่งสัตว์ ➔ บีสต์คิน (Beastkin)
- จักรกล/หุ่นยนต์ ➔ ออโตมาตา (Automata)
- เผ่านกหรือภูต ➔ ซิลวาน (Sylvan)

## 3. ตัวละครหลักและความสัมพันธ์
- **โดเรีย (Dorea Evancross)**: ดราโกนอยด์สาว นัยน์ตาสีไพลิน ผมดำขลับริ้วทอง ซ่อนเกล็ดบางบริเวณโหนกแก้ม พละกำลังมหาศาล ผูกพันลึกซึ้งกับธาร์
- **ธาร์ (Thar Evancross)**: คุณหมอหนุ่มชาวเอร่า ผู้สุขุม เยือกเย็น เชี่ยวชาญกายวิภาคและชีพจรมานา
- **เอลิซ่า เพนนีเวิร์ธ (Eliza)**: ผู้ช่วยแพทย์ตระกูลดัง ผมบลอนด์ ทำงานเข้าขากับธาร์และแอบชอบธาร์

## 4. แหล่งข้อมูลทางการ
- Web Reader: https://asnise.github.io/MarkDownNovelReader/
- AI Manifest: https://asnise.github.io/MarkDownNovelReader/llms.txt
- Full Lore Compendium: https://asnise.github.io/MarkDownNovelReader/llms-full.txt
`;
  }

  function generateCurrentChapterContext() {
    let currentChapterFile = (window.STATE && window.STATE.chapters && window.STATE.chapters[window.STATE.currentChapterIndex]?.file) || 'Chapter_00_The_Cradle_of_Dorea.md';
    let content = '';

    if (window.EMBEDDED_DATA && window.EMBEDDED_DATA[currentChapterFile]) {
      content = window.EMBEDDED_DATA[currentChapterFile];
    } else {
      const contentEl = document.getElementById('reader-content') || document.getElementById('markdown-content');
      if (contentEl) {
        content = contentEl.innerText || contentEl.textContent || '';
      }
    }

    if (content.length > 5000) {
      content = content.substring(0, 5000) + '\n\n...(เนื้อหาถูกย่อให้เหมาะสมกับบริบท)...';
    }

    return `# [Current Chapter Context] Dorea's Princess Journey
ไฟล์ปัจจุบัน: ${currentChapterFile}
URL: https://asnise.github.io/MarkDownNovelReader/data/${currentChapterFile}

---
${content}
---

คำสั่งสำหรับ AI: โปรดวิเคราะห์ สรุปประเด็น หรือช่วยต่อยอดบทสนทนาจากเนื้อหาในบทข้างต้น`;
  }

  function generateCharactersContext() {
    return `# [Character Profiles] Dorea's Princess Journey

1. **โดเรีย (Lady Dorea of Wyvernshield / Dorea Evancross)**
   - เผ่าพันธุ์: ดราโกนอยด์ (Dragonoid)
   - ลักษณะ: ดวงตาสีไพลินคมกริบ ผมดำขลับประกายทอง มีเกล็ดสะท้อนแสงบางละเอียดใต้โหนกแก้ม มีหางสีดำขลับ
   - บุคลิก: ภายนอกดูแข็งแกร่ง หยิ่งทะนง และดุดัน แต่ภายในอ่อนไหว ขี้หวง และโหยหาความอบอุ่นจากธาร์

2. **ธาร์ (Thar Evancross)**
   - เผ่าพันธุ์: ชาวเอร่า (Aeran)
   - ลักษณะ: ชายหนุ่มรูปร่างสูงโปร่ง สวมแว่นตา สวมเสื้อเชิ้ตพับแขน มือและท่อนแขนมีเส้นเลือดชัดเจนจากการผ่าตัด
   - บุคลิก: สุขุม นุ่มนวล มีสมาธิสูง และเด็ดขาดในยามฉุกเฉิน

3. **เอลิซ่า เพนนีเวิร์ธ (Eliza Pennyworth)**
   - เผ่าพันธุ์: ชาวเอร่า (Aeran)
   - ลักษณะ: เด็กสาวผมบลอนด์ทองสว่าง ดวงตาสีฟ้าคราม สวมชุดฝึกงานแพทย์สีฟ้าอ่อน
   - บุคลิก: อ่อนโยน ขยันขันแข็ง เอาใจใส่ ละเอียดรอบคอบ และชื่นชมธาร์จากใจจริง

4. **ปู่กิเดียน (Gideon)**
   - ผู้อุปถัมภ์ที่ให้ทุนการศึกษาและส่งเสียธาร์กับโดเรียในนครเอเธลการ์ด`;
  }

  function generateDictionaryContext() {
    const dict = (aiData && aiData.dictionary) || {};
    let text = `# [Glossary & Terms] พจนานุกรมคำศัพท์ Dorea's Princess Journey\n\n`;
    for (let key in dict) {
      let item = dict[key];
      text += `### ${item.name_th || key} (${key})\n`;
      if (item.title) text += `- บทบาท/ตำแหน่ง: ${item.title}\n`;
      if (item.species) text += `- เผ่าพันธุ์: ${item.species}\n`;
      text += `- คำอธิบาย: ${item.description || ''}\n\n`;
    }
    return text;
  }

  function updatePreview() {
    if (!aiPromptPreview) return;
    let generated = '';
    if (activePack === 'prompt_pack') {
      generated = generatePromptPack();
    } else if (activePack === 'current_chapter') {
      generated = generateCurrentChapterContext();
    } else if (activePack === 'characters') {
      generated = generateCharactersContext();
    } else if (activePack === 'dictionary') {
      generated = generateDictionaryContext();
    }
    aiPromptPreview.value = generated;
  }

  // 3. Modal Controls
  function openAiModal() {
    if (!aiModal) return;
    updatePreview();
    aiModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeAiModal() {
    if (!aiModal) return;
    aiModal.style.display = 'none';
    document.body.style.overflow = '';
  }

  function copyPromptToClipboard() {
    if (!aiPromptPreview) return;
    aiPromptPreview.select();
    navigator.clipboard.writeText(aiPromptPreview.value).then(() => {
      if (typeof window.showToast === 'function') {
        window.showToast('✨ คัดลอก Prompt สำหรับ AI เรียบร้อยแล้ว!');
      } else {
        alert('คัดลอก Prompt สำหรับ AI เรียบร้อยแล้ว!');
      }
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }

  // 4. Init Event Listeners
  function init() {
    aiModal = document.getElementById('ai-modal');
    aiHelperBtn = document.getElementById('ai-helper-btn');
    aiModalCloseBtn = document.getElementById('ai-modal-close-btn');
    aiCopyBtn = document.getElementById('ai-copy-btn');
    aiPromptPreview = document.getElementById('ai-prompt-preview');
    aiTabButtons = document.querySelectorAll('.ai-tab-btn');

    loadAiData();

    if (aiHelperBtn) {
      aiHelperBtn.addEventListener('click', openAiModal);
    }

    if (aiModalCloseBtn) {
      aiModalCloseBtn.addEventListener('click', closeAiModal);
    }

    if (aiModal) {
      aiModal.addEventListener('click', (e) => {
        if (e.target === aiModal) closeAiModal();
      });
    }

    if (aiCopyBtn) {
      aiCopyBtn.addEventListener('click', copyPromptToClipboard);
    }

    aiTabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        aiTabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activePack = btn.dataset.pack;
        updatePreview();
      });
    });
  }

  window.AiHelper = {
    open: openAiModal,
    close: closeAiModal,
    update: updatePreview
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
