import { jsPDF } from 'jspdf';
import { 
  StaffMember, 
  StaffCategory, 
  STAFF_CATEGORIES, 
  CATEGORY_HIERARCHY_ORDER, 
  CATEGORY_TITLE_BN 
} from '../types';

/**
 * Ensures Google Fonts (Hind Siliguri) are fully loaded before rendering on canvas.
 */
async function ensureBengaliFontLoaded(): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
      await document.fonts.load('bold 24px "Hind Siliguri"');
      await document.fonts.load('600 20px "Hind Siliguri"');
      await document.fonts.load('normal 18px "Hind Siliguri"');
    } catch {
      // Smooth fallback
    }
  }
}

/**
 * Converts English number to Bengali digits with 2-digit padding (e.g. 1 -> ০১, 12 -> ১২)
 */
export function toBanglaSerial(num: number): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const padded = String(num).padStart(2, '0');
  return padded.replace(/\d/g, (d) => bnDigits[parseInt(d, 10)]);
}

/**
 * Sorts staff members strictly by hierarchy:
 * 1. Senior Team Leader (STL) - at the very top
 * 2. Team Leader (TL)
 * 3. Senior Counselor (SC)
 * 4. Counselor (CO)
 * 5. Teacher (TR)
 * 6. Team Trainer (TT)
 * Sub-sorted by manual order or name.
 */
export function sortStaffByHierarchy(staffList: StaffMember[]): StaffMember[] {
  return [...staffList].sort((a, b) => {
    const rankA = CATEGORY_HIERARCHY_ORDER[a.category] ?? 99;
    const rankB = CATEGORY_HIERARCHY_ORDER[b.category] ?? 99;
    if (rankA !== rankB) return rankA - rankB;

    if (a.order !== undefined && b.order !== undefined && a.order !== b.order) {
      return a.order - b.order;
    }

    return a.name.localeCompare(b.name, 'bn');
  });
}

/**
 * Helper to draw a rounded rectangle on Canvas 2D context.
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill = true,
  stroke = false
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();

  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

/**
 * Truncates text with ellipsis if it exceeds the maximum allowed width in pixels.
 */
function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(truncated + '...').width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
}

// Visual element representations for smart pagination
export interface CategoryHeaderItem {
  type: 'category_header';
  category: StaffCategory;
  titleBn: string;
  shortCode: string;
  symbol: string;
  sectionSerial: string;
  memberCount: number;
  height: number;
}

export interface StaffRowItem {
  type: 'staff_row';
  staff: StaffMember;
  globalSerial: string;
  categoryShort: string;
  isEven: boolean;
  height: number;
}

export type PageRenderItem = CategoryHeaderItem | StaffRowItem;

/**
 * Builds the ordered sequence of section headers and staff rows,
 * and splits them cleanly into smartphone screen pages.
 */
export function buildPaginatedItems(staffList: StaffMember[]): PageRenderItem[][] {
  const sorted = sortStaffByHierarchy(staffList);
  const items: PageRenderItem[] = [];

  let globalCounter = 1;
  let sectionIndex = 1;

  for (const cat of STAFF_CATEGORIES) {
    const matching = sorted.filter((s) => s.category === cat);
    if (matching.length === 0) continue;

    const info = CATEGORY_TITLE_BN[cat] || { bn: cat, short: cat, symbol: '👤' };
    const sectionSerial = toBanglaSerial(sectionIndex++);

    // Add Section Header
    items.push({
      type: 'category_header',
      category: cat,
      titleBn: info.bn,
      shortCode: info.short,
      symbol: info.symbol,
      sectionSerial,
      memberCount: matching.length,
      height: 52, // Header height
    });

    // Add Staff Rows under this section
    matching.forEach((staff, rIdx) => {
      items.push({
        type: 'staff_row',
        staff,
        globalSerial: toBanglaSerial(globalCounter++),
        categoryShort: info.short,
        isEven: rIdx % 2 === 0,
        height: 56, // Row height
      });
    });
  }

  // Paginate items to fit within available screen space (1340px)
  const maxContentHeight = 1340;
  const pages: PageRenderItem[][] = [];
  let currentPage: PageRenderItem[] = [];
  let currentHeight = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // If item is a category header, check that header + at least 1 staff row can fit
    if (item.type === 'category_header') {
      const nextStaffHeight = i + 1 < items.length ? items[i + 1].height : 56;
      if (currentHeight + item.height + nextStaffHeight > maxContentHeight && currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [];
        currentHeight = 0;
      }
    } else {
      // Staff row: if it doesn't fit, start a new page
      if (currentHeight + item.height > maxContentHeight && currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [];
        currentHeight = 0;
      }
    }

    currentPage.push(item);
    currentHeight += item.height;
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages.length > 0 ? pages : [[]];
}

/**
 * Category styling themes for section headers
 */
const CATEGORY_STYLES: Record<StaffCategory, {
  gradStart: string;
  gradEnd: string;
  accent: string;
  badgeBg: string;
  badgeText: string;
}> = {
  'Senior Team Leader': {
    gradStart: '#1e1b4b',
    gradEnd: '#312e81',
    accent: '#818cf8',
    badgeBg: '#e0e7ff',
    badgeText: '#312e81',
  },
  'Team Leader': {
    gradStart: '#064e3b',
    gradEnd: '#065f46',
    accent: '#34d399',
    badgeBg: '#d1fae5',
    badgeText: '#065f46',
  },
  'Senior Counselor': {
    gradStart: '#581c87',
    gradEnd: '#6b21a8',
    accent: '#c084fc',
    badgeBg: '#f3e8ff',
    badgeText: '#6b21a8',
  },
  'Counselor': {
    gradStart: '#0c4a6e',
    gradEnd: '#075985',
    accent: '#38bdf8',
    badgeBg: '#e0f2fe',
    badgeText: '#0369a1',
  },
  'Teacher': {
    gradStart: '#7c2d12',
    gradEnd: '#9a3412',
    accent: '#fb923c',
    badgeBg: '#ffedd5',
    badgeText: '#9a3412',
  },
  'Team Trainer': {
    gradStart: '#831843',
    gradEnd: '#9d174d',
    accent: '#f472b6',
    badgeBg: '#fce7f3',
    badgeText: '#9d174d',
  },
};

/**
 * Generates an HD smartphone screen canvas (1080 x 1920) for a specific page.
 * Bengali names and text are natively shaped and rendered with high-DPI clarity.
 * Categorized by sections (STL at the top, then TL, etc.) in strict serial order.
 */
export async function generatePhoneFrameCanvas(
  staffList: StaffMember[],
  pageNumber: number,
  totalPages: number,
  pageItems: PageRenderItem[]
): Promise<HTMLCanvasElement> {
  await ensureBengaliFontLoaded();

  const canvasWidth = 1080;
  const canvasHeight = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to obtain Canvas 2D context');

  // Text antialiasing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Wallpaper Background (Soft neumorphic gradient)
  const bgGrad = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
  bgGrad.addColorStop(0, '#e2e8f0');
  bgGrad.addColorStop(1, '#f1f5f9');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 2. Outer Smartphone Body Frame (Phone Chassis)
  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.25)';
  ctx.shadowBlur = 35;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 15;
  ctx.fillStyle = '#0f172a'; // Deep slate bezel
  drawRoundedRect(ctx, 24, 24, 1032, 1872, 46, true, false);
  ctx.restore();

  // Outer Metal Rim
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, 24, 24, 1032, 1872, 46, false, true);

  // 3. Inner Screen Display (9:16 mobile viewport)
  ctx.fillStyle = '#ffffff';
  drawRoundedRect(ctx, 36, 36, 1008, 1848, 38, true, false);

  // 4. Header Card inside screen (Clean top without camera notch)
  const headerX = 56;
  const headerY = 64;
  const headerW = 968;
  const headerH = 204;

  const headerGrad = ctx.createLinearGradient(headerX, headerY, headerX + headerW, headerY + headerH);
  headerGrad.addColorStop(0, '#0f172a');
  headerGrad.addColorStop(0.55, '#1e1b4b');
  headerGrad.addColorStop(1, '#312e81');
  ctx.fillStyle = headerGrad;
  drawRoundedRect(ctx, headerX, headerY, headerW, headerH, 22, true, false);

  // Header Accent Top Bar
  ctx.fillStyle = '#6366f1';
  ctx.fillRect(headerX + 18, headerY, headerW - 36, 4);

  // Header Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px "Hind Siliguri", "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('UNITY EARNING LEARNING PLATFORM', canvasWidth / 2, headerY + 48);

  // Header Subtitle
  ctx.fillStyle = '#c7d2fe';
  ctx.font = 'bold 20px "Hind Siliguri", "Inter", sans-serif';
  ctx.fillText('OFFICIAL PAYMENT DIRECTORY & SALARY RECORDS', canvasWidth / 2, headerY + 82);

  // Bengali Sub-badge
  ctx.fillStyle = '#a5b4fc';
  ctx.font = '600 18px "Hind Siliguri", "Inter", sans-serif';
  ctx.fillText('অফিসিয়াল পদবীভিত্তিক স্টাফ ও পেমেন্ট তালিকা (ভেরিফাইড রেকর্ড)', canvasWidth / 2, headerY + 114);

  // Header Metadata Badges
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const badgeY = headerY + 140;
  const metaChips = [
    `তারিখ: ${dateStr}`,
    `সময়: ${timeStr}`,
    `মোট স্টাফ: ${toBanglaSerial(staffList.length)} জন`,
    `পৃষ্ঠা: ${toBanglaSerial(pageNumber)} / ${toBanglaSerial(totalPages)}`
  ];

  const chipW = 215;
  const chipH = 36;
  const totalChipsW = metaChips.length * chipW + (metaChips.length - 1) * 12;
  let chipStartX = (canvasWidth - totalChipsW) / 2;

  metaChips.forEach((chipText) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, chipStartX, badgeY, chipW, chipH, 10, true, true);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px "Hind Siliguri", "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(chipText, chipStartX + chipW / 2, badgeY + 23);

    chipStartX += chipW + 12;
  });

  // 6. Table Header (Column headers)
  const tableHeaderY = 284;
  const tableHeaderH = 46;
  const colSlX = 72;
  const colNameX = 145;
  const colDesigX = 490;
  const colMethodX = 715;
  const colNumberX = 845;

  ctx.fillStyle = '#e2e8f0';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, headerX, tableHeaderY, headerW, tableHeaderH, 10, true, true);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 17px "Hind Siliguri", "Inter", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('# ক্রম', colSlX, tableHeaderY + 29);
  ctx.fillText('স্টাফের নাম (STAFF NAME)', colNameX, tableHeaderY + 29);
  ctx.fillText('পদবী (DESIGNATION)', colDesigX, tableHeaderY + 29);
  ctx.fillText('মেথড', colMethodX + 15, tableHeaderY + 29);
  ctx.fillText('পেমেন্ট নম্বর', colNumberX, tableHeaderY + 29);

  // 7. Render Categorized Sections & Rows
  let currentY = tableHeaderY + tableHeaderH + 8;

  pageItems.forEach((item) => {
    if (item.type === 'category_header') {
      // Section Header Banner (STL, TL, Counselor, etc.)
      const catStyle = CATEGORY_STYLES[item.category] || CATEGORY_STYLES['Senior Team Leader'];
      const bannerH = 46;

      const grad = ctx.createLinearGradient(headerX, currentY, headerX + headerW, currentY);
      grad.addColorStop(0, catStyle.gradStart);
      grad.addColorStop(1, catStyle.gradEnd);
      ctx.fillStyle = grad;
      drawRoundedRect(ctx, headerX, currentY, headerW, bannerH, 10, true, false);

      // Left Accent Color Bar
      ctx.fillStyle = catStyle.accent;
      ctx.fillRect(headerX, currentY + 6, 5, bannerH - 12);

      // Section Number & Title (with emoji symbol)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px "Hind Siliguri", "Inter", sans-serif';
      ctx.textAlign = 'left';
      const fullTitle = `${item.symbol}  ${item.sectionSerial}. ${item.titleBn}`;
      ctx.fillText(fullTitle, headerX + 18, currentY + 30);

      // Right Member Count Badge
      const countText = `${toBanglaSerial(item.memberCount)} জন`;
      ctx.font = 'bold 14px "Hind Siliguri", "Inter", sans-serif';
      const badgeWidth = ctx.measureText(countText).width + 24;
      const badgeHeight = 28;
      const badgeX = headerX + headerW - badgeWidth - 14;
      const badgeY = currentY + (bannerH - badgeHeight) / 2;

      ctx.fillStyle = catStyle.badgeBg;
      drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 8, true, false);

      ctx.fillStyle = catStyle.badgeText;
      ctx.textAlign = 'center';
      ctx.fillText(countText, badgeX + badgeWidth / 2, badgeY + 19);

      currentY += bannerH + 6;
    } else {
      // Staff Member Row
      const rowH = item.height;
      const staff = item.staff;

      // Alternating Row Background
      ctx.fillStyle = item.isEven ? '#ffffff' : '#f8fafc';
      ctx.fillRect(headerX, currentY, headerW, rowH);

      // Row Bottom Divider
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(headerX, currentY + rowH);
      ctx.lineTo(headerX + headerW, currentY + rowH);
      ctx.stroke();

      // 1. Continuous Serial Number (বাংলা ক্রমিক নম্বর: ০১, ০২, ০৩...)
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 18px "Hind Siliguri", "Inter", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(item.globalSerial, colSlX, currentY + 35);

      // 2. Staff Name (Bengali name rendered with 100% clarity)
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px "Hind Siliguri", "Inter", sans-serif';
      const fittedName = fitText(ctx, staff.name, 320);
      ctx.fillText(fittedName, colNameX, currentY + 35);

      // 3. Designation Badge / Text
      let displayCat = staff.category as string;
      if (displayCat === 'Senior Team Leader') displayCat = 'সিনিয়র টিম লিডার (STL)';
      else if (displayCat === 'Team Leader') displayCat = 'টিম লিডার (TL)';
      else if (displayCat === 'Senior Counselor') displayCat = 'সিনিয়র কাউন্সেলর (SC)';
      else if (displayCat === 'Counselor') displayCat = 'কাউন্সেলর (Counselor)';
      else if (displayCat === 'Teacher') displayCat = 'শিক্ষক (Teacher)';
      else if (displayCat === 'Team Trainer') displayCat = 'টিম ট্রেইনার (TT)';

      ctx.fillStyle = '#334155';
      ctx.font = '600 17px "Hind Siliguri", "Inter", sans-serif';
      const fittedCat = fitText(ctx, displayCat, 210);
      ctx.fillText(fittedCat, colDesigX, currentY + 35);

      // 4. Payment Method Badge
      const method = staff.method;
      let badgeBg = '#f1f5f9';
      let badgeBorder = '#cbd5e1';
      let badgeTextColor = '#334155';

      if (method === 'bKash') {
        badgeBg = '#fdf2f8';
        badgeBorder = '#f472b6';
        badgeTextColor = '#db2777';
      } else if (method === 'Nagad') {
        badgeBg = '#fff7ed';
        badgeBorder = '#fb923c';
        badgeTextColor = '#ea580c';
      } else if (method === 'Rocket') {
        badgeBg = '#faf5ff';
        badgeBorder = '#c084fc';
        badgeTextColor = '#9333ea';
      } else if (method === 'Upay') {
        badgeBg = '#fefce8';
        badgeBorder = '#facc15';
        badgeTextColor = '#ca8a04';
      }

      const mBadgeW = 95;
      const mBadgeH = 34;
      const mBadgeX = colMethodX - 5;
      const mBadgeY = currentY + (rowH - mBadgeH) / 2;

      ctx.fillStyle = badgeBg;
      ctx.strokeStyle = badgeBorder;
      ctx.lineWidth = 1.2;
      drawRoundedRect(ctx, mBadgeX, mBadgeY, mBadgeW, mBadgeH, 8, true, true);

      ctx.fillStyle = badgeTextColor;
      ctx.font = 'bold 16px "Inter", "Hind Siliguri", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(method, mBadgeX + mBadgeW / 2, mBadgeY + 22);

      // 5. Payment Phone Number
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px "Inter", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(staff.number, colNumberX, currentY + 35);

      currentY += rowH;
    }
  });

  // 8. Footer Section inside Phone Screen
  const footerY = 1715;
  const footerH = 110;
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, headerX, footerY, headerW, footerH, 16, true, true);

  // Footer Left Content
  ctx.fillStyle = '#4f46e5';
  ctx.font = 'bold 18px "Hind Siliguri", "Inter", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('✓ পদবীভিত্তিক অফিসিয়াল ডিরেক্টরি (OFFICIAL DIRECTORY)', headerX + 24, footerY + 42);

  ctx.fillStyle = '#64748b';
  ctx.font = '500 15px "Hind Siliguri", "Inter", sans-serif';
  ctx.fillText('এসটিএল ও টিম লিডার সিরিয়াল অনুযায়ী অনুমোদিত • Unity Earning Platform', headerX + 24, footerY + 74);

  // Footer Right Content (Verification Stamp)
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 17px "Hind Siliguri", "Inter", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Approved by Admin: Jihadul Islam', headerX + headerW - 24, footerY + 42);

  ctx.fillStyle = '#059669';
  ctx.font = 'bold 14px "Hind Siliguri", "Inter", sans-serif';
  ctx.fillText('● Verified & Sealed by Admin (Jihadul Islam)', headerX + headerW - 24, footerY + 74);

  // 9. Smartphone Home Indicator Bar
  const barW = 160;
  const barH = 6;
  const barX = (canvasWidth - barW) / 2;
  const barY = 1856;
  ctx.fillStyle = '#94a3b8';
  drawRoundedRect(ctx, barX, barY, barW, barH, 3, true, false);

  return canvas;
}

/**
 * Downloads high-definition phone frame PNG images with:
 * - STL at the very top (e.g. 2 members or whatever exists)
 * - Followed by Team Leader, Senior Counselor, Counselor, Teacher, Team Trainer
 * - Grouped into distinct, clearly visible sections
 * - Continuous serial numbering (০১, ০২, ০৩...)
 * - 100% visible, crystal-clear Bengali names
 */
export async function exportStaffDirectoryImage(staffList: StaffMember[]) {
  if (staffList.length === 0) return;

  const paginatedPages = buildPaginatedItems(staffList);
  const totalPages = paginatedPages.length;
  const now = new Date();
  const dateTag = `${now.getFullYear()}_${(now.getMonth() + 1).toString().padStart(2, '0')}_${now.getDate().toString().padStart(2, '0')}`;

  for (let page = 1; page <= totalPages; page++) {
    const pageItems = paginatedPages[page - 1];
    const canvas = await generatePhoneFrameCanvas(staffList, page, totalPages, pageItems);
    const dataUrl = canvas.toDataURL('image/png', 1.0);

    const link = document.createElement('a');
    link.download = `Unity_Payment_Directory_Page_${page}_${dateTag}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Small delay between multiple downloads to avoid browser block
    if (page < totalPages) {
      await new Promise((res) => setTimeout(res, 350));
    }
  }
}

/**
 * Generates an official PDF with the exact phone frame pages where:
 * - STL is at the very top
 * - Distinct sections for each designation
 * - Bengali names and texts are 100% visible and serial numbered
 */
export async function exportStaffDirectoryPdf(staffList: StaffMember[]) {
  if (staffList.length === 0) return;

  const paginatedPages = buildPaginatedItems(staffList);
  const totalPages = paginatedPages.length;
  const now = new Date();

  // Mobile phone frame dimensions in mm (standard 9:16 portrait viewport: 108mm x 192mm)
  const pageWidth = 108;
  const pageHeight = 192;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pageWidth, pageHeight]
  });

  for (let page = 1; page <= totalPages; page++) {
    if (page > 1) {
      doc.addPage([pageWidth, pageHeight], 'portrait');
    }

    const pageItems = paginatedPages[page - 1];
    const canvas = await generatePhoneFrameCanvas(staffList, page, totalPages, pageItems);
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
  }

  const fileName = `Unity_Payment_Directory_Serial_${now.getFullYear()}_${(now.getMonth() + 1).toString().padStart(2, '0')}.pdf`;
  doc.save(fileName);
}
