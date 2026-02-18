import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/TranslationContext';
import { ROLES } from '../utils/constants';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function AuthoritySignup() {
    const navigate = useNavigate();
    const { signup } = useAuth();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ policeId: '', fullName: '', dob: '', idCardFile: null, email: '', password: '', confirmPassword: '' });
    const [errors, setErrors] = useState({});
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const update = (field) => (e) => {
        const val = e.target.type === 'file' ? e.target.files[0] : e.target.value;
        setForm((f) => ({ ...f, [field]: val }));
        setErrors((er) => ({ ...er, [field]: '' }));
    };

    const validate = () => {
        const errs = {};
        if (!form.policeId.trim()) errs.policeId = t('error.policeIdRequired');
        if (!form.fullName.trim()) errs.fullName = t('error.fullNameRequired');
        if (!form.dob) errs.dob = t('error.dobRequired');
        if (!form.email.trim()) errs.email = t('error.emailRequired');
        if (!form.password) errs.password = t('error.passwordRequired');
        if (form.password.length < 6) errs.password = t('error.passwordMin');
        if (form.password !== form.confirmPassword) errs.confirmPassword = t('error.passwordMismatch');
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true); setError('');
        try {
            await signup({ policeId: form.policeId.toUpperCase(), fullName: form.fullName, dob: form.dob, idCardFile: form.idCardFile?.name || null, email: form.email, password: form.password }, ROLES.AUTHORITY);
            navigate('/authority');
        } catch (err) { setError(err.message); setLoading(false); }
    };

    const EyeIcon = ({ open }) => open ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
    ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
    );

    return (
        <>
            <style>{`
                .as-root {
                    min-height: 100dvh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                    background: #05121f;
                    font-family: 'Inter', system-ui, sans-serif;
                }
                .as-bg {
                    position: absolute; inset: 0;
                    background:
                        radial-gradient(ellipse 75% 55% at 80% 5%, rgba(42,157,143,0.2) 0%, transparent 60%),
                        radial-gradient(ellipse 60% 50% at 15% 90%, rgba(28,167,166,0.14) 0%, transparent 55%),
                        linear-gradient(165deg, #061828 0%, #0a3248 50%, #07243a 100%);
                }
                .as-dots {
                    position: absolute; inset: 0;
                    background-image: radial-gradient(rgba(42,157,143,0.1) 1px, transparent 1px);
                    background-size: 28px 28px;
                    mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent);
                }
                .as-orb1 {
                    position: absolute; width: 380px; height: 380px; border-radius: 50%;
                    background: radial-gradient(circle, rgba(42,157,143,0.13) 0%, transparent 70%);
                    top: -100px; right: -60px;
                    animation: asFloat 9s ease-in-out infinite; pointer-events: none;
                }
                .as-orb2 {
                    position: absolute; width: 300px; height: 300px; border-radius: 50%;
                    background: radial-gradient(circle, rgba(28,167,166,0.1) 0%, transparent 70%);
                    bottom: -80px; left: -40px;
                    animation: asFloat 11s ease-in-out infinite reverse; pointer-events: none;
                }
                .as-topbar { position: absolute; top: 18px; right: 18px; z-index: 100; }
                .as-content {
                    position: relative; z-index: 10;
                    width: 100%; max-width: 460px;
                    padding: 28px 20px 36px;
                    display: flex; flex-direction: column;
                }
                .as-back {
                    display: inline-flex; align-items: center; gap: 6px;
                    color: rgba(255,255,255,0.4); font-size: 13px; font-weight: 600;
                    text-decoration: none; margin-bottom: 24px; transition: color 0.2s; width: fit-content;
                }
                .as-back:hover { color: rgba(255,255,255,0.85); }
                .as-back svg { transition: transform 0.2s; }
                .as-back:hover svg { transform: translateX(-3px); }

                /* Header */
                .as-header { text-align: center; margin-bottom: 28px; animation: asFadeUp 0.6s cubic-bezier(.16,1,.3,1) both; }
                .as-header-icon {
                    width: 72px; height: 72px; margin: 0 auto 16px; border-radius: 22px;
                    background: linear-gradient(145deg, #2A9D8F, #1CA7A6);
                    box-shadow: 0 16px 40px rgba(42,157,143,0.35), 0 0 0 1px rgba(42,157,143,0.2);
                    display: flex; align-items: center; justify-content: center;
                }
                .as-header h1 { font-size: 28px; font-weight: 900; color: #fff; letter-spacing: -0.5px; margin: 0 0 6px; }
                .as-header p { font-size: 13px; font-weight: 500; color: rgba(42,157,143,0.85); margin: 0; }

                /* Card */
                .as-card {
                    border-radius: 26px; overflow: hidden;
                    box-shadow: 0 40px 100px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.1);
                    animation: asFadeUp 0.6s cubic-bezier(.16,1,.3,1) 0.1s both;
                }
                .as-card-stripe {
                    height: 3px;
                    background: linear-gradient(90deg, #2A9D8F, #1CA7A6, #2A9D8F);
                    background-size: 200%; animation: asShimmer 3s ease-in-out infinite;
                }
                .as-card-body {
                    background: rgba(10,40,65,0.6); backdrop-filter: blur(28px);
                    -webkit-backdrop-filter: blur(28px); padding: 26px 24px 24px;
                }

                /* Section divider */
                .as-section-divider {
                    display: flex; align-items: center; gap: 10px;
                    margin: 4px 0 20px;
                }
                .as-section-divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.07); }
                .as-section-divider span {
                    font-size: 9px; font-weight: 800; color: rgba(255,255,255,0.22);
                    text-transform: uppercase; letter-spacing: 0.15em; white-space: nowrap;
                }

                /* Error */
                .as-error {
                    background: rgba(230,57,70,0.1); border: 1px solid rgba(230,57,70,0.25);
                    color: #f08080; font-size: 12px; font-weight: 700;
                    padding: 11px 14px; border-radius: 13px;
                    display: flex; align-items: center; gap: 8px; margin-bottom: 18px;
                }

                /* Fields */
                .as-fields { display: flex; flex-direction: column; gap: 15px; }
                .as-field-label {
                    display: block; font-size: 10px; font-weight: 800;
                    text-transform: uppercase; letter-spacing: 0.1em;
                    color: rgba(255,255,255,0.32); margin-bottom: 7px; padding-left: 2px;
                }
                .as-field-label span { color: #E63946; margin-left: 2px; }
                .as-input-wrap { position: relative; }
                .as-input-icon {
                    position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
                    color: rgba(255,255,255,0.2); pointer-events: none; display: flex;
                }
                .as-input {
                    width: 100%; box-sizing: border-box;
                    background: rgba(0,0,0,0.28); border: 1px solid rgba(255,255,255,0.09);
                    border-radius: 14px; padding: 14px 16px;
                    font-size: 14px; font-family: inherit; color: #fff; outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
                }
                .as-input.has-icon { padding-left: 44px; }
                .as-input.has-eye { padding-right: 44px; }
                .as-input::placeholder { color: rgba(255,255,255,0.18); }
                .as-input:focus {
                    border-color: rgba(42,157,143,0.6); background: rgba(0,0,0,0.4);
                    box-shadow: 0 0 0 3px rgba(42,157,143,0.12);
                }
                .as-input.err { border-color: rgba(230,57,70,0.5); }
                .as-input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6); cursor: pointer; }

                .as-eye-btn {
                    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
                    background: none; border: none; cursor: pointer;
                    color: rgba(255,255,255,0.28); display: flex; padding: 4px; transition: color 0.2s;
                }
                .as-eye-btn:hover { color: rgba(255,255,255,0.7); }

                .as-field-err {
                    display: flex; align-items: center; gap: 5px;
                    font-size: 11px; font-weight: 700; color: #f08080;
                    margin-top: 5px; padding-left: 2px;
                }

                /* File upload */
                .as-file-wrap { position: relative; cursor: pointer; }
                .as-file-wrap input[type="file"] { position: absolute; inset: 0; opacity: 0; cursor: pointer; z-index: 2; width: 100%; }
                .as-file-display {
                    background: rgba(0,0,0,0.2); border: 1.5px dashed rgba(255,255,255,0.12);
                    border-radius: 14px; padding: 14px 16px;
                    display: flex; align-items: center; gap: 10px;
                    color: rgba(255,255,255,0.28); font-size: 13px; transition: all 0.2s;
                }
                .as-file-wrap:hover .as-file-display {
                    border-color: rgba(42,157,143,0.35); color: rgba(255,255,255,0.6);
                    background: rgba(42,157,143,0.05);
                }

                /* Submit button */
                .as-submit {
                    width: 100%; margin-top: 24px; padding: 16px; border: none; border-radius: 14px;
                    background: linear-gradient(135deg, #2A9D8F 0%, #1CA7A6 100%);
                    color: #fff; font-size: 14px; font-weight: 800; font-family: inherit;
                    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
                    transition: box-shadow 0.2s, transform 0.15s;
                    box-shadow: 0 10px 28px rgba(42,157,143,0.38), inset 0 1px 0 rgba(255,255,255,0.2);
                }
                .as-submit:hover:not(:disabled) { box-shadow: 0 14px 36px rgba(42,157,143,0.48); transform: translateY(-1px); }
                .as-submit:active:not(:disabled) { transform: scale(0.98); }
                .as-submit:disabled { opacity: 0.58; cursor: not-allowed; }

                .as-spin {
                    width: 16px; height: 16px;
                    border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff;
                    border-radius: 50%; animation: asSpin 0.65s linear infinite;
                }

                /* Footer */
                .as-footer { text-align: center; font-size: 12px; color: rgba(255,255,255,0.25); margin-top: 20px; font-weight: 500; }
                .as-footer a { color: rgba(42,157,143,0.85); font-weight: 700; text-decoration: none; transition: color 0.2s; }
                .as-footer a:hover { color: #2A9D8F; }

                @keyframes asFadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
                @keyframes asFloat { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-16px); } }
                @keyframes asSpin { to { transform:rotate(360deg); } }
                @keyframes asShimmer { 0% { background-position:200% 0; } 100% { background-position:-200% 0; } }
            `}</style>

            <div className="as-root">
                <div className="as-bg" /><div className="as-dots" /><div className="as-orb1" /><div className="as-orb2" />
                <div className="as-topbar"><LanguageSwitcher /></div>

                <div className="as-content">
                    <Link to="/" className="as-back">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                        {t('btn.backToLogin')}
                    </Link>

                    <div className="as-header">
                        <div className="as-header-icon">
                            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                        </div>
                        <h1>{t('signup.authority.title')}</h1>
                        <p>{t('signup.authority.subtitle')}</p>
                    </div>

                    <div className="as-card">
                        <div className="as-card-stripe" />
                        <div className="as-card-body">
                            {error && (
                                <div className="as-error">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                {/* Official Info section */}
                                <div className="as-section-divider">
                                    <div className="as-section-divider-line" />
                                    <span>{t('signup.authority.officialInfo')}</span>
                                    <div className="as-section-divider-line" />
                                </div>

                                <div className="as-fields">
                                    {/* Police ID */}
                                    <div>
                                        <label className="as-field-label">{t('field.policeId')}<span>*</span></label>
                                        <div className="as-input-wrap">
                                            <span className="as-input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="20" height="18" rx="3" /><line x1="2" y1="9" x2="22" y2="9" /></svg></span>
                                            <input className={`as-input has-icon ${errors.policeId ? 'err' : ''}`} type="text" value={form.policeId} onChange={update('policeId')} placeholder={t('field.policeIdPlaceholder')} />
                                        </div>
                                        {errors.policeId && <p className="as-field-err"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>{errors.policeId}</p>}
                                    </div>

                                    {/* Full Name */}
                                    <div>
                                        <label className="as-field-label">{t('field.fullName')}<span>*</span></label>
                                        <div className="as-input-wrap">
                                            <span className="as-input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg></span>
                                            <input className={`as-input has-icon ${errors.fullName ? 'err' : ''}`} type="text" value={form.fullName} onChange={update('fullName')} placeholder={t('field.fullNamePlaceholder')} />
                                        </div>
                                        {errors.fullName && <p className="as-field-err"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>{errors.fullName}</p>}
                                    </div>

                                    {/* DOB */}
                                    <div>
                                        <label className="as-field-label">{t('field.dob')}<span>*</span></label>
                                        <input className={`as-input ${errors.dob ? 'err' : ''}`} type="date" value={form.dob} onChange={update('dob')} />
                                        {errors.dob && <p className="as-field-err"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>{errors.dob}</p>}
                                    </div>

                                    {/* ID Card Upload */}
                                    <div>
                                        <label className="as-field-label">{t('field.idCard')}</label>
                                        <div className="as-file-wrap">
                                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={update('idCardFile')} />
                                            <div className="as-file-display">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                                <span>{form.idCardFile ? `✓ ${form.idCardFile.name}` : t('field.idCardPlaceholder')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Account Credentials section */}
                                <div className="as-section-divider" style={{ marginTop: '24px' }}>
                                    <div className="as-section-divider-line" />
                                    <span>{t('signup.authority.accountCredentials')}</span>
                                    <div className="as-section-divider-line" />
                                </div>

                                <div className="as-fields">
                                    {/* Email */}
                                    <div>
                                        <label className="as-field-label">{t('field.email')}<span>*</span></label>
                                        <div className="as-input-wrap">
                                            <span className="as-input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="16" rx="3" /><path d="M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg></span>
                                            <input className={`as-input has-icon ${errors.email ? 'err' : ''}`} type="email" value={form.email} onChange={update('email')} placeholder={t('field.officialEmail')} />
                                        </div>
                                        {errors.email && <p className="as-field-err"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>{errors.email}</p>}
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label className="as-field-label">{t('field.password')}<span>*</span></label>
                                        <div className="as-input-wrap">
                                            <span className="as-input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="3" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg></span>
                                            <input className={`as-input has-icon has-eye ${errors.password ? 'err' : ''}`} type={showPass ? 'text' : 'password'} value={form.password} onChange={update('password')} placeholder={t('field.passwordPlaceholder')} />
                                            <button type="button" className="as-eye-btn" onClick={() => setShowPass(!showPass)}><EyeIcon open={showPass} /></button>
                                        </div>
                                        {errors.password && <p className="as-field-err"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>{errors.password}</p>}
                                    </div>

                                    {/* Confirm Password */}
                                    <div>
                                        <label className="as-field-label">{t('field.confirmPassword')}<span>*</span></label>
                                        <div className="as-input-wrap">
                                            <span className="as-input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg></span>
                                            <input className={`as-input has-icon has-eye ${errors.confirmPassword ? 'err' : ''}`} type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={update('confirmPassword')} placeholder={t('field.confirmPasswordPlaceholder')} />
                                            <button type="button" className="as-eye-btn" onClick={() => setShowConfirm(!showConfirm)}><EyeIcon open={showConfirm} /></button>
                                        </div>
                                        {errors.confirmPassword && <p className="as-field-err"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>{errors.confirmPassword}</p>}
                                    </div>
                                </div>

                                <button type="submit" disabled={loading} className="as-submit">
                                    {loading ? <><div className="as-spin" /><span>{t('btn.creating')}</span></> : t('signup.authority.createAccount')}
                                </button>
                            </form>
                        </div>
                    </div>

                    <p className="as-footer">
                        {t('btn.alreadyRegistered')} <Link to="/">{t('btn.signIn')}</Link>
                    </p>
                </div>
            </div>
        </>
    );
}