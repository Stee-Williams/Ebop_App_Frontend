import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearUserSession } from '@/config/app';


const NavItem = ({ label, isOpen, onClick, children, isSingle = false }) => (
  <div className="relative group">
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium transition-all duration-200 flex items-center gap-1
        ${isOpen 
          ? 'text-indigo-600 bg-indigo-50 border-b-2 border-indigo-600' 
          
          : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
        } ${isSingle ? 'hover:border-b-2 hover:border-gray-300' : ''}`}
    >
      {label}
      {!isSingle && (
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      )}
    </button>
    {isOpen && children && (
      <div className="absolute left-0 top-full w-64 bg-white border border-gray-100 shadow-xl z-50 py-2 rounded-b-xl animate-in fade-in slide-in-from-top-1">
        {children}
      </div>
    )}
  </div>
);

function Accueil() {
  const [openMenu, setOpenMenu] = useState(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = (name) => setOpenMenu(openMenu === name ? null : name);

  const DropdownButton: React.FC<{ label: string; shortcut?: string; onClick?: () => void; variant?: string }> = ({ label, shortcut, onClick, variant = "default" }) => (
    <button
      onClick={onClick}
      className={`w-full px-4 py-2.5 text-left text-sm flex justify-between items-center transition-colors
        ${variant === 'primary' 
          ? 'text-indigo-600 font-semibold hover:bg-blue-400' 
          : 'text-gray-700 hover:bg-blue-400'}`}
    >
      {label}
      {shortcut && <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-400 font-mono">{shortcut}</span>}
    </button>
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      
      {/* Navbar*/}
      <header className="bg-white shadow-sm border-b border-black-100 z-50" ref={menuRef}>
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-6">
          
          <nav className="flex items-center">
            {/*Titre*/}
            <div className="pr-8 font-bold text-indigo-600 text-lg tracking-tight">EBOP</div>

            <NavItem label="Engagements" isOpen={openMenu === 'engagements'} onClick={() => toggleMenu('engagements')}>
              <DropdownButton label="Consulter et viser" shortcut={undefined} onClick={() => navigate('/Viser')}/>
              <DropdownButton label="Autres consultations" shortcut={undefined} onClick={() => navigate('/Autres ')}/>
              <div className="border-t border-blue-900 my-1"></div>
              <DropdownButton label="+ Créer un engagement" variant="primary" shortcut={undefined} onClick={() => navigate('/Creation ')}/>
            </NavItem>

            <NavItem label="Collectivités" isSingle onClick={() => console.log('Collectivités')} isOpen={undefined} children={undefined} />
            <NavItem label="Gestion des EPP" isSingle onClick={() => console.log('EPP')} isOpen={undefined} children={undefined} />

            <NavItem label="Règlement" isOpen={openMenu === 'reglement'} onClick={() => toggleMenu('reglement')}>
                <DropdownButton label="Consulter les règlements" onClick={() => navigate('/Reglement')} />
            </NavItem>

            <NavItem label="Divers" isOpen={openMenu === 'divers'} onClick={() => toggleMenu('divers')}>
              <DropdownButton label="Consulter le budget" />
              <DropdownButton label="Mise à jour des profils" shortcut={undefined} onClick={() => navigate('/Profile')} />
              <div className="border-t border-gray-100 my-1"></div>
            </NavItem>
          </nav>

          <button 
            onClick={() => {
              clearUserSession();
              navigate('/login');
            }}
            className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-red-600 hover:bg-red-400 rounded-full transition-colors"
          >
            <span>Quitter</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </header>

  {/* Zone Centrale */}
  <main className="flex-1 flex flex-col items-center justify-center bg-white relative overflow-hidden">
    
    <div className="relative w-[500px] h-[500px] flex items-center justify-center">
      
      <div className="z-10 text-center">
        <img
          src="/public/images/Gabon.jpg"
          alt="Trésor Public Gabon"
          className="relative w-[500px] h-[500px] flex items-center justify-center" />
      </div>
    </div>
  </main>

  {/* Footer*/}
      <footer className="bg-white border-t border-gray-200 px-6 py-3 text-xs text-gray-400 flex justify-between">
        <span>&copy; 2026 Direction Générale de la comptabilité et du Trésor</span>
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Système Opérationnel
        </span>
      </footer>
    </div>
  );
}

export default Accueil;