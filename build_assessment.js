const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat
} = require('docx');
const fs = require('fs');

// ── THEME ───────────────────────────────────────────────────────
const PRI = "1E3A6E";   // dark blue
const ACC = "E8571A";   // orange
const LBLUE = "DCE8F8"; // light blue fill
const LORANGE = "FDF0E6";
const LGRAY = "F4F6F9";
const GREEN = "1A6B3C";
const LGREEN = "E8F5EE";
const YELLOW = "FFF8DC";
const MID = "8E9BB5";
const DARK = "2D3748";

const FONT = "Cordia New";
const BS = 26;   // 13pt body
const HS1 = 36;  // 18pt h1
const HS2 = 30;  // 15pt h2
const HS3 = 28;  // 14pt h3
const SM = 22;   // 11pt small

// A4 portrait, 1-inch margins → content width = 11906-2880 = 9026
const CW = 9026;

// ── LOW-LEVEL HELPERS ───────────────────────────────────────────
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const bd = (c="BBBBBB", sz=4) => ({ style: BorderStyle.SINGLE, size: sz, color: c });
const bds = (c="BBBBBB", sz=4) => ({ top:bd(c,sz), bottom:bd(c,sz), left:bd(c,sz), right:bd(c,sz) });
const noBds = { top:NB, bottom:NB, left:NB, right:NB };

function T(text, o={}) {
  return new TextRun({ text, font:FONT, size:o.size||BS, bold:o.bold, color:o.color, italics:o.it, underline:o.ul?{}:undefined });
}

function P(content, o={}) {
  let children;
  if (typeof content === 'string') children = [T(content, o)];
  else if (Array.isArray(content)) children = content;
  else children = [content];
  return new Paragraph({
    children,
    alignment: o.align,
    spacing: { before: o.before!==undefined?o.before:80, after: o.after!==undefined?o.after:80, line: o.line||276 },
    indent: o.left ? { left: o.left } : undefined,
    border: o.border,
    shading: o.fill ? { fill: o.fill, type: ShadingType.CLEAR } : undefined,
    pageBreakBefore: o.pgBreak,
  });
}

function line(label="", w=CW) {
  return new Paragraph({
    children: [T(label+" ", { size: BS, color:"555555" })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color:"AAAAAA", space: 2 } },
    spacing: { before: 60, after: 160 },
  });
}

function lines(n=3) {
  return Array.from({length:n}, () => new Paragraph({
    children: [T(" ")],
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color:"AAAAAA", space: 2 } },
    spacing: { before: 20, after: 160 },
  }));
}

function TC(content, o={}) {
  const children = Array.isArray(content) ? content :
    [P(typeof content==='string'?content:'', { size:o.size||BS, bold:o.bold, align:o.align, color:o.color, it:o.it })];
  return new TableCell({
    width: o.w ? { size:o.w, type:WidthType.DXA } : undefined,
    columnSpan: o.span,
    rowSpan: o.rSpan,
    verticalAlign: o.vAlign||VerticalAlign.TOP,
    borders: o.noBd ? noBds : bds(o.bc||"BBBBBB", o.bsz||4),
    shading: o.fill ? { fill:o.fill, type:ShadingType.CLEAR } : undefined,
    margins: { top:90, bottom:90, left:130, right:130 },
    children,
  });
}

function TR(cells, o={}) {
  return new TableRow({ children: cells, tableHeader: o.hdr, cantSplit: o.noSplit });
}

function TBL(rows, widths) {
  return new Table({
    width: { size:CW, type:WidthType.DXA },
    columnWidths: widths,
    rows,
  });
}

// ── SECTION HEADER ──────────────────────────────────────────────
function secHdr(num, title, sub, hint) {
  const items = [
    P([
      T("PART "+num+"   ", { bold:true, size:HS2, color:"FFFFFF" }),
      T(title, { bold:true, size:HS2, color:"FFFFFF" }),
      ...(hint ? [T("   ⏱ "+hint, { size:SM, color:"FFD580" })] : []),
    ], { fill:PRI, before:300, after:0, left:180,
         border:{ bottom:{ style:BorderStyle.SINGLE, size:10, color:ACC, space:0 } } }),
    sub ? P(sub, { fill:LBLUE, before:0, after:200, left:180, size:SM, color:"444444", it:true }) :
          P(" ", { before:0, after:100 }),
  ];
  return items;
}

// ── SKILL TABLE BUILDER ─────────────────────────────────────────
function skillTable(skills) {
  const W = [2600, 1300, 4400, 726]; // name | level | evidence | dev?
  const headerRow = TR([
    TC("ทักษะ / Skill", { w:W[0], fill:PRI, bold:true, color:"FFFFFF", align:AlignmentType.CENTER, bc:PRI }),
    TC("ระดับ\n(วงกลมที่เลือก)", { w:W[1], fill:PRI, bold:true, color:"FFFFFF", align:AlignmentType.CENTER, bc:PRI }),
    TC("ตัวอย่าง / หลักฐานที่แสดงว่าใช้ทักษะนี้\n(ระบุงานจริง สถานการณ์ ผลลัพธ์)", { w:W[2], fill:PRI, bold:true, color:"FFFFFF", align:AlignmentType.CENTER, bc:PRI }),
    TC("ต้องพัฒนา?\n(วงกลม)", { w:W[3], fill:PRI, bold:true, color:"FFFFFF", align:AlignmentType.CENTER, bc:PRI }),
  ], { hdr:true });

  const subHdr = TR([
    TC("", { w:W[0], fill:LGRAY }),
    TC([P([T("1  2  3  4  5", { size:SM, color:"777777", it:true })], { align:AlignmentType.CENTER, before:0, after:0 })],
       { w:W[1], fill:LGRAY }),
    TC("", { w:W[2], fill:LGRAY }),
    TC([P([T("Y  /  N", { size:SM, color:"777777", it:true })], { align:AlignmentType.CENTER, before:0, after:0 })],
       { w:W[3], fill:LGRAY }),
  ]);

  const dataRows = skills.map(s => TR([
    TC([
      P(s.name, { bold:true, size:BS }),
      P(s.desc, { size:SM, color:"666666", before:0, after:0, it:true }),
    ], { w:W[0] }),
    TC([P([T("1   2   3   4   5", { size:SM })], { align:AlignmentType.CENTER })],
       { w:W[1], vAlign:VerticalAlign.CENTER }),
    TC([P(" ", { before:0, after:120 }), P(" ", { before:0, after:120 })], { w:W[2] }),
    TC([P([T("Y  /  N", { size:SM })], { align:AlignmentType.CENTER })],
       { w:W[3], vAlign:VerticalAlign.CENTER }),
  ]));

  return TBL([headerRow, subHdr, ...dataRows], W);
}

// ── SKILL DATA ──────────────────────────────────────────────────
const HRS = [
  { name:"Recruitment & Selection", desc:"การสรรหา คัดเลือก สัมภาษณ์ และตัดสินใจรับพนักงาน" },
  { name:"Payroll & Tax", desc:"การประมวลผลเงินเดือน ภาษี กองทุน และค่าตอบแทน" },
  { name:"Learning & Development", desc:"TNA, ออกแบบหลักสูตร จัด Training และวัดผล" },
  { name:"Compensation & Benefits", desc:"ออกแบบโครงสร้างค่าตอบแทน สวัสดิการ และ C&B Survey" },
  { name:"HRIS / HR Systems", desc:"ระบบ HR, Master Data, Workflow, การออกรายงาน" },
  { name:"Employee Relations", desc:"แรงงานสัมพันธ์ Grievance, Discipline, Welfare" },
  { name:"Organization Development", desc:"วัฒนธรรมองค์กร Engagement, Change Management" },
  { name:"HR Strategy & Planning", desc:"กลยุทธ์ HR, Workforce Planning, HR Business Partner" },
];
const DIGS = [
  { name:"Excel / Google Sheets", desc:"วิเคราะห์ข้อมูล Pivot, VLOOKUP, Dashboard" },
  { name:"Power BI / Data Visualization", desc:"สร้าง Dashboard, รายงาน, Data Storytelling" },
  { name:"Google Workspace", desc:"Docs, Slides, Forms, Meet, Drive, Apps Script" },
  { name:"AI Tools (Claude / ChatGPT)", desc:"Prompt Engineering, Automation, Content Generation" },
  { name:"HR Analytics", desc:"People Data, Attrition Prediction, Workforce Insights" },
  { name:"HR Software Systems", desc:"SAP, Workday, Tiger Soft, หรือระบบ HRIS อื่น" },
];
const SOFTS = [
  { name:"Communication", desc:"พูด เขียน นำเสนอ ทั้ง Formal และ Informal" },
  { name:"Leadership & Influence", desc:"นำทีม โน้มน้าว สร้างแรงบันดาลใจ" },
  { name:"Project Management", desc:"วางแผน ติดตาม บริหารเวลาและทรัพยากร" },
  { name:"Analytical Thinking", desc:"คิดวิเคราะห์ แก้ปัญหา ตัดสินใจด้วยข้อมูล" },
  { name:"Teamwork & Collaboration", desc:"ทำงานร่วมกับผู้อื่น สร้างความไว้ใจ" },
  { name:"Adaptability & Resilience", desc:"ยืดหยุ่น รับมือความเปลี่ยนแปลง ฟื้นตัวเร็ว" },
];

// ── QUAL QUESTION ────────────────────────────────────────────────
function qualQ(num, label, question, hint, lineCount=4) {
  return [
    P([
      T("Q"+num+"  ", { bold:true, size:HS3, color:ACC }),
      T(label, { bold:true, size:HS3, color:DARK }),
    ], { before:200, after:0 }),
    P(question, { fill:LBLUE, before:0, after:0, left:180, size:BS, color:"1E3A6E", bold:true }),
    P("💡 แนวทาง: "+hint, { before:0, after:100, left:180, size:SM, color:"555555", it:true }),
    ...lines(lineCount),
  ];
}

// ── AI FIELD ─────────────────────────────────────────────────────
function aiField(label, hint, lineCount=3) {
  return [
    P([T("▸ "+label, { bold:true, size:BS, color:PRI })], { before:140, after:0 }),
    P(hint, { before:0, after:60, left:200, size:SM, color:"666666", it:true }),
    ...lines(lineCount),
  ];
}

// ════════════════════════════════════════════════════════════════
// BUILD DOCUMENT
// ════════════════════════════════════════════════════════════════
const doc = new Document({
  styles: {
    default: { document: { run: { font:FONT, size:BS } } },
    paragraphStyles: [
      { id:"Normal", name:"Normal", run:{ font:FONT, size:BS } },
    ],
  },
  numbering: {
    config: [
      { reference:"bullets", levels:[{ level:0, format:LevelFormat.BULLET, text:"•",
          alignment:AlignmentType.LEFT, style:{ paragraph:{ indent:{ left:360, hanging:180 } } } }] },
      { reference:"nums", levels:[{ level:0, format:LevelFormat.DECIMAL, text:"%1.",
          alignment:AlignmentType.LEFT, style:{ paragraph:{ indent:{ left:360, hanging:180 } } } }] },
    ],
  },
  sections: [
    {
      // ── Section 1: PARTS 1–5 ────────────────────────────────
      properties: {
        page: {
          size: { width:11906, height:16838 }, // A4
          margin: { top:1080, right:1080, bottom:1080, left:1080 }, // ~0.75 inch margins
        },
      },
      headers: {
        default: new Header({
          children: [
            TBL([
              TR([
                TC([P([T("แบบประเมินตนเอง — HR KM Workshop", { bold:true, size:22, color:PRI })], { before:0, after:0 })],
                   { w:6500, noBd:true }),
                TC([P([T("Impact Exhibition Management Co., Ltd.  |  Corp.HR", { size:20, color:"666666", it:true })], { align:AlignmentType.RIGHT, before:0, after:0 })],
                   { w:2526, noBd:true }),
              ])
            ], [6500, 2526]),
            new Paragraph({
              border: { bottom:{ style:BorderStyle.SINGLE, size:8, color:ACC, space:1 } },
              spacing: { before:0, after:100 },
              children:[],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              border: { top:{ style:BorderStyle.SINGLE, size:4, color:"CCCCCC", space:2 } },
              spacing: { before:60, after:0 },
              children: [
                T("Corp.HR Knowledge Management  |  Impact  ", { size:18, color:"999999" }),
                T("                                                                          ", { size:18 }),
                T("หน้า ", { size:18, color:"999999" }),
                new TextRun({ children:[PageNumber.CURRENT], font:FONT, size:18, color:"999999" }),
              ],
            }),
          ],
        }),
      },
      children: [
        // ══ COVER BLOCK ══════════════════════════════════════════
        P([
          T("แบบประเมินตนเอง", { bold:true, size:52, color:"FFFFFF" }),
        ], { fill:PRI, align:AlignmentType.CENTER, before:200, after:0,
             border:{ bottom:{ style:BorderStyle.SINGLE, size:12, color:ACC, space:0 } } }),
        P([
          T("HR Knowledge Management Workshop", { bold:true, size:32, color:"FFFFFF" }),
        ], { fill:PRI, align:AlignmentType.CENTER, before:0, after:0 }),
        P([
          T("Impact Exhibition Management Co., Ltd.  ·  ฝ่ายบริหารทรัพยากรบุคคล", { size:24, color:"FFD580" }),
        ], { fill:PRI, align:AlignmentType.CENTER, before:0, after:200 }),

        // Info row
        TBL([
          TR([
            TC([
              P([T("วันที่: ", { bold:true, size:BS }), T("_______________________", { size:BS, color:MID })], { before:0, after:60 }),
              P([T("เวลา: ", { bold:true, size:BS }), T("_______ น.  ถึง  _______ น.", { size:BS, color:MID })], { before:0, after:0 }),
            ], { w:4500, fill:LGRAY }),
            TC([
              P([T("เวลาที่มี: ", { bold:true, size:BS, color:ACC }), T("30 นาที", { bold:true, size:BS, color:ACC })], { before:0, after:40 }),
              P([T("⚠️ กรุณาตอบให้เสร็จทุก PART และซื่อสัตย์กับตนเองมากที่สุด", { size:SM, color:"555555", it:true })], { before:0, after:0 }),
            ], { w:4526, fill:YELLOW }),
          ])
        ], [4500, 4526]),

        P(" ", { before:100, after:100 }),

        // ══ PART 1: PERSONAL INFO ════════════════════════════════
        ...secHdr(1, "ข้อมูลพื้นฐาน", "กรอกให้ครบ — ข้อมูลส่วนนี้จะถูกนำเข้าสู่ระบบ KM", "3 นาที"),

        TBL([
          TR([
            TC("ชื่อ-นามสกุล", { w:1500, fill:LBLUE, bold:true }),
            TC([line(""), P(" ",{before:0,after:0})], { w:3012 }),
            TC("ชื่อเล่น", { w:1000, fill:LBLUE, bold:true }),
            TC([line("")], { w:3514 }),
          ]),
          TR([
            TC("ตำแหน่งงาน", { w:1500, fill:LBLUE, bold:true }),
            TC([line(""), P(" ",{before:0,after:0})], { w:3012 }),
            TC("ประสบการณ์ HR", { w:1000, fill:LBLUE, bold:true }),
            TC([line("_______ ปี")], { w:3514 }),
          ]),
          TR([
            TC("หน้าที่หลักปัจจุบัน", { w:1500, fill:LBLUE, bold:true }),
            TC([line(""), P(" ",{before:0,after:0})], { w:7526, span:3 }),
          ]),
          TR([
            TC("ระดับตำแหน่ง", { w:1500, fill:LBLUE, bold:true }),
            TC([
              P([
                T("⬜ Officer  ", { size:BS }), T("⬜ Senior/Specialist  ", { size:BS }),
                T("⬜ Supervisor/AM  ", { size:BS }), T("⬜ Manager  ", { size:BS }), T("⬜ Sr.Manager/Director", { size:BS }),
              ], { before:0, after:0 }),
            ], { w:7526, span:3 }),
          ]),
          TR([
            TC("จุดเด่นตัวเองในทีม\n(ฉันมีคุณค่าต่อทีมด้านใด)", { w:1500, fill:LBLUE, bold:true }),
            TC([line(""), line(""), P(" ",{before:0,after:0})], { w:7526, span:3 }),
          ]),
        ], [1500, 3012, 1000, 3514]),

        P(" ", { before:100, after:0 }),

        // ══ PART 2: SKILL ASSESSMENT ═════════════════════════════
        ...secHdr(2, "ประเมิน Skill ตนเอง", "วงกลมระดับที่ใกล้เคียงที่สุด แล้วเขียนตัวอย่างงานจริงในช่องขวา — ต้องมีหลักฐาน ไม่ใช่แค่ความรู้สึก", "8 นาที"),

        P([
          T("เกณฑ์: ", { bold:true, size:SM }),
          T("1 = เพิ่งเริ่ม/ได้ยินมา   ", { size:SM, color:"CC3333" }),
          T("2 = พอรู้/เคยทำบ้าง   ", { size:SM, color:"CC6600" }),
          T("3 = ทำได้เองสม่ำเสมอ   ", { size:SM, color:"1A5276" }),
          T("4 = ชำนาญ/สอนคนอื่นได้   ", { size:SM, color:"1A6B3C" }),
          T("5 = เชี่ยวชาญ/ผู้เชี่ยวชาญ", { size:SM, color:"553C9A" }),
        ], { fill:YELLOW, before:0, after:120, left:120 }),

        P([T("🏢  HR Functional Skills", { bold:true, size:HS3, color:PRI })], { before:140, after:80 }),
        skillTable(HRS),

        P([T("💻  Digital & Technology Skills", { bold:true, size:HS3, color:PRI })], { before:240, after:80 }),
        skillTable(DIGS),

        P([T("🌟  Soft Skills & Competencies", { bold:true, size:HS3, color:PRI })], { before:240, after:80 }),
        skillTable(SOFTS),

        P(" ", { before:100, after:0 }),

        // ══ PART 3: QUALITATIVE ═══════════════════════════════════
        ...secHdr(3, "คำถามเชิงคุณภาพ (Deep Dive)", "ตอบอย่างละเอียดและเจาะจง — ยิ่งมีตัวอย่างงานจริง ยิ่งมีคุณค่า ใช้หลัก STAR (Situation→Task→Action→Result)", "12 นาที"),

        P([
          T("📌 STAR Method: ", { bold:true, size:SM, color:PRI }),
          T("S = สถานการณ์คืออะไร  ·  T = หน้าที่ของคุณคืออะไร  ·  A = คุณทำอะไร  ·  R = ผลลัพธ์ที่ได้", { size:SM, color:"555555" }),
        ], { fill:LBLUE, before:0, after:200, left:120 }),

        ...qualQ(1, "งานที่คุณทำได้ดีที่สุด", "งานหรือโครงการใดที่คุณภูมิใจที่สุดในชีวิตการทำงาน HR? คุณทำอะไร ผลลัพธ์คืออะไร และทำไมถึงสำเร็จ?", "ระบุชื่อโครงการ/งาน + บทบาทของคุณ + ผลลัพธ์ที่วัดได้ (ตัวเลข เวลา เปอร์เซ็นต์)", 5),

        ...qualQ(2, "สถานการณ์ท้าทายที่สุด", "เล่าสถานการณ์ที่ยากหรือท้าทายที่สุดที่เคยจัดการ และคุณผ่านมันมาได้อย่างไร?", "ระบุ: สถานการณ์คืออะไร → คุณต้องทำอะไร → คุณเลือกทำอะไร → ผลที่ได้ และบทเรียน", 5),

        ...qualQ(3, "ทักษะที่คุณภูมิใจที่สุด", "ทักษะหรือความสามารถใดที่คุณคิดว่าเก่งจริง และมีหลักฐานอะไรยืนยัน?", "อย่าแค่บอกว่า 'ฉันสื่อสารเก่ง' — บอกว่าเคยสื่อสารกับใคร เรื่องอะไร ผลคืออะไร", 4),

        ...qualQ(4, "ทักษะที่คุณยังขาดและต้องการพัฒนา", "ทักษะใดที่คุณรู้ว่าตนเองยังไม่แข็งพอ หรือที่ผู้อื่น Feedback มาว่าต้องพัฒนา?", "ซื่อสัตย์กับตนเอง — ระบุทักษะชัดๆ + เหตุผลที่คิดว่ายังขาด + ผลกระทบต่องาน", 4),

        ...qualQ(5, "วิธีที่คุณสร้างคุณค่าให้ทีม", "คุณทำให้ทีม HR และองค์กรดีขึ้นอย่างไร? สิ่งที่คุณทำแตกต่างจากคนอื่นในทีมอย่างไร?", "ระบุสิ่งที่คุณทำเป็นประจำที่ทำให้ทีมหรืองานดีขึ้น — ทั้งที่เห็นได้ชัดและที่คนอื่นอาจมองข้าม", 4),

        ...qualQ(6, "แผนพัฒนาตนเองใน 12 เดือน", "ถ้าคุณมี 1 ปีเต็มเพื่อพัฒนาตนเอง คุณจะโฟกัสที่ทักษะใด เหตุผลคืออะไร และจะทำอย่างไร?", "ระบุ: ทักษะที่อยากพัฒนา + เหตุผล (งาน/อาชีพ) + วิธีที่จะทำ + วิธีวัดว่าสำเร็จ", 4),

        P(" ", { before:100, after:0 }),

        // ══ PART 4: SKILL MAP ═════════════════════════════════════
        ...secHdr(4, "Skill Map ของฉัน", "สรุปภาพรวม Skill ที่มีและที่ขาด — ส่วนนี้จะนำเข้าระบบ KM โดยตรง", "3 นาที"),

        TBL([
          TR([
            TC("💪 ทักษะที่มีแล้ว — Top 3\n(ระดับ 4–5 ที่มีหลักฐานยืนยัน)", { w:2500, fill:LGREEN, bold:true, bc:GREEN }),
            TC([
              P([T("1. ", { bold:true }), T("_________________________________", { color:MID })], { before:0, after:120 }),
              P([T("2. ", { bold:true }), T("_________________________________", { color:MID })], { before:0, after:120 }),
              P([T("3. ", { bold:true }), T("_________________________________", { color:MID })], { before:0, after:0 }),
            ], { w:6526, bc:GREEN }),
          ]),
          TR([
            TC("🔧 ทักษะที่ต้องพัฒนา — Top 3\n(ระดับ 1–2 หรือที่กระทบงาน)", { w:2500, fill:"FDEBD0", bold:true, bc:ACC }),
            TC([
              P([T("1. ", { bold:true }), T("_________________________________", { color:MID })], { before:0, after:120 }),
              P([T("2. ", { bold:true }), T("_________________________________", { color:MID })], { before:0, after:120 }),
              P([T("3. ", { bold:true }), T("_________________________________", { color:MID })], { before:0, after:0 }),
            ], { w:6526, bc:ACC }),
          ]),
          TR([
            TC("📅 แผน 3 เดือนข้างหน้า\n(ฉันจะพัฒนา Skill ใด ด้วยวิธีใด)", { w:2500, fill:LBLUE, bold:true, bc:PRI }),
            TC([line(""), line(""), P(" ",{before:0,after:0})], { w:6526, bc:PRI }),
          ]),
        ], [2500, 6526]),

        P(" ", { before:100, after:0 }),

        // ══ PART 5: 1-SENTENCE SUMMARY ═══════════════════════════
        ...secHdr(5, "ประโยคสรุปตัวเอง 1 ประโยค", "เตรียมพูดในกลุ่ม — แชร์ให้ทุกคนฟัง ใช้เวลาไม่เกิน 30 วินาทีต่อคน", "2 นาที"),

        P([
          T("เขียน 1 ประโยคที่บอกว่าคุณคือใคร จุดแข็งของคุณคืออะไร และคุณกำลังพัฒนาตัวเองในด้านใด", { size:BS, color:"333333" }),
        ], { fill:YELLOW, before:0, after:120, left:120 }),

        P([
          T("Template: ", { bold:true, size:BS, color:PRI }),
          T('"ฉัน [ชื่อ] มีความเชี่ยวชาญด้าน [ทักษะเด่น 1-2 ด้าน] ', { size:BS, color:"555555", it:true }),
          T("และกำลังพัฒนาตนเองใน [สิ่งที่ต้องการเติบโต] ", { size:BS, color:"555555", it:true }),
          T('เพื่อ [เป้าหมาย]"', { size:BS, color:"555555", it:true }),
        ], { before:0, after:120, left:120 }),

        ...lines(2),

        P([T("📢 ประโยคที่จะพูดในกลุ่ม (เขียนให้ชัดและมั่นใจ):", { bold:true, size:BS, color:PRI })], { before:140, after:60 }),
        ...lines(3),

        new Paragraph({ children:[new PageBreak()], spacing:{ before:0, after:0 } }),

        // ══ PART 6: AI TRAINING TEMPLATE ══════════════════════════
        ...secHdr(6, "AI Personal Assistant Training Template", "กรอกข้อมูลส่วนนี้ให้ครบถ้วน — ใช้สำหรับ 'สอน' AI ให้เป็นผู้ช่วยส่วนตัวที่รู้จักคุณ", "เอากลับบ้าน"),

        P([
          T("🤖 วิธีใช้: ", { bold:true, size:BS, color:PRI }),
          T("เมื่อกรอกครบแล้ว → คัดลอกทั้งหมด → วางใน Claude หรือ ChatGPT เป็น ", { size:BS, color:"333333" }),
          T("System Prompt หรือ First Message ", { bold:true, size:BS, color:ACC }),
          T("AI จะจดจำบริบทของคุณและช่วยงานได้อย่างตรงจุด", { size:BS, color:"333333" }),
        ], { fill:LBLUE, before:0, after:200, left:120 }),

        // A: Profile
        P([T("A  บุคลิกและสไตล์การทำงาน", { bold:true, size:HS3, color:"FFFFFF" })],
          { fill:PRI, before:200, after:0, left:180 }),
        P([T("บอก AI ให้รู้จักตัวตน บุคลิก และวิธีที่คุณทำงาน", { size:SM, color:"444444", it:true })],
          { fill:LBLUE, before:0, after:100, left:180 }),
        ...aiField("ฉันเป็นคนแบบไหน?", "เช่น ชอบวางแผนล่วงหน้า, ทำงานตามข้อมูล, ชอบ brainstorm ก่อนลงมือ, เน้น process", 2),
        ...aiField("สไตล์การสื่อสารของฉัน", "เช่น ชอบตรงประเด็น, ชอบอธิบายด้วยตัวอย่าง, ชอบ bullet point, ชอบ visual", 2),
        ...aiField("สิ่งที่ทำให้ฉันทำงานได้ดีที่สุด", "เช่น งานที่ต้องคิดเยอะ, งานที่มีผลกระทบชัดเจน, งานที่ได้ช่วยคน", 2),

        // B: Role
        P([T("B  บทบาทและความรับผิดชอบ", { bold:true, size:HS3, color:"FFFFFF" })],
          { fill:PRI, before:200, after:0, left:180 }),
        P([T("บอก AI ว่าคุณทำอะไรในแต่ละวัน ใครคือ Stakeholder และเป้าหมายของงานคืออะไร", { size:SM, color:"444444", it:true })],
          { fill:LBLUE, before:0, after:100, left:180 }),
        ...aiField("ตำแหน่งและหน้าที่หลักของฉัน", "ระบุตำแหน่ง บริษัท ทีม และงานที่รับผิดชอบหลัก", 3),
        ...aiField("Stakeholder หลักที่ฉันทำงานด้วย", "เช่น CEO, Line Managers, พนักงาน, ทีม HR, Finance, Vendor", 2),
        ...aiField("KPI / ตัวชี้วัดความสำเร็จของฉัน", "งานที่ผู้บังคับบัญชาวัดว่าคุณทำได้ดีหรือไม่", 2),

        // C: Expertise
        P([T("C  ทักษะและความเชี่ยวชาญ", { bold:true, size:HS3, color:"FFFFFF" })],
          { fill:PRI, before:200, after:0, left:180 }),
        P([T("บอก AI ว่าคุณรู้อะไรบ้าง เพื่อให้ AI ไม่อธิบายสิ่งที่คุณรู้อยู่แล้ว และเสริมในสิ่งที่คุณยังขาด", { size:SM, color:"444444", it:true })],
          { fill:LBLUE, before:0, after:100, left:180 }),
        ...aiField("สิ่งที่ฉันรู้ดีมาก (ไม่ต้องอธิบายพื้นฐาน)", "เช่น Labor Law, Payroll Calculation, Recruitment Process, HRIS", 2),
        ...aiField("สิ่งที่ฉันอยากเรียนรู้เพิ่มเติม (ให้ AI ช่วยอธิบายและแนะนำ)", "เช่น HR Analytics, AI Tools, OD Frameworks, Data Visualization", 2),
        ...aiField("เครื่องมือ/ระบบที่ฉันใช้ประจำ", "เช่น Google Workspace, Tiger Soft, Excel, Power BI — AI จะช่วยได้ตรงกับสิ่งที่ใช้", 2),

        // D: Daily Tasks
        P([T("D  งานที่ทำประจำและขั้นตอนการทำงาน", { bold:true, size:HS3, color:"FFFFFF" })],
          { fill:PRI, before:200, after:0, left:180 }),
        P([T("ยิ่งบอกรายละเอียด ยิ่งทำให้ AI ช่วยได้ตรงและลึกขึ้น", { size:SM, color:"444444", it:true })],
          { fill:LBLUE, before:0, after:100, left:180 }),
        ...aiField("งานที่ทำทุกวัน (Daily tasks)", "เช่น ตรวจ Leave Request, ตอบ Email พนักงาน, Update HRIS", 2),
        ...aiField("งานที่ทำทุกเดือน (Monthly tasks)", "เช่น ปิด Payroll, ทำ Report, จัด Training, ประชุม HR Review", 2),
        ...aiField("งานที่ต้องการให้ AI ช่วยมากที่สุด", "เช่น เขียน Email, Draft Policy, วิเคราะห์ข้อมูล, แปล, สรุปประชุม, ร่างสไลด์", 3),

        // E: Challenges
        P([T("E  ปัญหาและความท้าทายในงาน", { bold:true, size:HS3, color:"FFFFFF" })],
          { fill:PRI, before:200, after:0, left:180 }),
        P([T("บอก AI ว่าคุณติดปัญหาอะไร เพื่อให้ช่วยแก้ได้ตรงจุด", { size:SM, color:"444444", it:true })],
          { fill:LBLUE, before:0, after:100, left:180 }),
        ...aiField("งานที่ใช้เวลามากแต่สามารถลดได้ด้วย AI", "เช่น เขียนเอกสารซ้ำๆ, หาข้อมูล, สร้าง Template, สรุปข้อมูล", 2),
        ...aiField("ความท้าทายหลักในงานตอนนี้", "ปัญหาที่คุณกำลังเจออยู่และอยากได้ความช่วยเหลือ", 2),

        // F: AI Preferences
        P([T("F  วิธีที่ต้องการให้ AI ช่วยเหลือ", { bold:true, size:HS3, color:"FFFFFF" })],
          { fill:PRI, before:200, after:0, left:180 }),
        P([T("บอก AI ว่าคุณต้องการให้ตอบแบบไหน เพื่อให้ผลลัพธ์ตรงกับความต้องการ", { size:SM, color:"444444", it:true })],
          { fill:LBLUE, before:0, after:100, left:180 }),
        ...aiField("รูปแบบคำตอบที่ชอบ", "เช่น สั้นตรงประเด็น / อธิบายละเอียด / แบบ bullet / แบบ table / แบบ draft ที่แก้ต่อได้เลย", 2),
        ...aiField("ภาษาที่ต้องการให้ใช้", "เช่น ไทย, อังกฤษ, หรือ ไทย-อังกฤษผสม สำหรับงานแบบไหน", 2),
        ...aiField("สิ่งที่ไม่ต้องการให้ AI ทำ", "เช่น อย่าอธิบายสิ่งที่รู้อยู่แล้ว, อย่าตอบยาวเกินไป, อย่า assume", 2),

        // G: Complete Prompt Template
        P([T("G  System Prompt Template — คัดลอกไปใช้งานได้เลย", { bold:true, size:HS3, color:"FFFFFF" })],
          { fill:GREEN, before:300, after:0, left:180,
            border:{ bottom:{ style:BorderStyle.SINGLE, size:8, color:"FFD700", space:0 } } }),
        P([T("📋 วิธีใช้: เปิด Claude.ai หรือ ChatGPT → เริ่ม conversation ใหม่ → พิมพ์ข้อความด้านล่างเป็นข้อความแรก (แก้ไขข้อมูลในวงเล็บ [ ] ให้ครบก่อน)", { size:SM, color:"FFFFFF" })],
          { fill:GREEN, before:0, after:200, left:180 }),

        TBL([
          TR([
            TC([
              P("คัดลอก Template นี้ → แก้ไขในวงเล็บ [ ] → วางใน Claude/ChatGPT เป็นข้อความแรก", { size:SM, bold:true, color:PRI }),
              P(" ", { before:0, after:60 }),
              P('สวัสดี ก่อนที่เราจะเริ่มทำงานด้วยกัน ฉันอยากให้คุณรู้จักฉันก่อน', { size:BS }),
              P(" ", { before:0, after:40 }),
              P('ฉันชื่อ [ชื่อ-ชื่อเล่น] ทำงานเป็น [ตำแหน่ง] ที่ [บริษัท] ฝ่าย HR', { size:BS }),
              P('มีประสบการณ์ด้าน HR [X] ปี ความรับผิดชอบหลักของฉันคือ [งานหลัก]', { size:BS }),
              P(" ", { before:0, after:40 }),
              P('ทักษะที่ฉันชำนาญ: [ทักษะ 1], [ทักษะ 2], [ทักษะ 3]', { size:BS }),
              P('ทักษะที่ฉันกำลังพัฒนา: [ทักษะที่อยากเก่งขึ้น]', { size:BS }),
              P('เครื่องมือที่ใช้ประจำ: [Excel/Google Workspace/HRIS System/ฯลฯ]', { size:BS }),
              P(" ", { before:0, after:40 }),
              P('สไตล์การทำงาน: [อธิบายบุคลิกสั้นๆ เช่น ชอบข้อมูล ชอบระบบ ชอบช่วยคน]', { size:BS }),
              P('ฉันต้องการให้คุณตอบ: [สั้น/ละเอียด/เป็น bullet/เป็น table/ฯลฯ]', { size:BS }),
              P('ภาษาที่ต้องการ: [ไทย/อังกฤษ/ผสม]', { size:BS }),
              P(" ", { before:0, after:40 }),
              P('งานที่อยากให้ช่วยบ่อยที่สุด:', { size:BS, bold:true }),
              P('- [งาน 1 เช่น เขียน Email ภาษาอังกฤษ]', { size:BS }),
              P('- [งาน 2 เช่น วิเคราะห์ข้อมูล HR]', { size:BS }),
              P('- [งาน 3 เช่น ร่าง Policy หรือ SOP]', { size:BS }),
              P(" ", { before:0, after:40 }),
              P('ข้อมูลเพิ่มเติมที่อยากให้รู้:', { size:BS, bold:true }),
              P('[เช่น บริษัทมีพนักงานกี่คน, ทีม HR มีกี่คน, กำลังทำโครงการอะไรอยู่]', { size:BS }),
              P(" ", { before:0, after:40 }),
              P('ขอบคุณ ตอนนี้คุณรู้จักฉันพอสมควรแล้ว — เริ่มทำงานด้วยกันได้เลย!', { size:BS }),
            ], { w:CW, fill:"F0FFF4", bc:GREEN }),
          ])
        ], [CW]),

        P(" ", { before:200, after:100 }),

        // FOOTER NOTE
        P([
          T("✅ เมื่อกรอกแบบประเมินนี้ครบแล้ว: ", { bold:true, size:SM, color:PRI }),
          T("(1) นำคะแนน Skill กรอกลงระบบ KM  (2) ใช้ Section G เป็น AI Prompt  (3) เตรียมประโยคใน PART 5 สำหรับแชร์กลุ่ม", { size:SM, color:"444444" }),
        ], { fill:YELLOW, before:100, after:0, left:120 }),
      ],
    }
  ],
});

// ── OUTPUT ───────────────────────────────────────────────────────
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('HR_Workshop_Assessment.docx', buf);
  console.log('Done: HR_Workshop_Assessment.docx');
}).catch(err => { console.error(err); process.exit(1); });
