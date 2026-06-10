import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, LogOut } from "lucide-react";

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

const S: { input: React.CSSProperties; label: React.CSSProperties } = {
  input: {background: "#ffffff", border: `1.5px solid ${C.border}`,
    borderRadius: 12, padding: "12px 14px", fontSize: 14, width: "100%",
    outline: "none", fontFamily: "'Poppins', sans-serif",
    boxSizing: "border-box", color: C.slate, transition: "0.2s",
  },

  label: {fontSize: 12, fontWeight: 700, color: C.green, textTransform: "uppercase",
    letterSpacing: "0.08em", marginBottom: 6, display: "block",
    fontFamily: "'Poppins', sans-serif",
  },
};

const Field = ({ label, children }) => (
  <div>
    <label style={S.label}>{label}</label>
    {children}
  </div>
);

const Input = (props) => <input style={S.input} {...props} />;

const Select = (props) => (
  <select style={{ ...S.input, cursor: "pointer" }} {...props} />
);

type ButtonProps = {
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
  color?: "primary" | "danger" | "default";
};

const Button = ({
  children, onClick,
  type = "button",
  color = "primary",
}: ButtonProps) => {
  const styles = {
    primary: {
      bg: "linear-gradient(135deg, #1d4ed8, #059669)",
      color: C.white,
      border: "#059669",
    },

    danger: {
      bg: C.red,
      color: C.white,
      border: C.red,
    },

    default: {
      bg: C.white,
      color: C.slate,
      border: C.border,
    },
  }[color];

  return (
    <button type={type} onClick={onClick}
      style={{
        padding: "12px 16px", borderRadius: 12, border: `1.5px solid ${styles.border}`,
        background: styles.bg, color: styles.color, fontWeight: 600,
        cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
        fontFamily: "'Poppins', sans-serif", fontSize: 14,
        transition: "0.2s", boxShadow: color === "primary"
            ? "0 6px 18px rgba(5, 150, 105, 0.25)"
            : "none",
      }}>
      {children}
    </button>
  );
};

export default function EngagementForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    titre: "", mission: "", montant: "",
    date: "", province: "", administration: "", uo: "",
    budget: "", ligneBudgetaire: "",
    posteComptable: "", fournisseur: "",
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {e.preventDefault();
    console.log("ENGAGEMENT :", form);
    alert("Engagement enregistré !");
  };

  return (
    <div style={{
        minHeight: "100vh", background: C.bg,
        display: "flex", justifyContent: "center",
        alignItems: "center", padding: 30,
        fontFamily: "'Poppins', sans-serif",
      }}>

      <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 980 }}>
        <div style={{
            background: "rgba(255,255,255,0.96)",
            backdropFilter: "blur(10px)",
            border: `1px solid rgba(255,255,255,0.25)`,
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          }}>
      
          <div style={{
              padding: 26,
              background: "linear-gradient(135deg, #1d4ed8 0%, #1d4ed8 60%, #1d4ed8 100%)",
            }}>
            <h2 style={{
                margin: 0,
                color: C.white,
                fontWeight: 700,
                fontSize: 25,
              }}>
              Création d'un engagement budgétaire
            </h2>
            <p style={{
                margin: 0,
                color: "rgba(255,255,255,0.9)",
                fontSize: 13,
                marginTop: 6,
              }}>
              Formulaire de gestion des engagements administratifs
            </p>
          </div>

          <div style={{ padding: 28 }}>
            <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 18,
              }}>
              <Field label="Titre">
                <Input name="titre" onChange={handleChange}/>
              </Field>
              <Field label="Mission">
                <Input name="mission" onChange={handleChange}/>
              </Field>
              <Field label="Montant">
                <Input name="montant" type="number" onChange={handleChange}/>
              </Field>
              <Field label="Date">
                <Input name="date" type="date" onChange={handleChange}/>
              </Field>
            </div>

            <div style={{
                margin: "26px 0",
                borderTop: `2px dashed ${C.greenLight}`,
              }}/>

            <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 18,
              }}>
              <Field label="Province">
                <Select name="province" onChange={handleChange}></Select>
              </Field>
              <Field label="Administration">
                <Select name="administration" onChange={handleChange}
                ></Select>
              </Field>
              <Field label="Unité Opérationnelle">
                <Select name="uo" onChange={handleChange}></Select>
              </Field>
            </div>

            <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 18,
              }}>
              <Field label="Budget">
                <Select name="budget" onChange={handleChange}></Select>
              </Field>
              <Field label="Ligne budgétaire">
                <Select name="ligneBudgetaire" onChange={handleChange}></Select>
              </Field>
              <Field label="Poste comptable">
                <Select name="posteComptable" onChange={handleChange}></Select>
              </Field>
              <Field label="Fournisseur">
                <Select name="fournisseur" onChange={handleChange}></Select>
              </Field>
            </div>
          </div>

          <div style={{
              padding: 18,
              borderTop: `1px solid ${C.border}`,
              display: "flex",
              justifyContent: "space-between",
              background: "#eff6ff",
            }}>
            <Button color="danger" onClick={() => navigate("/acceuil")}>
              <LogOut size={18}/>
              Fermer
            </Button>

            <div style={{ display: "flex", gap: 10 }}>
              <Button color="default">
                <X size={18}/>
                Annuler
              </Button>

              <Button type="submit" color="primary">
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}