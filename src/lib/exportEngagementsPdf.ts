import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { EngagementItem } from "@/config/app";
import {
  applyDgcptPageFooter,
  DGCPT_MARGINS,
  DGCPT_TABLE_STYLES,
  drawDgcptHeader,
  drawDgcptSignatureBlock,
  formatMontantFcfa,
  generateDocRef,
  loadCachetImage,
  loadDgcptLogo,
} from "@/lib/exportPdfDgcpt";

type ExportRow = {
  numero: string;
  date: string;
  demandeur: string;
  objet: string;
  montant: string;
  montantNumeric: number;
  statut: string;
};

type ExportOptions = {
  title: string;
  subtitle?: string;
  filtreStatut?: string;
  exportedBy?: string;
  rows: ExportRow[];
};

export async function exportEngagementsPdf({
  title,
  subtitle,
  filtreStatut,
  exportedBy,
  rows,
}: ExportOptions): Promise<void> {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const docRef = generateDocRef("REG-ENG");
  const [logo, cachet] = await Promise.all([loadDgcptLogo(), loadCachetImage()]);
  const totalMontant = rows.reduce((sum, row) => sum + row.montantNumeric, 0);

  const startY = drawDgcptHeader(
    doc,
    {
      documentTitle: title,
      documentSubtitle: subtitle,
      reference: docRef,
      exercice: new Date().getFullYear(),
      editedBy: exportedBy,
      filterLabel: filtreStatut,
      dossierCount: rows.length,
    },
    logo
  );

  autoTable(doc, {
    startY,
    head: [["N°", "Référence", "Date", "Demandeur", "Objet de la dépense", "Montant (FCFA)", "Statut"]],
    body: rows.map((row, index) => [
      String(index + 1),
      row.numero,
      row.date,
      row.demandeur,
      row.objet,
      row.montant,
      row.statut,
    ]),
    foot: [
      [
        {
          content: `TOTAL GÉNÉRAL — ${rows.length} dossier(s)`,
          colSpan: 5,
          styles: { halign: "right" as const },
        },
        formatMontantFcfa(totalMontant),
        "",
      ],
    ],
    ...DGCPT_TABLE_STYLES,
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 30 },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 36 },
      4: { cellWidth: 78 },
      5: { cellWidth: 32, halign: "right" },
      6: { cellWidth: 22, halign: "center" },
    },
    margin: { left: DGCPT_MARGINS.left, right: DGCPT_MARGINS.right, bottom: DGCPT_MARGINS.bottom },
    didDrawPage: (data) => {
      applyDgcptPageFooter(doc, data.pageNumber, doc.getNumberOfPages(), docRef);
    },
  });

  const finalY =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ??
    startY + 20;

  drawDgcptSignatureBlock(
    doc,
    finalY,
    [
      ["Le Contrôleur budgétaire", "Visa — Nom, qualité et signature"],
      ["L'Agent comptable", "Nom, qualité et signature"],
    ],
    cachet
  );

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    applyDgcptPageFooter(doc, i, pageCount, docRef);
  }

  const fileName = `registre-engagements-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

export function buildExportRow(
  item: EngagementItem,
  fmtDate: (d: string) => string,
  normalizeStatut: (s: string) => string
): ExportRow {
  return {
    numero: item.numero,
    date: fmtDate(item.date),
    demandeur: item.demandeur ?? "—",
    objet:
      item.objet ??
      item.titre ??
      item.ligne_budgetaire_libelle ??
      "—",
    montant: formatMontantFcfa(item.montant),
    montantNumeric: item.montant,
    statut: normalizeStatut(item.statut),
  };
}
