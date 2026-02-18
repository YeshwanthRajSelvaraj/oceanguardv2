import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAlerts } from '../contexts/AlertContext';
import { useTranslation } from '../contexts/TranslationContext';
import { ROLES } from '../utils/constants';
import LanguageSwitcher from './LanguageSwitcher';

import logo from '../assets/logo.png';

export default function Navbar({ title, showAlertBadge }) {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { pendingCount } = useAlerts();
    const { t } = useTranslation();

    const handleLogout = () => { logout(); navigate('/'); };

    return (
        <nav className="sticky top-0 z-50 bg-ocean shadow-lg shadow-ocean/20 safe-area-top">
            <div className="max-w-5xl mx-auto flex items-center justify-between h-[56px] sm:h-[60px] px-3 sm:px-4 lg:px-6">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-aqua to-safe flex items-center justify-center shadow-md shadow-aqua/20 flex-shrink-0 overflow-hidden">
                        <img src={logo} alt="CoastalGuard Logo" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-[14px] sm:text-[16px] font-extrabold text-white leading-tight tracking-tight truncate">{title || t('app.name')}</h1>
                        <p className="text-[9px] sm:text-[10px] font-semibold text-aqua/60 uppercase tracking-widest leading-none">
                            {user?.role === ROLES.AUTHORITY ? t('nav.authorityPanel') : t('nav.safetyDashboard')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <LanguageSwitcher />
                    {showAlertBadge && pendingCount > 0 && (
                        <div className="relative animate-scale-in">
                            <div className="bg-danger text-white text-[10px] sm:text-[11px] font-extrabold min-w-[24px] sm:min-w-[28px] h-6 sm:h-7 flex items-center justify-center px-1.5 sm:px-2 rounded-full shadow-lg shadow-danger/40">{pendingCount}</div>
                            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-danger animate-ping" />
                        </div>
                    )}
                    <button onClick={handleLogout} className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] flex items-center justify-center text-white/70 hover:text-white transition-all btn-press" title={t('nav.signOut')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </button>
                </div>
            </div>
        </nav>
    );
}
