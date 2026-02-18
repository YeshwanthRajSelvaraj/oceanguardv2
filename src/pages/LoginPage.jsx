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
        <>
            <style>{`
                /* ── Root ── */
                .lp-root {
                    min-height: 100dvh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                    background: #05121f;
                    font-family: 'Inter', system-ui, sans-serif;
                }

                /* ── Layered background ── */
                .lp-bg {
                    position: absolute;
                    inset: 0;
                    background:
                        radial-gradient(ellipse 80% 60% at 75% 0%, rgba(28,167,166,0.22) 0%, transparent 60%),
                        radial-gradient(ellipse 60% 50% at 10% 90%, rgba(42,157,143,0.15) 0%, transparent 55%),
                        linear-gradient(175deg, #061828 0%, #0a3248 45%, #07243a 100%);
                }

                /* subtle dot grid */
                .lp-dots {
                    position: absolute;
                    inset: 0;
                    background-image: radial-gradient(rgba(28,167,166,0.12) 1px, transparent 1px);
                    background-size: 28px 28px;
                    mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent);
                }

                /* ── Floating orbs ── */
                .lp-orb1 {
                    position: absolute;
                    width: 420px; height: 420px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(28,167,166,0.15) 0%, transparent 70%);
                    top: -120px; right: -80px;
                    animation: lpFloat 8s ease-in-out infinite;
                    pointer-events: none;
                }
                .lp-orb2 {
                    position: absolute;
                    width: 320px; height: 320px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(42,157,143,0.12) 0%, transparent 70%);
                    bottom: -80px; left: -60px;
                    animation: lpFloat 10s ease-in-out infinite reverse;
                    pointer-events: none;
                }

                /* ── Wave ── */
                .lp-wave {
                    position: absolute;
                    bottom: 0; left: 0; right: 0;
                    pointer-events: none;
                    line-height: 0;
                }

                /* ── Language switcher ── */
                .lp-lang {
                    position: absolute;
                    top: 18px; right: 18px;
                    z-index: 100;
                }

                /* ── Content ── */
                .lp-content {
                    position: relative;
                    z-index: 10;
                    width: 100%;
                    max-width: 420px;
                    padding: 28px 20px 32px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                /* ── Logo section ── */
                .lp-logo {
                    text-align: center;
                    margin-bottom: 32px;
                    animation: lpFadeUp 0.7s cubic-bezier(.16,1,.3,1) both;
                }

                .lp-logo-ring {
                    width: 82px; height: 82px;
                    margin: 0 auto 18px;
                    border-radius: 24px;
                    background: linear-gradient(145deg, #1CA7A6, #2A9D8F);
                    box-shadow:
                        0 20px 50px rgba(28,167,166,0.4),
                        0 0 0 1px rgba(28,167,166,0.25),
                        inset 0 1px 0 rgba(255,255,255,0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 5px;
                    position: relative;
                }

                .lp-logo-ring::before {
                    content: '';
                    position: absolute;
                    inset: -4px;
                    border-radius: 28px;
                    background: linear-gradient(145deg, rgba(28,167,166,0.35), transparent 60%);
                    z-index: -1;
                }

                .lp-logo-ring img {
                    width: 100%; height: 100%;
                    object-fit: contain;
                    border-radius: 18px;
                }

                .lp-title {
                    font-size: 36px;
                    font-weight: 900;
                    color: #fff;
                    letter-spacing: -0.8px;
                    line-height: 1;
                    margin: 0 0 10px;
                }

                .lp-tagline {
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 0.22em;
                    text-transform: uppercase;
                    color: #1CA7A6;
                    opacity: 0.9;
                }

                /* ── Card ── */
                .lp-card {
                    width: 100%;
                    border-radius: 28px;
                    overflow: hidden;
                    box-shadow:
                        0 40px 100px rgba(0,0,0,0.55),
                        0 0 0 1px rgba(255,255,255,0.08),
                        inset 0 1px 0 rgba(255,255,255,0.12);
                    animation: lpFadeUp 0.7s cubic-bezier(.16,1,.3,1) 0.12s both;
                }

                /* top stripe accent */
                .lp-card-stripe {
                    height: 3px;
                    background: linear-gradient(90deg, #1CA7A6, #2A9D8F, #1CA7A6);
                    background-size: 200% 100%;
                    animation: lpShimmer 3s ease-in-out infinite;
                }

                .lp-card-body {
                    background: rgba(10,40,65,0.6);
                    backdrop-filter: blur(28px);
                    -webkit-backdrop-filter: blur(28px);
                    padding: 28px 26px 24px;
                }

                /* ── Error ── */
                .lp-error {
                    background: rgba(230,57,70,0.1);
                    border: 1px solid rgba(230,57,70,0.25);
                    color: #f08080;
                    font-size: 12px;
                    font-weight: 700;
                    padding: 11px 14px;
                    border-radius: 13px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 18px;
                }

                /* ── Form ── */
                .lp-form { display: flex; flex-direction: column; gap: 16px; }

                .lp-label {
                    display: block;
                    font-size: 10px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: rgba(255,255,255,0.32);
                    margin-bottom: 7px;
                    padding-left: 2px;
                }

                .lp-input-wrap { position: relative; }

                .lp-input {
                    width: 100%;
                    box-sizing: border-box;
                    background: rgba(0,0,0,0.28);
                    border: 1px solid rgba(255,255,255,0.09);
                    border-radius: 14px;
                    padding: 15px 18px;
                    font-size: 14px;
                    font-family: inherit;
                    color: #fff;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
                }

                .lp-input::placeholder { color: rgba(255,255,255,0.18); }

                .lp-input:focus {
                    border-color: rgba(28,167,166,0.65);
                    background: rgba(0,0,0,0.4);
                    box-shadow: 0 0 0 3px rgba(28,167,166,0.13), 0 4px 16px rgba(0,0,0,0.2);
                }

                .lp-input-pr { padding-right: 48px; }

                .lp-eye {
                    position: absolute;
                    right: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: rgba(255,255,255,0.28);
                    display: flex;
                    padding: 4px;
                    transition: color 0.2s;
                }
                .lp-eye:hover { color: rgba(255,255,255,0.7); }

                /* ── Sign In button ── */
                .lp-signin {
                    width: 100%;
                    margin-top: 6px;
                    padding: 16px;
                    border: none;
                    border-radius: 14px;
                    background: linear-gradient(135deg, #1CA7A6 0%, #22b8a8 50%, #2A9D8F 100%);
                    color: #fff;
                    font-size: 14px;
                    font-weight: 800;
                    font-family: inherit;
                    letter-spacing: 0.03em;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: box-shadow 0.2s, transform 0.15s;
                    box-shadow: 0 10px 28px rgba(28,167,166,0.38), inset 0 1px 0 rgba(255,255,255,0.2);
                }
                .lp-signin:hover:not(:disabled) {
                    box-shadow: 0 14px 36px rgba(28,167,166,0.48);
                    transform: translateY(-1px);
                }
                .lp-signin:active:not(:disabled) { transform: scale(0.98); }
                .lp-signin:disabled { opacity: 0.58; cursor: not-allowed; }

                .lp-spin {
                    width: 16px; height: 16px;
                    border: 2.5px solid rgba(255,255,255,0.3);
                    border-top-color: #fff;
                    border-radius: 50%;
                    animation: lpSpin 0.65s linear infinite;
                }

                /* ── Divider ── */
                .lp-divider {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin: 22px 0 18px;
                }
                .lp-divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.07); }
                .lp-divider-text {
                    font-size: 9px;
                    font-weight: 800;
                    color: rgba(255,255,255,0.22);
                    text-transform: uppercase;
                    letter-spacing: 0.16em;
                    white-space: nowrap;
                }

                /* ── Register buttons ── */
                .lp-reg-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                }

                .lp-reg-btn {
                    padding: 15px 12px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 16px;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 9px;
                    transition: all 0.22s cubic-bezier(.16,1,.3,1);
                    font-family: inherit;
                }

                .lp-reg-btn.fish:hover {
                    background: rgba(28,167,166,0.09);
                    border-color: rgba(28,167,166,0.28);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(28,167,166,0.12);
                }
                .lp-reg-btn.auth:hover {
                    background: rgba(42,157,143,0.09);
                    border-color: rgba(42,157,143,0.28);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(42,157,143,0.12);
                }

                .lp-reg-ico {
                    width: 38px; height: 38px;
                    border-radius: 11px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.2s;
                }
                .lp-reg-btn:hover .lp-reg-ico { transform: scale(1.12); }

                .lp-reg-btn.fish .lp-reg-ico { background: rgba(28,167,166,0.13); color: #1CA7A6; }
                .lp-reg-btn.auth .lp-reg-ico { background: rgba(42,157,143,0.13); color: #2A9D8F; }

                .lp-reg-lbl {
                    font-size: 10px;
                    font-weight: 700;
                    color: rgba(255,255,255,0.38);
                    text-align: center;
                    line-height: 1.35;
                    transition: color 0.2s;
                }
                .lp-reg-btn:hover .lp-reg-lbl { color: rgba(255,255,255,0.85); }

                /* ── Demo section ── */
                .lp-demo {
                    background: rgba(0,0,0,0.32);
                    border-top: 1px solid rgba(255,255,255,0.05);
                    padding: 18px 26px 22px;
                }

                .lp-demo-title {
                    font-size: 9px;
                    font-weight: 800;
                    color: rgba(255,255,255,0.18);
                    text-transform: uppercase;
                    letter-spacing: 0.2em;
                    text-align: center;
                    margin-bottom: 13px;
                }

                .lp-demo-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                }

                .lp-demo-item {
                    padding: 11px 13px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 13px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 6px;
                    font-family: inherit;
                    transition: all 0.2s;
                    text-align: left;
                }
                .lp-demo-item.fish:hover {
                    background: rgba(28,167,166,0.08);
                    border-color: rgba(28,167,166,0.22);
                }
                .lp-demo-item.auth:hover {
                    background: rgba(42,157,143,0.08);
                    border-color: rgba(42,157,143,0.22);
                }

                .lp-demo-name {
                    font-size: 11px;
                    font-weight: 800;
                    margin-bottom: 3px;
                }
                .lp-demo-item.fish .lp-demo-name { color: #1CA7A6; }
                .lp-demo-item.auth .lp-demo-name { color: #2A9D8F; }

                .lp-demo-pw {
                    font-size: 9px;
                    font-family: monospace;
                    color: rgba(255,255,255,0.2);
                }

                .lp-demo-arr {
                    font-size: 15px;
                    color: rgba(255,255,255,0.13);
                    transition: color 0.2s, transform 0.2s;
                    flex-shrink: 0;
                }
                .lp-demo-item.fish:hover .lp-demo-arr { color: #1CA7A6; transform: translateX(2px); }
                .lp-demo-item.auth:hover .lp-demo-arr { color: #2A9D8F; transform: translateX(2px); }

                /* ── Footer text ── */
                .lp-footer-txt {
                    margin-top: 22px;
                    font-size: 10px;
                    color: rgba(255,255,255,0.16);
                    text-align: center;
                    font-weight: 500;
                }

                /* ── Animations ── */
                @keyframes lpFadeUp {
                    from { opacity: 0; transform: translateY(22px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes lpFloat {
                    0%, 100% { transform: translateY(0); }
                    50%      { transform: translateY(-18px); }
                }
                @keyframes lpSpin {
                    to { transform: rotate(360deg); }
                }
                @keyframes lpShimmer {
                    0%   { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>

            <div className="lp-root">
                <div className="lp-bg" />
                <div className="lp-dots" />
                <div className="lp-orb1" />
                <div className="lp-orb2" />

                {/* Wave */}
                <div className="lp-wave">
                    <svg viewBox="0 0 1440 100" preserveAspectRatio="none" style={{ width: '100%', height: '80px', display: 'block' }}>
                        <path fill="rgba(28,167,166,0.1)" d="M0,50L80,56C160,62,320,74,480,72C640,70,800,54,960,50C1120,46,1280,54,1360,58L1440,62L1440,100L0,100Z" />
                        <path fill="rgba(28,167,166,0.06)" d="M0,70L120,62C240,54,480,38,720,40C960,42,1200,64,1320,72L1440,80L1440,100L0,100Z" />
                    </svg>
                </div>

                {/* Language Switcher */}
                <div className="lp-lang">
                    <LanguageSwitcher />
                </div>

                <div className="lp-content">

                    {/* Logo */}
                    <div className="lp-logo">
                        <div className="lp-logo-ring">
                            <img src={logo} alt="CoastalGuard" />
                        </div>
                        <h1 className="lp-title">{t('app.name')}</h1>
                        <p className="lp-tagline">{t('app.tagline')}</p>
                    </div>

                    {/* Card */}
                    <div className="lp-card">
                        <div className="lp-card-stripe" />

                        <div className="lp-card-body">
                            {error && (
                                <div className="lp-error">
                                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleLogin} className="lp-form">
                                <div>
                                    <label className="lp-label">{t('login.emailLabel')}</label>
                                    <div className="lp-input-wrap">
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder={t('login.emailPlaceholder')}
                                            required
                                            className="lp-input"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="lp-label">{t('login.passwordLabel')}</label>
                                    <div className="lp-input-wrap">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder={t('login.passwordPlaceholder')}
                                            required
                                            className="lp-input lp-input-pr"
                                        />
                                        <button type="button" className="lp-eye" onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <button type="submit" disabled={loading} className="lp-signin">
                                    {loading
                                        ? <><div className="lp-spin" /><span>{t('login.signingIn')}</span></>
                                        : <span>{t('login.signIn')}</span>
                                    }
                                </button>
                            </form>

                            <div className="lp-divider">
                                <div className="lp-divider-line" />
                                <span className="lp-divider-text">{t('login.newHere')}</span>
                                <div className="lp-divider-line" />
                            </div>

                            <div className="lp-reg-grid">
                                <button className="lp-reg-btn fish" onClick={() => navigate('/register/fisherman')}>
                                    <div className="lp-reg-ico"><Anchor size={18} /></div>
                                    <span className="lp-reg-lbl">{t('login.registerFisherman')}</span>
                                </button>
                                <button className="lp-reg-btn auth" onClick={() => navigate('/register/authority')}>
                                    <div className="lp-reg-ico"><Shield size={18} /></div>
                                    <span className="lp-reg-lbl">{t('login.registerAuthority')}</span>
                                </button>
                            </div>
                        </div>

                        {/* Demo */}
                        <div className="lp-demo">
                            <p className="lp-demo-title">⚡ Instant Demo Access</p>
                            <div className="lp-demo-row">
                                <button className="lp-demo-item fish" onClick={() => { setEmail('fisher@coastalguard.in'); setPassword('fisher123'); }}>
                                    <div>
                                        <p className="lp-demo-name">🎣 Fisherman</p>
                                        <p className="lp-demo-pw">fisher123</p>
                                    </div>
                                    <span className="lp-demo-arr">→</span>
                                </button>
                                <button className="lp-demo-item auth" onClick={() => { setEmail('officer@coastalguard.in'); setPassword('officer123'); }}>
                                    <div>
                                        <p className="lp-demo-name">🛡️ Authority</p>
                                        <p className="lp-demo-pw">officer123</p>
                                    </div>
                                    <span className="lp-demo-arr">→</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <p className="lp-footer-txt">{t('app.copyright')}</p>
                </div>
            </div>
        </>
    );
}