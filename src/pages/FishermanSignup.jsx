import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/TranslationContext';
import { ROLES } from '../utils/constants';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function FishermanSignup() {
    const navigate = useNavigate();
    const { signup } = useAuth();
    const { t } = useTranslation();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        fullName: '', dob: '', phone: '', address: '',
        boatNumber: '', licenseNumber: '', boatLicenseFile: null,
        email: '', password: '', confirmPassword: '',
    });
    const [errors, setErrors] = useState({});
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const STEPS = [t('signup.step.personalInfo'), t('signup.step.boatDetails'), t('signup.step.credentials')];

    const update = (field) => (e) => {
        const val = e.target.type === 'file' ? e.target.files[0] : e.target.value;
        setForm((f) => ({ ...f, [field]: val }));
        setErrors((er) => ({ ...er, [field]: '' }));
    };

    const validateStep = () => {
        const errs = {};
        if (step === 0) {
            if (!form.fullName.trim()) errs.fullName = t('error.fullNameRequired');
            if (!form.dob) errs.dob = t('error.dobRequired');
            if (!form.phone.trim()) errs.phone = t('error.phoneRequired');
            if (!form.address.trim()) errs.address = t('error.addressRequired');
        } else if (step === 1) {
            if (!form.boatNumber.trim()) errs.boatNumber = t('error.boatNumberRequired');
            if (!form.licenseNumber.trim()) errs.licenseNumber = t('error.licenseRequired');
        } else if (step === 2) {
            if (!form.email.trim()) errs.email = t('error.emailRequired');
            if (!form.password) errs.password = t('error.passwordRequired');
            if (form.password.length < 6) errs.password = t('error.passwordMin');
            if (form.password !== form.confirmPassword) errs.confirmPassword = t('error.passwordMismatch');
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const nextStep = () => { if (validateStep()) setStep((s) => Math.min(s + 1, 2)); };
    const prevStep = () => setStep((s) => Math.max(s - 1, 0));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep()) return;
        setLoading(true); setError('');
        try {
            await signup({
                fullName: form.fullName, dob: form.dob, phone: form.phone,
                address: form.address, boatNumber: form.boatNumber.toUpperCase(),
                licenseNumber: form.licenseNumber.toUpperCase(),
                boatLicenseFile: form.boatLicenseFile?.name || null,
                email: form.email, password: form.password
            }, ROLES.FISHERMAN);
            navigate('/dashboard');
        } catch (err) { setError(err.message); setLoading(false); }
    };

    const EyeIcon = ({ open }) => open ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
    ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
    );

    const CheckIcon = () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
    );

    return (
        <>
            <style>{`
                .fs-root {
                    min-height: 100dvh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                    background: #05121f;
                    font-family: 'Inter', system-ui, sans-serif;
                }

                .fs-bg {
                    position: absolute; inset: 0;
                    background:
                        radial-gradient(ellipse 80% 60% at 25% 0%, rgba(28,167,166,0.2) 0%, transparent 60%),
                        radial-gradient(ellipse 60% 50% at 85% 90%, rgba(42,157,143,0.14) 0%, transparent 55%),
                        linear-gradient(170deg, #061828 0%, #0a3248 50%, #07243a 100%);
                }

                .fs-dots {
                    position: absolute; inset: 0;
                    background-image: radial-gradient(rgba(28,167,166,0.1) 1px, transparent 1px);
                    background-size: 28px 28px;
                    mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent);
                }

                .fs-orb1 {
                    position: absolute;
                    width: 380px; height: 380px; border-radius: 50%;
                    background: radial-gradient(circle, rgba(28,167,166,0.13) 0%, transparent 70%);
                    top: -100px; left: -60px;
                    animation: fsFloat 9s ease-in-out infinite;
                    pointer-events: none;
                }
                .fs-orb2 {
                    position: absolute;
                    width: 300px; height: 300px; border-radius: 50%;
                    background: radial-gradient(circle, rgba(42,157,143,0.1) 0%, transparent 70%);
                    bottom: -80px; right: -40px;
                    animation: fsFloat 11s ease-in-out infinite reverse;
                    pointer-events: none;
                }

                /* ── Lang + top nav ── */
                .fs-topbar {
                    position: absolute;
                    top: 18px; right: 18px;
                    z-index: 100;
                }

                /* ── Content ── */
                .fs-content {
                    position: relative; z-index: 10;
                    width: 100%;
                    max-width: 440px;
                    padding: 28px 20px 36px;
                    display: flex;
                    flex-direction: column;
                }

                /* ── Back link ── */
                .fs-back {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    color: rgba(255,255,255,0.4);
                    font-size: 13px;
                    font-weight: 600;
                    text-decoration: none;
                    margin-bottom: 24px;
                    transition: color 0.2s;
                    width: fit-content;
                }
                .fs-back:hover { color: rgba(255,255,255,0.85); }
                .fs-back svg { transition: transform 0.2s; }
                .fs-back:hover svg { transform: translateX(-3px); }

                /* ── Header ── */
                .fs-header {
                    text-align: center;
                    margin-bottom: 28px;
                    animation: fsFadeUp 0.6s cubic-bezier(.16,1,.3,1) both;
                }
                .fs-header h1 {
                    font-size: 28px;
                    font-weight: 900;
                    color: #fff;
                    letter-spacing: -0.5px;
                    margin: 0 0 6px;
                }
                .fs-header p {
                    font-size: 13px;
                    font-weight: 500;
                    color: rgba(28,167,166,0.8);
                    margin: 0;
                }

                /* ── Stepper ── */
                .fs-stepper {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    position: relative;
                    margin-bottom: 28px;
                    animation: fsFadeUp 0.6s cubic-bezier(.16,1,.3,1) 0.05s both;
                }

                .fs-stepper-track {
                    position: absolute;
                    top: 18px; left: 44px; right: 44px;
                    height: 3px;
                    background: rgba(255,255,255,0.08);
                    border-radius: 99px;
                    overflow: hidden;
                }

                .fs-stepper-fill {
                    height: 100%;
                    border-radius: 99px;
                    background: linear-gradient(90deg, #1CA7A6, #2A9D8F);
                    transition: width 0.5s cubic-bezier(.16,1,.3,1);
                    box-shadow: 0 0 8px rgba(28,167,166,0.5);
                }

                .fs-step {
                    position: relative; z-index: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    min-width: 80px;
                }

                .fs-step-circle {
                    width: 36px; height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 13px;
                    font-weight: 800;
                    transition: all 0.3s cubic-bezier(.16,1,.3,1);
                }

                .fs-step-circle.done {
                    background: linear-gradient(135deg, #1CA7A6, #2A9D8F);
                    color: #fff;
                    box-shadow: 0 4px 14px rgba(28,167,166,0.4);
                }
                .fs-step-circle.active {
                    background: linear-gradient(135deg, #1CA7A6, #2A9D8F);
                    color: #fff;
                    box-shadow: 0 4px 18px rgba(28,167,166,0.5);
                    transform: scale(1.1);
                }
                .fs-step-circle.inactive {
                    background: rgba(255,255,255,0.07);
                    color: rgba(255,255,255,0.3);
                    border: 2px solid rgba(255,255,255,0.1);
                }

                .fs-step-label {
                    font-size: 9px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    text-align: center;
                    transition: color 0.3s;
                }
                .fs-step-label.active-lbl { color: rgba(255,255,255,0.85); }
                .fs-step-label.inactive-lbl { color: rgba(255,255,255,0.22); }

                /* ── Card ── */
                .fs-card {
                    border-radius: 26px;
                    overflow: hidden;
                    box-shadow:
                        0 40px 100px rgba(0,0,0,0.55),
                        0 0 0 1px rgba(255,255,255,0.08),
                        inset 0 1px 0 rgba(255,255,255,0.1);
                    animation: fsFadeUp 0.6s cubic-bezier(.16,1,.3,1) 0.1s both;
                }

                .fs-card-stripe {
                    height: 3px;
                    background: linear-gradient(90deg, #1CA7A6, #2A9D8F, #1CA7A6);
                    background-size: 200%;
                    animation: fsShimmer 3s ease-in-out infinite;
                }

                .fs-card-body {
                    background: rgba(10,40,65,0.6);
                    backdrop-filter: blur(28px);
                    -webkit-backdrop-filter: blur(28px);
                    padding: 26px 24px 24px;
                }

                /* ── Error ── */
                .fs-error {
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

                /* ── Fields ── */
                .fs-fields { display: flex; flex-direction: column; gap: 15px; }

                .fs-field-label {
                    display: block;
                    font-size: 10px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: rgba(255,255,255,0.32);
                    margin-bottom: 7px;
                    padding-left: 2px;
                }
                .fs-field-label span { color: #E63946; margin-left: 2px; }

                .fs-input-wrap { position: relative; }

                .fs-input-icon {
                    position: absolute;
                    left: 14px; top: 50%;
                    transform: translateY(-50%);
                    color: rgba(255,255,255,0.2);
                    pointer-events: none;
                    display: flex;
                }

                .fs-input {
                    width: 100%;
                    box-sizing: border-box;
                    background: rgba(0,0,0,0.28);
                    border: 1px solid rgba(255,255,255,0.09);
                    border-radius: 14px;
                    padding: 14px 16px;
                    font-size: 14px;
                    font-family: inherit;
                    color: #fff;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
                }
                .fs-input.has-icon { padding-left: 44px; }
                .fs-input.has-eye  { padding-right: 44px; }

                .fs-input::placeholder { color: rgba(255,255,255,0.18); }

                .fs-input:focus {
                    border-color: rgba(28,167,166,0.6);
                    background: rgba(0,0,0,0.4);
                    box-shadow: 0 0 0 3px rgba(28,167,166,0.12);
                }

                .fs-input.error-input {
                    border-color: rgba(230,57,70,0.5);
                }
                .fs-input.error-input:focus {
                    box-shadow: 0 0 0 3px rgba(230,57,70,0.12);
                }

                /* date input color fix */
                .fs-input[type="date"]::-webkit-calendar-picker-indicator {
                    filter: invert(0.6);
                    cursor: pointer;
                }

                .fs-textarea {
                    width: 100%;
                    box-sizing: border-box;
                    background: rgba(0,0,0,0.28);
                    border: 1px solid rgba(255,255,255,0.09);
                    border-radius: 14px;
                    padding: 14px 16px;
                    font-size: 14px;
                    font-family: inherit;
                    color: #fff;
                    outline: none;
                    resize: none;
                    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
                }
                .fs-textarea::placeholder { color: rgba(255,255,255,0.18); }
                .fs-textarea:focus {
                    border-color: rgba(28,167,166,0.6);
                    background: rgba(0,0,0,0.4);
                    box-shadow: 0 0 0 3px rgba(28,167,166,0.12);
                }
                .fs-textarea.error-input { border-color: rgba(230,57,70,0.5); }

                .fs-eye-btn {
                    position: absolute;
                    right: 14px; top: 50%;
                    transform: translateY(-50%);
                    background: none; border: none;
                    cursor: pointer;
                    color: rgba(255,255,255,0.28);
                    display: flex; padding: 4px;
                    transition: color 0.2s;
                }
                .fs-eye-btn:hover { color: rgba(255,255,255,0.7); }

                /* file upload */
                .fs-file-wrap {
                    position: relative;
                    cursor: pointer;
                }
                .fs-file-wrap input[type="file"] {
                    position: absolute; inset: 0;
                    opacity: 0; cursor: pointer; z-index: 2;
                    width: 100%;
                }
                .fs-file-display {
                    background: rgba(0,0,0,0.2);
                    border: 1.5px dashed rgba(255,255,255,0.12);
                    border-radius: 14px;
                    padding: 14px 16px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: rgba(255,255,255,0.28);
                    font-size: 13px;
                    transition: all 0.2s;
                }
                .fs-file-wrap:hover .fs-file-display {
                    border-color: rgba(28,167,166,0.35);
                    color: rgba(255,255,255,0.6);
                    background: rgba(28,167,166,0.05);
                }

                /* ── Field error msg ── */
                .fs-field-error {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 11px;
                    font-weight: 700;
                    color: #f08080;
                    margin-top: 5px;
                    padding-left: 2px;
                }

                /* ── Buttons row ── */
                .fs-btn-row {
                    display: flex;
                    gap: 10px;
                    margin-top: 24px;
                }

                .fs-btn-back {
                    flex: 1;
                    padding: 15px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 14px;
                    color: rgba(255,255,255,0.7);
                    font-size: 14px;
                    font-weight: 700;
                    font-family: inherit;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .fs-btn-back:hover {
                    background: rgba(255,255,255,0.08);
                    color: #fff;
                }

                .fs-btn-next {
                    flex: 1;
                    padding: 15px;
                    border: none;
                    border-radius: 14px;
                    background: linear-gradient(135deg, #1CA7A6, #2A9D8F);
                    color: #fff;
                    font-size: 14px;
                    font-weight: 800;
                    font-family: inherit;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: box-shadow 0.2s, transform 0.15s;
                    box-shadow: 0 8px 24px rgba(28,167,166,0.35);
                }
                .fs-btn-next:hover:not(:disabled) {
                    box-shadow: 0 12px 32px rgba(28,167,166,0.45);
                    transform: translateY(-1px);
                }
                .fs-btn-next:active:not(:disabled) { transform: scale(0.98); }
                .fs-btn-next:disabled { opacity: 0.58; cursor: not-allowed; }

                .fs-spin {
                    width: 16px; height: 16px;
                    border: 2.5px solid rgba(255,255,255,0.3);
                    border-top-color: #fff;
                    border-radius: 50%;
                    animation: fsSpin 0.65s linear infinite;
                }

                /* ── Footer ── */
                .fs-footer {
                    text-align: center;
                    font-size: 12px;
                    color: rgba(255,255,255,0.25);
                    margin-top: 20px;
                    font-weight: 500;
                }
                .fs-footer a {
                    color: rgba(28,167,166,0.8);
                    font-weight: 700;
                    text-decoration: none;
                    transition: color 0.2s;
                }
                .fs-footer a:hover { color: #1CA7A6; }

                /* ── Animations ── */
                @keyframes fsFadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes fsFloat {
                    0%, 100% { transform: translateY(0); }
                    50%      { transform: translateY(-16px); }
                }
                @keyframes fsSpin { to { transform: rotate(360deg); } }
                @keyframes fsShimmer {
                    0%   { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>

            <div className="fs-root">
                <div className="fs-bg" />
                <div className="fs-dots" />
                <div className="fs-orb1" />
                <div className="fs-orb2" />

                <div className="fs-topbar"><LanguageSwitcher /></div>

                <div className="fs-content">
                    {/* Back */}
                    <Link to="/" className="fs-back">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                        {t('btn.backToLogin')}
                    </Link>

                    {/* Header */}
                    <div className="fs-header">
                        <h1>{t('signup.fisherman.title')}</h1>
                        <p>{t('signup.fisherman.subtitle')}</p>
                    </div>

                    {/* Stepper */}
                    <div className="fs-stepper">
                        <div className="fs-stepper-track">
                            <div className="fs-stepper-fill" style={{ width: step === 0 ? '0%' : step === 1 ? '50%' : '100%' }} />
                        </div>
                        {STEPS.map((s, i) => (
                            <div key={i} className="fs-step">
                                <div className={`fs-step-circle ${i < step ? 'done' : i === step ? 'active' : 'inactive'}`}>
                                    {i < step ? <CheckIcon /> : i + 1}
                                </div>
                                <span className={`fs-step-label ${i <= step ? 'active-lbl' : 'inactive-lbl'}`}>{s}</span>
                            </div>
                        ))}
                    </div>

                    {/* Card */}
                    <div className="fs-card">
                        <div className="fs-card-stripe" />
                        <div className="fs-card-body">
                            {error && (
                                <div className="fs-error">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                {/* Step 0 — Personal Info */}
                                {step === 0 && (
                                    <div className="fs-fields">
                                        <div>
                                            <label className="fs-field-label">{t('field.fullName')}<span>*</span></label>
                                            <div className="fs-input-wrap">
                                                <span className="fs-input-icon">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                                </span>
                                                <input className={`fs-input has-icon ${errors.fullName ? 'error-input' : ''}`} type="text" value={form.fullName} onChange={update('fullName')} placeholder={t('field.fullNamePlaceholder')} />
                                            </div>
                                            {errors.fullName && <p className="fs-field-error"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>{errors.fullName}</p>}
                                        </div>

                                        <div>
                                            <label className="fs-field-label">{t('field.dob')}<span>*</span></label>
                                            <input className={`fs-input ${errors.dob ? 'error-input' : ''}`} type="date" value={form.dob} onChange={update('dob')} />
                                            {errors.dob && <p className="fs-field-error"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>{errors.dob}</p>}
                                        </div>

                                        <div>
                                            <label className="fs-field-label">{t('field.phone')}<span>*</span></label>
                                            <div className="fs-input-wrap">
                                                <span className="fs-input-icon">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                                                </span>
                                                <input className={`fs-input has-icon ${errors.phone ? 'error-input' : ''}`} type="tel" value={form.phone} onChange={update('phone')} placeholder={t('field.phonePlaceholder')} />
                                            </div>
                                            {errors.phone && <p className="fs-field-error"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>{errors.phone}</p>}
                                        </div>

                                        <div>
                                            <label className="fs-field-label">{t('field.address')}<span>*</span></label>
                                            <textarea className={`fs-textarea ${errors.address ? 'error-input' : ''}`} value={form.address} onChange={update('address')} placeholder={t('field.addressPlaceholder')} rows={3} />
                                            {errors.address && <p className="fs-field-error"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>{errors.address}</p>}
                                        </div>
                                    </div>
                                )}

                                {/* Step 1 — Boat Details */}
                                {step === 1 && (
                                    <div className="fs-fields">
                                        <div>
                                            <label className="fs-field-label">{t('field.boatNumber')}<span>*</span></label>
                                            <div className="fs-input-wrap">
                                                <span className="fs-input-icon">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 19h16" /><path d="M4 19l2-9h12l2 9" /><path d="M8 10V6a4 4 0 0 1 8 0v4" /></svg>
                                                </span>
                                                <input className={`fs-input has-icon ${errors.boatNumber ? 'error-input' : ''}`} type="text" value={form.boatNumber} onChange={update('boatNumber')} placeholder={t('field.boatNumberPlaceholder')} />
                                            </div>
                                            {errors.boatNumber && <p className="fs-field-error"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>{errors.boatNumber}</p>}
                                        </div>

                                        <div>
                                            <label className="fs-field-label">{t('field.licenseNumber')}<span>*</span></label>
                                            <div className="fs-input-wrap">
                                                <span className="fs-input-icon">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="20" height="18" rx="3" /><line x1="2" y1="9" x2="22" y2="9" /></svg>
                                                </span>
                                                <input className={`fs-input has-icon ${errors.licenseNumber ? 'error-input' : ''}`} type="text" value={form.licenseNumber} onChange={update('licenseNumber')} placeholder={t('field.licensePlaceholder')} />
                                            </div>
                                            {errors.licenseNumber && <p className="fs-field-error"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>{errors.licenseNumber}</p>}
                                        </div>

                                        <div>
                                            <label className="fs-field-label">{t('field.boatLicense')}</label>
                                            <div className="fs-file-wrap">
                                                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={update('boatLicenseFile')} />
                                                <div className="fs-file-display">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                                    <span>{form.boatLicenseFile ? `✓ ${form.boatLicenseFile.name}` : t('field.boatLicensePlaceholder')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2 — Credentials */}
                                {step === 2 && (
                                    <div className="fs-fields">
                                        <div>
                                            <label className="fs-field-label">{t('field.email')}<span>*</span></label>
                                            <div className="fs-input-wrap">
                                                <span className="fs-input-icon">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="16" rx="3" /><path d="M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                                </span>
                                                <input className={`fs-input has-icon ${errors.email ? 'error-input' : ''}`} type="email" value={form.email} onChange={update('email')} placeholder={t('field.emailPlaceholder')} />
                                            </div>
                                            {errors.email && <p className="fs-field-error"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>{errors.email}</p>}
                                        </div>

                                        <div>
                                            <label className="fs-field-label">{t('field.password')}<span>*</span></label>
                                            <div className="fs-input-wrap">
                                                <span className="fs-input-icon">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="3" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                                </span>
                                                <input className={`fs-input has-icon has-eye ${errors.password ? 'error-input' : ''}`} type={showPass ? 'text' : 'password'} value={form.password} onChange={update('password')} placeholder={t('field.passwordPlaceholder')} />
                                                <button type="button" className="fs-eye-btn" onClick={() => setShowPass(!showPass)}><EyeIcon open={showPass} /></button>
                                            </div>
                                            {errors.password && <p className="fs-field-error"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>{errors.password}</p>}
                                        </div>

                                        <div>
                                            <label className="fs-field-label">{t('field.confirmPassword')}<span>*</span></label>
                                            <div className="fs-input-wrap">
                                                <span className="fs-input-icon">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                                </span>
                                                <input className={`fs-input has-icon has-eye ${errors.confirmPassword ? 'error-input' : ''}`} type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={update('confirmPassword')} placeholder={t('field.confirmPasswordPlaceholder')} />
                                                <button type="button" className="fs-eye-btn" onClick={() => setShowConfirm(!showConfirm)}><EyeIcon open={showConfirm} /></button>
                                            </div>
                                            {errors.confirmPassword && <p className="fs-field-error"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>{errors.confirmPassword}</p>}
                                        </div>
                                    </div>
                                )}

                                <div className="fs-btn-row">
                                    {step > 0 && (
                                        <button type="button" className="fs-btn-back" onClick={prevStep}>{t('btn.back')}</button>
                                    )}
                                    {step < 2 ? (
                                        <button type="button" className="fs-btn-next" onClick={nextStep}>
                                            {t('btn.continue')} →
                                        </button>
                                    ) : (
                                        <button type="submit" disabled={loading} className="fs-btn-next">
                                            {loading ? <><div className="fs-spin" /><span>{t('btn.creating')}</span></> : t('btn.createAccount')}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>

                    <p className="fs-footer">
                        {t('btn.alreadyRegistered')} <Link to="/">{t('btn.signIn')}</Link>
                    </p>
                </div>
            </div>
        </>
    );
}