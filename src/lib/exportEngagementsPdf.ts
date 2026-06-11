import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { EngagementItem } from "@/config/app";

type ExportRow = {
  numero: string;
  date: string;
  demandeur: string;
  objet: string;
  montant: string;
  statut: string;
};

type ExportOptions = {
  title: string;
  subtitle?: string;
  filtreStatut?: string;
  exportedBy?: string;
  rows: ExportRow[];
};

export function exportEngagementsPdf({
  title,
  subtitle,
  filtreStatut,
  exportedBy,
  rows,
}: ExportOptions): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.setTextColor(30, 58, 95);
  doc.text("EBOP — Portail de gestion des crédits", 14, 16);

  doc.setFontSize(12);
  doc.setTextColor(50, 50, 50);
  doc.text(title, 14, 24);

  if (subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, 14, 30);
  }

  let metaY = subtitle ? 36 : 30;
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  const meta = [
    `Généré le ${new Date().toLocaleString("fr-FR")}`,
    filtreStatut ? `Filtre statut : ${filtreStatut}` : null,
    exportedBy ? `Exporté par : ${exportedBy}` : null,
    `${rows.length} dossier(s)`,
  ]
    .filter(Boolean)
    .join("  ·  ");
  doc.text(meta, 14, metaY);

  autoTable(doc, {
    startY: metaY + 6,
    head: [["Réf.", "Date", "Demandeur", "Objet", "Montant", "Statut"]],
    body: rows.map((r) => [
      r.numero,
      r.date,
      r.demandeur,
      r.objet,
      r.montant,
      r.statut,
    ]),
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
    },
    headStyles: {
      fillColor: [30, 58, 95],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 22 },
      2: { cellWidth: 38 },
      3: { cellWidth: 80 },
      4: { cellWidth: 30, halign: "right" },
      5: { cellWidth: 24 },
    },
    margin: { left: 14, right: 14 },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      "DGCPT — Direction Générale de la Comptabilité Publique et du Trésor",
      14,
      doc.internal.pageSize.getHeight() - 8
    );
    doc.text(
      `Page ${i} / ${pageCount}`,
      pageWidth - 14,
      doc.internal.pageSize.getHeight() - 8,
      { align: "right" }
    );
  }

  const fileName = `registre-engagements-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

export function buildExportRow(
  item: EngagementItem,
  fmt: (n: number) => string,
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
    montant: fmt(item.montant),
    statut: normalizeStatut(item.statut),
  };
}
