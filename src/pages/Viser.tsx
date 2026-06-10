import React, { useState, CSSProperties } from 'react';

const S: { [key: string]: CSSProperties } = {
  input: { background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '7px 12px', fontSize: 12, width: '100%', outline: 'none' },
  label: { fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4, display: 'block' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', margin: '0 12px 12px' },
  btnAction: { border: 'none', borderRadius: 6, padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' },
  btnSecondary: { background: '#fff', color: '#475569', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '8px 14px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }
};

const StatusBadge = ({ status }) => {
  const styles = {
    'En attente': { bg: '#fef3c7', text: '#92400e' },
    'Visé': { bg: '#dcfce7', text: '#16a34a' },
    'Rejeté': { bg: '#fee2e2', text: '#991b1b' }
  };
  const s = styles[status] || styles['En attente'];
  return <span style={{ background: s.bg, color: s.text, padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{status}</span>;
};

export default function VisaEngagements() {
  const [activeId, setActiveId] = useState(null);
  
  const [data, setData] = useState([]);

  const handleAction = (id, newStatus) => {
    const msg = newStatus === 'Visé' ? "Confirmer le visa ?" : "Motif du rejet obligatoire :";
    if (window.confirm(msg)) {
      setData(data.map(item => item.id === id ? { ...item, statut: newStatus } : item));
    }
  };

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: '#f1f5f9', minHeight: '100vh', padding: '20px 10px' }}>
      
      {/* Header avec Stats */}
      <div style={{ ...S.card, display: 'flex', justifyContent: 'space-between', borderLeft: '4px solid #6366f1' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, color: '#1e293b' }}>Visa des Engagements Budgétaires</h2>
          <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>Vous avez <b style={{color: '#f59e0b'}}>des dossiers</b> en attente de validation</p>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ textAlign: 'right' }}>
                <div style={S.label}>Disponibilité</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#16a34a' }}>0 FCFA</div>
            </div>
        </div>
      </div>

      {/* Tableau de Travail */}
      <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
        <table style={{ 
               width: '100%', 
               borderCollapse: 'collapse', 
               fontSize: 12,
               tableLayout: 'auto' 
            }}>

          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Réf', 'Date', 'Demandeur', 'Objet', 'Montant', 'Statut', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontSize: 11 }}>{h}</th> ))}
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.id} onClick={() => setActiveId(r.id)} style={{ background: activeId === r.id ? '#f0f4ff' : '#fff', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#4f46e5' }}>{r.id}</td>
                <td style={{ padding: '12px 14px' }}>{r.date}</td>
                <td style={{ padding: '12px 14px' }}>{r.demandeur}</td>
                <td style={{ padding: '12px 14px' }}>{r.objet}</td>
                <td style={{ padding: '12px 14px', fontWeight: 700 }}>{r.montant}</td>
                <td style={{ padding: '12px 14px' }}><StatusBadge status={r.statut} /></td>
                <td style={{ padding: '12px 14px', display: 'flex', gap: 6 }}>
                  {r.statut === 'En attente' && (
                    <>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleAction(r.id, 'Visé'); }}
                        style={{ ...S.btnAction, background: '#dcfce7', color: '#16a34a' }} title="Viser" >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleAction(r.id, 'Rejeté'); }}
                        style={{ ...S.btnAction, background: '#fee2e2', color: '#ef4444' }} title="Rejeter" >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button></>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Barre d'outils Footer */}
      <div style={{ margin: '0 12px', display: 'flex', justifyContent: 'space-between' }}>
        <button 
          onClick={() => window.location.href = '/acceuil'} style={S.btnSecondary}>
          Retour Accueil
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ ...S.btnSecondary, background: '#1e293b', color: '#fff', border: 'none' }}>
                Exporter le Registre
            </button>
        </div>
      </div>
    </div>
  );
}
