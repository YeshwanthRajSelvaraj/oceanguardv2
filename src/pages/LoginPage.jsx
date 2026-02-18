import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/TranslationContext';
import { ROLES } from '../utils/constants';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { Shield, Anchor, Eye, EyeOff, AlertCircle } from 'lucide-react';
import logo from '../assets/logo.png';

export default function LoginPage() {
    const navigate = useNavigate();
    const { user, login } = useAuth();
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (user) {
        return <Navigate to={user.role === ROLES.FISHERMAN ? '/dashboard' : '/authority'} replace />;
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const u = await login(email, password);
            navigate(u.role === ROLES.FISHERMAN ? '/dashboard' : '/authority');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-dvh flex items-center justify-center relative overflow-hidden bg-slate-900">
            {/* ── Background ── */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#061e33] via-ocean-dark to-ocean" />

            {/* Animated Background Elements */}
            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-aqua/[0.07] blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] rounded-full bg-safe/[0.06] blur-[80px] animate-pulse" style={{ animationDuration: '6s' }} />

            {/* Wave Decoration */}
            <div className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none opacity-20">
                <svg className="w-[200%] animate-wave" viewBox="0 0 2880 320" preserveAspectRatio="none" style={{ height: '180px' }}>
                    <path fill="rgba(28, 167, 166, 0.3)" d="M0,192L60,197.3C120,203,240,213,360,229.3C480,245,600,267,720,250.7C840,235,960,181,1080,181.3C1200,181,1320,235,1440,234.7C1560,235,1680,181,1800,154.7L1920,128L1920,320L0,320Z" />
                </svg>
            </div>

            {/* ── Content ── */}
            <div className="relative z-10 w-full px-4 sm:px-6 py-6 sm:py-10 flex flex-col items-center">

                {/* Language Switcher */}
                <div className="w-full max-w-[480px] flex justify-end mb-4 sm:mb-6">
                    <LanguageSwitcher />
                </div>

                {/* Logo Section */}
                <div className="text-center mb-6 sm:mb-8">
                    <div className="w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] mx-auto mb-4 sm:mb-5 rounded-2xl bg-gradient-to-br from-aqua to-safe flex items-center justify-center shadow-lg shadow-aqua/20 animate-float overflow-hidden p-1">
                        <img src={logo} alt="CoastalGuard Logo" className="w-full h-full object-contain drop-shadow-md" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{t('app.name')}</h1>
                    <p className="text-aqua text-sm sm:text-base font-semibold mt-1.5 sm:mt-2 tracking-wide opacity-90">{t('app.tagline')}</p>
                </div>

                {/* ── Login Card ── */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 md:p-10 shadow-2xl w-full max-w-[480px]">
                    <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
                        {error && (
                            <div className="bg-danger/10 border border-danger/20 text-danger-light text-sm font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Email */}
                        <div className="space-y-2.5">
                            <label htmlFor="login-email" className="block text-xs font-bold text-slate-300 uppercase tracking-[0.08em] pl-1">{t('login.emailLabel')}</label>
                            <input
                                id="login-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('login.emailPlaceholder')}
                                required
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 sm:px-5 py-3 sm:py-4 text-[15px] sm:text-base text-white placeholder-white/30 focus:border-aqua focus:ring-1 focus:ring-aqua/50 transition-all outline-none"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2.5">
                            <label htmlFor="login-pass" className="block text-xs font-bold text-slate-300 uppercase tracking-[0.08em] pl-1">{t('login.passwordLabel')}</label>
                            <div className="relative">
                                <input
                                    id="login-pass"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t('login.passwordPlaceholder')}
                                    required
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 sm:px-5 py-3 sm:py-4 text-[15px] sm:text-base text-white placeholder-white/30 focus:border-aqua focus:ring-1 focus:ring-aqua/50 transition-all outline-none pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-1"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-aqua to-safe hover:from-aqua-light hover:to-safe-light text-white text-[15px] sm:text-base font-bold rounded-xl shadow-lg shadow-aqua/25 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 sm:mt-6"
                        >
                            {loading ? (
                                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>{t('login.signingIn')}</span></>
                            ) : (
                                <span>{t('login.signIn')}</span>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 sm:gap-4 my-6 sm:my-8">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-xs text-white/40 font-semibold uppercase tracking-wider">{t('login.newHere')}</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Registration Buttons */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <button onClick={() => navigate('/register/fisherman')} className="group py-3 sm:py-4 border border-white/10 rounded-xl hover:bg-white/5 transition-all flex flex-col items-center gap-1.5 sm:gap-2">
                            <Anchor className="w-5 h-5 sm:w-6 sm:h-6 text-aqua group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] sm:text-xs font-bold text-slate-300 group-hover:text-white">{t('login.registerFisherman')}</span>
                        </button>
                        <button onClick={() => navigate('/register/authority')} className="group py-3 sm:py-4 border border-white/10 rounded-xl hover:bg-white/5 transition-all flex flex-col items-center gap-1.5 sm:gap-2">
                            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-safe group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] sm:text-xs font-bold text-slate-300 group-hover:text-white">{t('login.registerAuthority')}</span>
                        </button>
                    </div>
                </div>

                {/* Demo Accounts */}
                <div className="mt-8 text-center bg-black/30 border border-white/10 rounded-2xl p-5 w-full max-w-[480px] backdrop-blur-sm">
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.15em] mb-4">Instant Demo Access</p>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => { setEmail('fisher@coastalguard.in'); setPassword('fisher123'); }}
                            className="flex flex-col items-center gap-1 group p-2 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
                        >
                            <span className="text-xs font-mono text-aqua font-bold group-hover:text-aqua-light transition-colors">Fisherman</span>
                            <span className="text-[10px] text-slate-400">fisher@coastalguard.in</span>
                            <span className="text-[10px] text-slate-500 font-mono bg-white/5 px-2 py-0.5 rounded text-opacity-70 group-hover:text-opacity-100 transition-all">Pass: fisher123</span>
                        </button>

                        <button
                            onClick={() => { setEmail('officer@coastalguard.in'); setPassword('officer123'); }}
                            className="flex flex-col items-center gap-1 group p-2 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
                        >
                            <span className="text-xs font-mono text-safe font-bold group-hover:text-safe-light transition-colors">Authority</span>
                            <span className="text-[10px] text-slate-400">officer@coastalguard.in</span>
                            <span className="text-[10px] text-slate-500 font-mono bg-white/5 px-2 py-0.5 rounded text-opacity-70 group-hover:text-opacity-100 transition-all">Pass: officer123</span>
                        </button>
                    </div>
                </div>

                <p className="text-center text-[10px] text-white/20 mt-8 font-medium">
                    {t('app.copyright')}
                </p>
            </div>
        </div>
    );
}
