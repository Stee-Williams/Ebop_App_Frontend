import type jsPDF from "jspdf";

export const DGCPT_MARGINS = { left: 15, right: 15, top: 10, bottom: 22 };

export type DgcptDocMeta = {
  documentTitle: string;
  documentSubtitle?: string;
  reference: string;
  exercice?: number;
  editedAt?: Date;
  editedBy?: string;
  filterLabel?: string;
  dossierCount?: number;
};

export function generateDocRef(prefix: string): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const time = now.toTimeString().slice(0, 5).replace(":", "");
  return `${prefix}-${date}-${time}`;
}

async function loadImageAsDataUrl(src: string): Promise<string | null> {
  try {
    const response = await fetch(src);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function loadDgcptLogo(): Promise<string | null> {
  return loadImageAsDataUrl("/images/dgcpt.png");
}

export async function loadCachetImage(): Promise<string | null> {
  const tresor = await loadImageAsDataUrl("/images/tresor.png");
  if (tresor) return tresor;
  return loadImageAsDataUrl("/images/dgcpt.png");
}

function centerText(
  doc: jsPDF,
  text: string,
  y: number,
  fontSize: number,
  style: "normal" | "bold" | "italic" = "normal"
): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(fontSize);
  doc.setFont("helvetica", style);
  doc.text(text, pageWidth / 2, y, { align: "center" });
}

export function drawDgcptHeader(
  doc: jsPDF,
  meta: DgcptDocMeta,
  logoDataUrl: string | null
): number {
  const { left, right } = DGCPT_MARGINS;
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = DGCPT_MARGINS.top;

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", left, y, 20, 20);
  }

  doc.setTextColor(0, 0, 0);
  centerText(doc, "RÉPUBLIQUE GABONAISE", y + 4, 11, "bold");
  centerText(doc, "Union — Travail — Justice", y + 9, 8, "italic");

  y += 14;
  centerText(
    doc,
    "MINISTÈRE DE L'ÉCONOMIE, DES FINANCES, DE LA DETTE",
    y,
    8,
    "bold"
  );
  y += 4;
  centerText(
    doc,
    "ET DES PARTICIPATIONS, CHARGÉ DE LA LUTTE CONTRE LA VIE CHÈRE",
    y,
    8,
    "bold"
  );
  y += 5;
  centerText(
    doc,
    "Direction Générale de la Comptabilité Publique et du Trésor",
    y,
    9,
    "bold"
  );
  y += 4.5;
  centerText(doc, "(DGCPT)", y, 8, "normal");

  y += 8;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(left + 40, y, pageWidth - right - 40, y);
  y += 7;

  centerText(doc, meta.documentTitle.toUpperCase(), y, 11, "bold");
  y += 5;

  if (meta.documentSubtitle) {
    centerText(doc, meta.documentSubtitle, y, 9, "italic");
    y += 5;
  }

  doc.setLineWidth(0.2);
  doc.line(left + 50, y, pageWidth - right - 50, y);
  y += 6;

  const editedAt = meta.editedAt ?? new Date();
  const dateStr = editedAt.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const timeStr = editedAt.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const boxTop = y;
  const boxLeft = left;
  const boxWidth = pageWidth - left - right;
  const colWidth = boxWidth / 2;
  const rowHeight = 6;
  const rows: [string, string][] = [
    ["Référence du document", meta.reference],
    [
      "Exercice budgétaire",
      meta.exercice != null ? String(meta.exercice) : String(editedAt.getFullYear()),
    ],
    ["Date et heure d'édition", `${dateStr} à ${timeStr}`],
    ["Établi par", meta.editedBy ?? "—"],
  ];

  if (meta.filterLabel) {
    rows.push(["Filtre appliqué", meta.filterLabel]);
  }
  if (meta.dossierCount != null) {
    rows.push(["Nombre de dossiers", String(meta.dossierCount)]);
  }

  const boxHeight = rows.length * rowHeight + 4;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  doc.rect(boxLeft, boxTop, boxWidth, boxHeight);

  rows.forEach(([label, value], index) => {
    const rowY = boxTop + 4 + index * rowHeight;
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text(label, boxLeft + 2, rowY);
    doc.setFont("helvetica", "normal");
    doc.text(value, boxLeft + colWidth + 2, rowY);
    if (index < rows.length - 1) {
      doc.line(boxLeft, rowY + 2, boxLeft + boxWidth, rowY + 2);
    }
    doc.line(boxLeft + colWidth, boxTop, boxLeft + colWidth, boxTop + boxHeight);
  });

  return boxTop + boxHeight + 6;
}

export function applyDgcptPageFooter(
  doc: jsPDF,
  pageNumber: number,
  pageCount: number,
  docRef: string
): void {
  const { left, right, bottom } = DGCPT_MARGINS;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - bottom + 6;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  doc.line(left, footerY - 4, pageWidth - right, footerY - 4);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text(
    "DGCPT — EBOP : Portail de gestion des crédits administratifs",
    left,
    footerY
  );
  doc.text(`Réf. ${docRef}`, left, footerY + 3.5);
  doc.text(
    `Page ${pageNumber} / ${pageCount}`,
    pageWidth - right,
    footerY,
    { align: "right" }
  );
  doc.setFontSize(6.5);
  doc.text(
    "Document à usage administratif — Reproduction interdite sans autorisation",
    pageWidth / 2,
    footerY + 3.5,
    { align: "center" }
  );
}

function drawSignatureColumn(
  doc: jsPDF,
  x: number,
  width: number,
  y: number,
  title: string,
  hint: string
): void {
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(title, x + width / 2, y, { align: "center" });
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  doc.line(x + 6, y + 16, x + width - 6, y + 16);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.text(hint, x + width / 2, y + 22, { align: "center" });
}

function drawCachetBetweenSignatures(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  cachetDataUrl: string | null
): void {
  if (cachetDataUrl) {
    doc.addImage(cachetDataUrl, "PNG", x, y, width, height);
    return;
  }

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  doc.rect(x, y, width, height);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("Cachet du service", x + width / 2, y + height / 2 + 1, {
    align: "center",
  });
}

export function drawDgcptSignatureBlock(
  doc: jsPDF,
  startY: number,
  signatures: [string, string][] = [
    ["Le Contrôleur budgétaire", "Nom, qualité et signature"],
    ["L'Ordonnateur", "Nom, qualité et signature"],
  ],
  cachetDataUrl: string | null = null
): void {
  const { left, right } = DGCPT_MARGINS;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = startY + 8;

  if (y > pageHeight - 55) {
    doc.addPage();
    y = DGCPT_MARGINS.top + 10;
  }

  const lieu = "Libreville";
  const dateLong = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(`Fait à ${lieu}, le ${dateLong}`, left, y);
  y += 10;

  const contentWidth = pageWidth - left - right;

  if (signatures.length === 2) {
    const stampW = 28;
    const stampH = 28;
    const gap = 8;
    const sigW = (contentWidth - stampW - gap * 2) / 2;
    const leftX = left;
    const stampX = left + sigW + gap;
    const rightX = stampX + stampW + gap;
    const stampY = y + 1;

    drawSignatureColumn(doc, leftX, sigW, y, signatures[0][0], signatures[0][1]);
    drawCachetBetweenSignatures(doc, stampX, stampY, stampW, stampH, cachetDataUrl);
    drawSignatureColumn(doc, rightX, sigW, y, signatures[1][0], signatures[1][1]);
    return;
  }

  const colWidth = contentWidth / signatures.length;
  signatures.forEach(([title, hint], index) => {
    drawSignatureColumn(doc, left + index * colWidth, colWidth, y, title, hint);
  });
}

export const DGCPT_TABLE_STYLES = {
  theme: "grid" as const,
  styles: {
    fontSize: 8,
    cellPadding: 2,
    textColor: [0, 0, 0] as [number, number, number],
    lineColor: [0, 0, 0] as [number, number, number],
    lineWidth: 0.2,
  },
  headStyles: {
    fillColor: [230, 230, 230] as [number, number, number],
    textColor: [0, 0, 0] as [number, number, number],
    fontStyle: "bold" as const,
    halign: "center" as const,
  },
  footStyles: {
    fillColor: [245, 245, 245] as [number, number, number],
    textColor: [0, 0, 0] as [number, number, number],
    fontStyle: "bold" as const,
  },
};

/** Format administratif DGCPT : 5.000.000 */
export function formatMontantDgcpt(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function formatMontantFcfa(amount: number): string {
  return formatMontantDgcpt(amount);
}
