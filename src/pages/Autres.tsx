import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Eye, Printer, Calendar, LogOut } from "lucide-react";

const C = {
  blue: "#1d4ed8", blueDark: "#1e3a8a", green: "#059669", greenLight: "#d1fae5",
  slate: "#0f172a", muted: "#64748b", faint: "#94a3b8", faintLight: "#e2e8f0",
  border: "#cbd5e1", surface: "#ffffff", red: "#dc2626", redLight: "#fee2e2", white: "#ffffff",
  bg: "linear-gradient(135deg, #1e3a8a 0%, #1e3a8a 55%, #1e3a8a 100%)",
};

const S = {
  card: { background: C.white, borderRadius: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.04)" },
  inputContainer: { display: "flex", alignItems: "center", gap: "10px", border: `1px solid ${C.border}`, borderRadius: "14px", padding: "0 14px", height: "50px", background: "#fff" },
  inputStyle: { border: "none", outline: "none", width: "100%", fontSize: "14px", background: "transparent" },
  td: { padding: "18px", fontSize: "14px", color: "#334155" },
  iconBtn: { width: "38px", height: "38px", borderRadius: "10px", border: "none", background: "#eff6ff", color: C.blue, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  exportBtn: { display: "flex", alignItems: "center", gap: "10px", border: "none", background: C.blue, color: "#fff", padding: "12px 18px", borderRadius: "12px", fontWeight: "600", cursor: "pointer" },
  overlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  } as const,
  modal: {
    background: "#fff",
    borderRadius: "16px",
    padding: "30px",
    width: "90%",
    maxWidth: "600px",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
  } as const,
  detail: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
    padding: "16px",
    background: C.faintLight,
    borderRadius: "12px",
    border: `1px solid ${C.faint}`,
  } as const,
};

const statusMap = {
  "Validé": { color: C.green, background: C.greenLight },
  "En attente": { color: C.faint, background: C.faintLight },
  "Rejeté": { color: C.red, background: C.redLight },
};

const engagementsData = [
  
];

const ITEMS_PER_PAGE = 5;

const Detail = ({ label, value }) => (
  <div style={S.detail}>
    <div style={{ color: "#64748b", fontSize: "13px", marginBottom: "6px" }}>{label}</div>
    <div style={{ color: C.slate, fontWeight: "600" }}>{value}</div>
  </div>
);

const Button = ({ children, onClick, color = "default" }) => {
  const styles = { primary: { background: C.blue, color: C.white }, danger: { background: C.red, color: C.white }, default: { background: C.white, color: C.slate, border: `1.5px solid ${C.border}` } }[color];
  return <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 12, border: color === "default" ? `1.5px solid ${C.border}` : "none", ...styles, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{children}</button>;
};

export default function AutresEngagements() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const filteredData = useMemo(() => engagementsData.filter(item => Object.values(item).join(" ").toLowerCase().includes(search.toLowerCase())), [search]);
  
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "30px", fontFamily: "Inter, sans-serif" }}>
      <div style={{ ...S.card, padding: "24px", marginBottom: "25px" }}>
        <h1 style={{ margin: 0, color: C.slate, fontSize: "30px", fontWeight: "700" }}>Consultation des autres engagements</h1>
        <p style={{ marginTop: "10px", color: C.muted, fontSize: "15px" }}>Consultez et recherchez les engagements enregistrés dans le système.</p>
      </div>

      <div style={{ ...S.card, padding: "20px", marginBottom: "25px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: "15px" }}>
          {[
            { icon: Search, placeholder: "Recherche générale...", type: "input", value: search, onChange: (e) => setSearch(e.target.value) },
            { placeholder: "Administration", type:"input" },
            { icon: Calendar, type: "date" },
            { placeholder: "Statut", type: "select", options: ["Statut","Tous", "Validé", "En attente", "Rejeté"] },
          ].map((f, i) => (
            <div key={i} style={S.inputContainer}>
              {f.icon && <f.icon size={18} color={C.muted}/>}
              {f.type === "input" && <input placeholder={f.placeholder} value={f.value} onChange={f.onChange} style={S.inputStyle} />}
              {f.type === "date" && <input type="date" style={S.inputStyle}/>}
              {f.type === "select" && <select style={S.inputStyle}>{f.options?.map(o => <option key={o}>{o}</option>)}</select>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...S.card, borderRadius: "20px", overflow: "hidden" }}>
        <div style={{ padding: "20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, color: C.slate }}>Liste des engagements</h3>
          <Button color="danger" onClick={() => navigate("/acceuil")}>
            <LogOut size={18}/>
            Fermer
          </Button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                {["N° Engagement", "Date", "Administration", "Objet", "Montant", "Statut", "Actions"].map(h => <th key={h} style={{ padding: "18px", fontSize: "14px", color: C.slate }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item, i) => (
                <tr key={item.id} style={{ borderBottom: i !== paginatedData.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <td style={S.td}>{item.id}</td>
                  <td style={S.td}>{item.date}</td>
                  <td style={S.td}>{item.administration}</td>
                  <td style={S.td}>{item.objet}</td>
                  <td style={S.td}>{item.montant}</td>
                  <td style={S.td}><span style={{ padding: "8px 14px", borderRadius: "999px", fontSize: "13px", fontWeight: "600", ...statusMap[item.statut] }}>{item.statut}</span></td>
                  <td style={S.td}>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button style={S.iconBtn} onClick={() => setSelected(item)}><Eye size={18} /></button>
                      <button style={S.iconBtn}><Printer size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ padding: "18px", display: "flex", justifyContent: "center", gap: "10px" }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button 
              key={p} 
              onClick={() => setCurrentPage(p)}
              style={{ width: "38px", height: "38px", borderRadius: "10px", border: "none", background: p === currentPage ? C.blue : C.faintLight, color: p === currentPage ? "#fff" : C.slate, fontWeight: "600", cursor: "pointer" }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, color: C.slate }}>Détails de l'engagement</h2>
              <button onClick={() => setSelected(null)} style={{ border: "none", background: "transparent", fontSize: "20px", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
              <Detail label="Numéro" value={selected.id} />
              <Detail label="Date" value={selected.date} />
              <Detail label="Administration" value={selected.administration} />
              <Detail label="Objet" value={selected.objet} />
              <Detail label="Montant" value={selected.montant} />
              <Detail label="Statut" value={selected.statut} />
            </div>
            <button style={{ marginTop: "25px", width: "100%", height: "50px", border: "none", borderRadius: "14px", background: C.blue, color: "#fff", fontWeight: "600", fontSize: "15px", cursor: "pointer" }}>Imprimer l'engagement</button>
          </div>
        </div>
      )}
    </div>
  );
}