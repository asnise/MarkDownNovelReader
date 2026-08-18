# คู่มือคำสั่งและคู่มือระบบสำหรับ AI (AI Operational Guide & Directives)

เอกสารฉบับนี้จัดทำขึ้นเพื่อให้ **AI ภายนอก (ChatGPT, Claude, Gemini, Perplexity, Cursor, Subagents)** สามารถเข้าถึง เข้าใจโครงสร้างของเว็บไซต์ *MarkDownNovelReader* และปฏิบัติตามคำสั่ง **อัปเดตข้อมูลอัตโนมัติ (Automated Web Sync)** ได้อย่างถูกต้องและแม่นยำ

---

## 1. ข้อมูลระบบและ Endpoints สำหรับ AI

URL หลักของนิยาย: **`https://asnise.github.io/MarkDownNovelReader/`**

### 📌 เครื่องมือและช่องทางการเข้าถึงข้อมูล:
- **`https://asnise.github.io/MarkDownNovelReader/llms.txt`**: สารบัญย่อ, พจนานุกรมศัพท์ (Glossary), สรุปโลก, รายชื่อตัวละคร และลิงก์ตรงไปยังแต่ละบท
- **`https://asnise.github.io/MarkDownNovelReader/llms-full.txt`**: เอกสารรวมจักรวาลฉบับสมบูรณ์ (World Setting, Lore, Characters, Creatures, Timeline, Chapter Summaries) ในไฟล์เดียว (~160 KB)
- **`https://asnise.github.io/MarkDownNovelReader/data/ai_index.json`**: JSON API ที่มีโครงสร้างแน่นอน เหมาะสำหรับระบบประมวลผลอัตโนมัติ
- **`https://asnise.github.io/MarkDownNovelReader/data/search_index.json`**: ดัชนีการค้นหา Full-Text Search
- **`https://asnise.github.io/MarkDownNovelReader/?q=<คำค้นหา>`**: Deep link เปิดหน้าเว็บพร้อมผลการค้นหาคำที่ต้องการ เช่น `/?q=ATKD`
- **`https://asnise.github.io/MarkDownNovelReader/?chapter=<ชื่อไฟล์.md>`**: Deep link เปิดอ่านตอนที่ระบุทันที เช่น `/?chapter=SideStory_02_The_Lingering_Scent_and_the_Midnight_Heat.md`

---

## 2. คำสั่งภาคบังคับ: เมื่อได้รับคำสั่งให้แก้ไขหรืออัปเดตข้อมูล (Mandatory Update Protocol)

> [!IMPORTANT]
> **เมื่อใดก็ตามที่ AI ได้รับคำสั่งให้แก้ไขเนื้อเรื่อง, เพิ่มเติม Lore, เขียนบทใหม่, หรืออัปเดตข้อมูลตัวละคร**
> **AI จะต้องทำการบันทึกและซิงค์ข้อมูลกลับขึ้นสู่ระบบเว็บเสมอ ตามขั้นตอนดังนี้:**

1. **แก้ไขที่ Single Source of Truth (`Story Section/`) เท่านั้น**:
   - ห้ามแก้ไขไฟล์ในโฟลเดอร์ `MarkDownNovelReader/data/` โดยตรง
   - ให้แก้ไขในโฟลเดอร์ `Story Section/` ตามหมวดหมู่:
     - ตอนนิยาย ➔ `Story Section/Chapters/`
     - ข้อมูลโลกและเทคโนโลยี ➔ `Story Section/Lore/`
     - ตัวละคร ➔ `Story Section/Characters/`
     - สัตว์อสูร ➔ `Story Section/Creature/`
     - โครงเรื่อง ➔ `Story Section/Plot_Structure/`

2. **รันคำสั่งซิงค์ข้อมูลลงสู่หน้าเว็บ**:
   - รันคำสั่ง Batch Script:
     ```bash
     cmd.exe /c "d:\Dorea Pricese Journey\sync_to_reader.bat"
     ```
   - สคริปต์นี้จะคัดลอกไฟล์ทั้งหมด, Rebuild `embedded_data.js`, และรัน `build_ai_index.py` เพื่ออัปเดต `llms.txt`, `llms-full.txt`, `ai_index.json` และ `search_index.json` ให้อัตโนมัติในขั้นตอนเดียว

3. **อัปเดตดัชนีสารบัญ (กรณีเพิ่มบทใหม่)**:
   - หากสร้างบทใหม่ (เช่น `Chapter_08...` หรือ `SideStory_03...`) ให้เพิ่มรายการชื่อไฟล์และชื่อตอนลงใน `MarkDownNovelReader/data/chapters.json` และ `FALLBACK_CHAPTERS` ใน `MarkDownNovelReader/js/reader.js` ด้วยเสมอ

4. **ตรวจสอบและส่งมอบงานพร้อมลิงก์**:
   - เมื่อซิงค์เสร็จแล้ว ให้แจ้งผลสรุปการแก้ไข พร้อมส่งลิงก์ Deep Link ให้ผู้ใช้งานเข้าถึงข้อมูลได้ทันที เช่น `/?chapter=<ชื่อไฟล์.md>` หรือ `/?q=<คำค้น>`

---

## 3. มาตรฐานการเรียกชื่อและคำศัพท์ (Official Naming Conventions)

- **ชื่อตัวเอกหญิง**: **"โดเรีย" (Dorea)** เท่านั้น ห้ามแปลงเป็นชื่ออื่น
- **ชื่อตัวเอกชาย**: **"ธาร์" (Thar Evancross)**
- **ชื่อเผ่าพันธุ์อย่างเป็นทางการ**:
  - มนุษย์ ➔ **ชาวเอร่า / เอร่า (Aera / Aeran)**
  - มนุษย์มังกร ➔ **ดราโกนอยด์ (Dragonoid)**
  - ครึ่งสัตว์ ➔ **บีสต์คิน (Beastkin)**
  - จักรกล/หุ่นยนต์ ➔ **ออโตมาตา (Automata)**
  - เผ่านกหรือภูต ➔ **ซิลวาน (Sylvan)**
- **เทคโนโลยีต้านแรงโน้มถ่วง**: **ATKD (Aether-Thigh Kinetic Drive)**
- **ภัยคุกคามมิติ**: **รอยแยกมิติ (Dimensional Rift)**
