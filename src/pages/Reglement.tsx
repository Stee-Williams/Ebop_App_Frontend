import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "@/config/app";

const API = import.meta.env.VITE_API_URL ?? "";

const C = {
  blue: "#1d4ed8",
  blueDark: "#1e3a8a",
  green: "#059669",
  greenLight: "#d1fae5",
  slate: "#0f172a",
  muted: "#64748b",
  faint: "#94a3b8",
  border: "#cbd5e1",
  surface: "#ffffff",
  red: "#dc2626",
  white: "#ffffff",
  bg: "linear-gradient(135deg, #1e3a8a 0%, #1e3a8a 55%, #1e3a8a 100%)",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString("fr-FR");

interface Reglement {
  id: number;
  reference: string;
  engagement_id: number;
  titre?: string;
  administration?: string;
  fournisseur: string;
  montant: number;
  mode_paiement: string;
  date_reglement: string;
  statut: string;
}

interface Engagement {
  id: number;
  titre: string;
  fournisseur: string;
  montant: number;
  administration: string;
}

const Badge = ({ s }: { s: string }) => {
  const styles: Record<string, React.CSSProperties> = {
    "En attente": { background: "#fef3c7", color: "#d97706" },
    "Payé":       { background: C.greenLight, color: C.green },
    "Rejeté":     { background: "#fee2e2", color: C.red },
  };
  const style = styles[s] || styles["En attente"];
  return (
    <span style={{ ...style, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
      {s}
    </span>
  );
};

export default function Reglements() {
  const navigate = useNavigate();
  const [reglements, setReglements]     = useState<Reglement[]>([]);
  const [engagementsVises, setEngVises] = useState<Engagement[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [filtreStatut, setFiltreStatut] = useState("Tous");
  const [showCreate, setShowCreate]     = useState(false);
  const [toast, setToast]               = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [form, setForm] = useState({
    engagement_id: "",
    mode_paiement: "Virement",
    date_reglement: new Date().toISOString().split("T")[0],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        authFetch(`${API}/reglements`).then(r => r.json()),
        authFetch(`${API}/engagements/vises`).then(r => r.json()),
      ]);
      setReglements(Array.isArray(r1) ? r1 : []);
      setEngVises(Array.isArray(r2) ? r2 : []);
    } catch {
      showToast("Erreur de chargement des données", "error");
    }
    setLoading(false);
  };


  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const filtered = useMemo(() =>
    reglements.filter(r => {
      const matchSearch = Object.values(r).join(" ").toLowerCase().includes(search.toLowerCase());
      const matchStatut = filtreStatut === "Tous" || r.statut === filtreStatut;
      return matchSearch && matchStatut;
    }),
    [reglements, search, filtreStatut]
  );

  const stats = useMemo(() => ({
    total:        reglements.length,
    enAttente:    reglements.filter(r => r.statut === "En attente").length,
    paye:         reglements.filter(r => r.statut === "Payé").length,
    montantTotal: reglements.filter(r => r.statut === "Payé").reduce((s, r) => s + Number(r.montant), 0),
  }), [reglements]);

  const handleCreate = async () => {
    if (!form.engagement_id) { showToast("Sélectionnez un engagement", "error"); return; }
    try {
      const res = await authFetch(`${API}/reglements`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        return showToast(err.error || "Erreur création", "error");
      }
      showToast("Règlement créé avec succès", "success");
      setShowCreate(false);
      setForm({ engagement_id: "", mode_paiement: "Virement", date_reglement: new Date().toISOString().split("T")[0] });
      fetchData();
    } catch {
      showToast("Erreur réseau", "error");
    }
  };

  const S = {
    card:  { background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "1.25rem" } as React.CSSProperties,
    th:    { padding: "10px 12px", fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase" as const, letterSpacing: ".05em", textAlign: "left" as const, whiteSpace: "nowrap" as const, background: "#f8fafc" },
    td:    { padding: "11px 12px", fontSize: 13, color: C.slate, borderBottom: `1.5px solid ${C.border}` },
    input: { background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", fontSize: 14, color: C.slate, width: "100%", outline: "none", fontFamily: "'Poppins', sans-serif", boxSizing: "border-box" as const, transition: "0.2s" } as React.CSSProperties,
    label: { fontSize: 12, fontWeight: 700, color: C.green, textTransform: "uppercase" as const, letterSpacing: ".08em", marginBottom: 6, display: "block", fontFamily: "'Poppins', sans-serif" },
    btn:   { display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.white, color: C.slate, fontSize: 13, cursor: "pointer", fontFamily: "'Poppins', sans-serif", fontWeight: 600 } as React.CSSProperties,
    btnP:  { display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #1d4ed8, #059669)", color: C.white, fontSize: 13, cursor: "pointer", fontFamily: "'Poppins', sans-serif", fontWeight: 600, boxShadow: "0 6px 18px rgba(5, 150, 105, 0.25)" } as React.CSSProperties,
    overlay: { position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 },
    modal:   { background: C.surface, borderRadius: 12, padding: "1.5rem", width: "90%", maxWidth: 500 },
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "28px 24px", fontFamily: "'Poppins', sans-serif" }}>

      {toast && (
        <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999, background: toast.type === "success" ? C.green : C.red, color: C.white, padding: "10px 16px", borderRadius: 10, fontWeight: 600, fontSize: 13 }}>
          {toast.msg}
        </div>
      )}

      <div style={{ ...S.card, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: C.slate }}>Module des règlements</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>Gestion des paiements sur engagements visés</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={S.btn} onClick={() => navigate("/acceuil")}>← Retour</button>
          <button style={S.btnP} onClick={() => setShowCreate(true)}>+ Nouveau Règlement</button>
        </div>
      </div>

      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
        {[
          { label: "Total",      value: stats.total,                   bar: "#e6f1fb" },
          { label: "En attente", value: stats.enAttente,               bar: "#fef3c7" },
          { label: "Payés",      value: stats.paye,                    bar: "#d1fae5" },
          { label: "Décaissé",   value: fmt(stats.montantTotal), small: true, bar: "#f1f5f9" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#f8fafc", border: "0.5px solid #e2e8f0", borderRadius: 8, padding: "1rem" }}>
            <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: s.small ? 15 : 24, fontWeight: 600, color: "#0f172a" }}>{s.value}</div>
            <div style={{ marginTop: 8, height: 3, borderRadius: 3, background: s.bar }} />
          </div>
        ))}
      </div>

    
      <div style={{ ...S.card, marginBottom: 14, display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, border: "0.5px solid #cbd5e1", borderRadius: 8, padding: "0 12px", height: 36, background: "#f8fafc", width: 200 }}>
          <span style={{ color: "#94a3b8", fontSize: 14 }}></span>
          <input
            placeholder="Rechercher…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, width: "100%" }}/>
        </div>
        <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)} style={{ ...S.input, width: 140, height: 36, cursor: "pointer" }}>
          {["Tous", "En attente", "Payé", "Rejeté"].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      
      <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Référence", "Engagement", "Fournisseur", "Montant", "Mode", "Date", "Statut"].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ ...S.td, textAlign: "center", padding: 40, color: "#94a3b8" }}>Chargement…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ ...S.td, textAlign: "center", padding: 40, color: "#cbd5e1" }}>Aucun règlement trouvé</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")} onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
                  <td style={{ ...S.td, fontWeight: 600, color: "#1d4ed8" }}>{r.reference}</td>
                  <td style={S.td}>{r.titre || `#${r.engagement_id}`}</td>
                  <td style={S.td}>{r.fournisseur}</td>
                  <td style={{ ...S.td, fontWeight: 600 }}>{fmt(Number(r.montant))}</td>
                  <td style={S.td}>{r.mode_paiement}</td>
                  <td style={S.td}>{fmtDate(r.date_reglement)}</td>
                  <td style={S.td}><Badge s={r.statut} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    
      {showCreate && (
        <div style={S.overlay} onClick={() => setShowCreate(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 16, fontWeight: 600 }}>Nouveau règlement</span>
              <button onClick={() => setShowCreate(false)} style={{ border: "none", background: "transparent", fontSize: 18, cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={S.label}>Engagement *</label>
                <select value={form.engagement_id} onChange={e => setForm({ ...form, engagement_id: e.target.value })} style={{ ...S.input, cursor: "pointer" }}>
                  <option value="">-- Sélectionner --</option>
                  {engagementsVises.map(e => (
                    <option key={e.id} value={e.id}>#{e.id} — {e.titre} — {fmt(Number(e.montant))}</option>
                  ))}
                </select>
                {engagementsVises.length === 0 && (
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: "#d97706" }}>Aucun engagement visé disponible</p>
                )}
              </div>
              <div>
                <label style={S.label}>Mode de paiement *</label>
                <select value={form.mode_paiement} onChange={e => setForm({ ...form, mode_paiement: e.target.value })} style={{ ...S.input, cursor: "pointer" }}>
                  <option>Virement</option>
                  <option>Chèque</option>
                  <option>Espèces</option>
                </select>
              </div>
              <div>
                <label style={S.label}>Date de règlement *</label>
                <input type="date" value={form.date_reglement} onChange={e => setForm({ ...form, date_reglement: e.target.value })} style={S.input} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowCreate(false)} style={{ ...S.btn, flex: 1, justifyContent: "center" }}>Annuler</button>
              <button onClick={handleCreate} style={{ ...S.btnP, flex: 2, justifyContent: "center" }}>✓ Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}