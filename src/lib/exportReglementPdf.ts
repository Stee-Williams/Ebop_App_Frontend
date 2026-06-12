import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  applyDgcptPageFooter,
  DGCPT_MARGINS,
  DGCPT_TABLE_STYLES,
  drawDgcptHeader,
  drawDgcptSignatureBlock,
  formatMontantDgcpt,
  generateDocRef,
  loadCachetImage,
  loadDgcptLogo,
} from "@/lib/exportPdfDgcpt";

export type ReglementDetailExport = {
  numero: string;
  reference?: string | null;
  objet?: string | null;
  fournisseur?: string | null;
  montant: string;
  administration?: string | null;
  province?: string | null;
  demandeur?: string | null;
  date: string;
  statut: string;
  mode_paiement?: string | null;
  cree_par?: string | null;
};

type ExportOptions = {
  row: ReglementDetailExport;
  exportedBy?: string;
};

export async function exportReglementPdf({
  row,
  exportedBy,
}: ExportOptions): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const docRef = generateDocRef("REG-PAI");
  const [logo, cachet] = await Promise.all([loadDgcptLogo(), loadCachetImage()]);

  const startY = drawDgcptHeader(
    doc,
    {
      documentTitle: "Fiche de règlement budgétaire",
      documentSubtitle: `Engagement n° ${row.numero}`,
      reference: row.reference ?? docRef,
      editedBy: exportedBy ?? row.cree_par ?? undefined,
      dossierCount: 1,
    },
    logo
  );

  autoTable(doc, {
    startY,
    head: [["Rubrique", "Information"]],
    body: [
      ["Référence du règlement", row.reference ?? "—"],
      ["Statut", row.statut],
      ["Objet de la dépense", row.objet ?? "—"],
      ["Fournisseur / Créancier", row.fournisseur ?? "—"],
      ["Montant réglé", row.montant],
      ["Mode de paiement", row.mode_paiement ?? "—"],
      ["Date du règlement", row.date],
      ["Administration", row.administration ?? "—"],
      ["Province", row.province ?? "—"],
      ["Demandeur / Ordonnateur", row.demandeur ?? "—"],
      ["Enregistré par", row.cree_par ?? "—"],
    ],
    ...DGCPT_TABLE_STYLES,
    columnStyles: {
      0: { cellWidth: 55, fontStyle: "bold" },
      1: { cellWidth: "auto" },
    },
    margin: { left: DGCPT_MARGINS.left, right: DGCPT_MARGINS.right, bottom: DGCPT_MARGINS.bottom },
    didDrawPage: (data) => {
      applyDgcptPageFooter(doc, data.pageNumber, doc.getNumberOfPages(), docRef);
    },
  });

  const finalY =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ??
    startY + 20;

  let y = finalY + 8;
  const { left, right } = DGCPT_MARGINS;
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(
    "Le présent document atteste du règlement de la dépense engagée au titre de l'exercice budgétaire en cours.",
    left,
    y,
    { maxWidth: pageWidth - left - right }
  );

  drawDgcptSignatureBlock(
    doc,
    y + 10,
    [
      ["L'Agent de trésorerie", "Nom, qualité et signature"],
      ["L'Ordonnateur", "Nom, qualité et signature"],
    ],
    cachet
  );

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    applyDgcptPageFooter(doc, i, pageCount, docRef);
  }

  const safeNum = row.numero.replace(/[^\w-]+/g, "_");
  const ref = row.reference?.replace(/[^\w-]+/g, "_") ?? "attente";
  doc.save(`reglement-${safeNum}-${ref}.pdf`);
}

export function buildReglementExportRow(
  row: {
    numero: string;
    reference?: string | null;
    objet?: string | null;
    titre?: string | null;
    fournisseur?: string | null;
    montant: number;
    administration_nom?: string | null;
    province_nom?: string | null;
    demandeur?: string | null;
    date: string;
    displayStatut: string;
    mode_paiement?: string | null;
    cree_par?: string | null;
  },
  fmtDate: (d: string) => string
): ReglementDetailExport {
  return {
    numero: row.numero,
    reference: row.reference,
    objet: row.objet ?? row.titre,
    fournisseur: row.fournisseur,
    montant: formatMontantDgcpt(Number(row.montant)),
    administration: row.administration_nom,
    province: row.province_nom,
    demandeur: row.demandeur,
    date: fmtDate(row.date),
    statut: row.displayStatut,
    mode_paiement: row.mode_paiement,
    cree_par: row.cree_par,
  };
}
