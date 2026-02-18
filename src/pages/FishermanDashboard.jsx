import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAlerts } from '../contexts/AlertContext';
import { useSOS } from '../contexts/SOSContext';
import { useTranslation } from '../contexts/TranslationContext';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import MapView from '../components/MapView';
import ActionButton from '../components/ActionButton';
import SOSStatusPanel from '../components/SOSStatusPanel';
import WeatherWidget from '../components/WeatherWidget';
import NMEAConsole from '../components/NMEAConsole';
import ProximityChat from '../components/ProximityChat';
import { watchPosition, getBoatStatus, formatDistance, formatCoord } from '../services/locationService';
import { Radio, Terminal, X } from 'lucide-react';

export default function FishermanDashboard() {
    const { user } = useAuth();
    const { sendBorder } = useAlerts();
    const { triggerSOS, triggerBorderAlert, connectivity, lastSOS, hasPendingSOS, channelAvailability } = useSOS();
    const { t } = useTranslation();

    const [location, setLocation] = useState(null);
    const [locError, setLocError] = useState('');
    const [boatStatus, setBoatStatus] = useState({ status: 'safe', distance: 0 });
    const [showFishZones, setShowFishZones] = useState(false);
    const [showSosConfirm, setShowSosConfirm] = useState(false);
    const [sosSent, setSosSent] = useState(false);
    const [sosDeliveryState, setSOSDeliveryState] = useState(null);
    const [alertDismissed, setAlertDismissed] = useState(false);
    const [shareMsg, setShareMsg] = useState('');
    const [showSOSPanel, setShowSOSPanel] = useState(false);
    const [showWeather, setShowWeather] = useState(false);
    const [showNMEA, setShowNMEA] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const borderAlertSentRef = useRef(false);
    const prevStatusRef = useRef('safe');

    useEffect(() => {
        const stop = watchPosition(
            (pos) => { setLocation(pos); setLocError(''); setBoatStatus(getBoatStatus(pos)); },
            (err) => { setLocError(err.message); setLocation({ lat: 10.05, lng: 79.70, accuracy: 50 }); setBoatStatus({ status: 'safe', distance: 25000 }); }
        );
        return stop;
    }, []);

    useEffect(() => {
        if (boatStatus.status === 'danger' && prevStatusRef.current !== 'danger' && !borderAlertSentRef.current) {
            borderAlertSentRef.current = true;
            sendBorder({ fishermanId: user.id, fishermanName: user.fullName, boatNumber: user.boatNumber, location });
            triggerBorderAlert({ fishermanId: user.id, fishermanName: user.fullName, boatNumber: user.boatNumber, location });
            setAlertDismissed(false);
        }
        if (boatStatus.status === 'safe') borderAlertSentRef.current = false;
        prevStatusRef.current = boatStatus.status;
    }, [boatStatus.status, location, user, sendBorder, triggerBorderAlert]);

    useEffect(() => {
        const handlePeerSOS = (e) => {
            const sos = e.detail;
            alert(`🚨 SOS RECEIVED FROM ${sos.boatNumber} 🚨\nSee Map/Chat for details.`);
        };
        window.addEventListener('cg_sos_received', handlePeerSOS);
        return () => window.removeEventListener('cg_sos_received', handlePeerSOS);
    }, []);

    useEffect(() => {
        if (lastSOS) {
            if (lastSOS.event === 'sos_delivered') {
                setSOSDeliveryState('delivered');
                setTimeout(() => { setSOSDeliveryState(null); setShowSOSPanel(false); }, 8000);
            } else if (lastSOS.event === 'sos_cached') {
                setSOSDeliveryState('cached');
            } else if (lastSOS.event === 'sos_queued') {
                setSOSDeliveryState('sending');
            }
        }
    }, [lastSOS]);

    const handleSOS = useCallback(async () => {
        if (!location) return;
        setShowSosConfirm(false);
        setSosSent(true);
        setShowSOSPanel(true);
        setSOSDeliveryState('sending');
        await triggerSOS({ type: 'sos', fishermanId: user.id, fishermanName: user.fullName, boatNumber: user.boatNumber, location });
        setTimeout(() => setSosSent(false), 8000);
    }, [location, user, triggerSOS]);

    const handleShareLocation = useCallback(() => {
        if (!location) return;
        setShareMsg(t('dashboard.locationShared'));
        setTimeout(() => setShareMsg(''), 3000);
    }, [location, t]);

    return (
        <div className="h-dvh bg-slate-950 flex flex-col relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(6,182,212,0.1),rgba(0,0,0,0)_50%)] pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#06b6d4 1px, transparent 1px), linear-gradient(90deg, #06b6d4 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <Navbar />

            {/* ── Mesh Chat Modal ── */}
            {showChat && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        background: 'rgba(0,0,0,0.75)',
                        backdropFilter: 'blur(6px)',
                        display: 'flex', alignItems: 'stretch',
                    }}
                    onClick={(e) => { if (e.target === e.currentTarget) setShowChat(false); }}
                >
                    <div style={{
                        position: 'relative', width: '100%', maxWidth: '480px',
                        margin: 'auto',
                        height: '90dvh',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
                        border: '1px solid rgba(6,182,212,0.2)',
                    }}>
                        <button
                            onClick={() => setShowChat(false)}
                            style={{
                                position: 'absolute', top: '12px', right: '12px', zIndex: 10,
                                width: '32px', height: '32px', borderRadius: '8px',
                                background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)',
                                color: 'white', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            <X size={16} />
                        </button>
                        <ProximityChat />
                    </div>
                </div>
            )}

            {/* ── NMEA Console Modal ── */}
            {showNMEA && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        background: 'rgba(0,0,0,0.75)',
                        backdropFilter: 'blur(6px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    onClick={(e) => { if (e.target === e.currentTarget) setShowNMEA(false); }}
                >
                    <div style={{
                        position: 'relative', width: '100%', maxWidth: '600px',
                        maxHeight: '80dvh',
                        margin: '20px',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
                        border: '1px solid rgba(34,197,94,0.2)',
                    }}>
                        <button
                            onClick={() => setShowNMEA(false)}
                            style={{
                                position: 'absolute', top: '12px', right: '12px', zIndex: 10,
                                width: '32px', height: '32px', borderRadius: '8px',
                                background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)',
                                color: 'white', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            <X size={16} />
                        </button>
                        <NMEAConsole isOpen={showNMEA} onClose={() => setShowNMEA(false)} />
                    </div>
                </div>
            )}

            {/* Main Application Shell */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden relative">

                {/* ─── Map View ─── */}
                <div className="w-full h-[50dvh] lg:h-full lg:flex-1 relative order-2 lg:order-1 bg-slate-900/50 shrink-0">
                    <MapView userLocation={location} showBoundary showFishZones={showFishZones} height="h-full" className="rounded-none border-0" />

                    {/* Map coordinate overlays */}
                    <div className="absolute bottom-4 left-4 right-4 z-[400] flex gap-2 sm:gap-3 pointer-events-none">
                        <div className="flex-1 max-w-[120px] bg-black/80 backdrop-blur border border-white/10 rounded-lg p-2 text-center pointer-events-auto">
                            <p className="text-[10px] text-cyan-500/80 font-bold uppercase tracking-wider mb-0.5">Latitude</p>
                            <p className="text-xs font-mono text-white">{location ? formatCoord(location.lat, 'lat') : '—'}</p>
                        </div>
                        <div className="flex-1 max-w-[120px] bg-black/80 backdrop-blur border border-white/10 rounded-lg p-2 text-center pointer-events-auto">
                            <p className="text-[10px] text-cyan-500/80 font-bold uppercase tracking-wider mb-0.5">Longitude</p>
                            <p className="text-xs font-mono text-white">{location ? formatCoord(location.lng, 'lng') : '—'}</p>
                        </div>
                        <div className={`flex-1 max-w-[140px] backdrop-blur border rounded-lg p-2 text-center pointer-events-auto ${boatStatus.status === 'safe' ? 'bg-emerald-950/80 border-emerald-500/30' : 'bg-rose-950/80 border-rose-500/30'}`}>
                            <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${boatStatus.status === 'safe' ? 'text-emerald-500' : 'text-rose-500'}`}>To Border</p>
                            <p className={`text-xs font-mono font-bold ${boatStatus.status === 'safe' ? 'text-emerald-400' : 'text-rose-400'}`}>{formatDistance(boatStatus.distance)}</p>
                        </div>
                    </div>
                </div>

                {/* ─── Right Control Panel ─── */}
                <div className="w-full lg:w-[420px] bg-slate-950/95 backdrop-blur-xl border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col order-1 lg:order-2 z-30 shadow-2xl shrink-0">

                    <div className="flex-1 lg:overflow-y-auto lg:overflow-x-hidden p-4 space-y-4">

                        {/* Status Card */}
                        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="flex items-start justify-between relative z-10">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-cyan-500/60 uppercase tracking-[0.2em] mb-1">Vessel ID</p>
                                    <h1 className="text-3xl font-black text-white tracking-tighter leading-none bg-gradient-to-br from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
                                        {user?.boatNumber || 'N/A'}
                                    </h1>
                                    <p className="text-xs text-slate-400 font-medium tracking-wide flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                        {user?.fullName}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-3">
                                    <StatusBadge status={boatStatus.status} large />
                                    <SOSStatusPanel compact />
                                </div>
                            </div>
                        </div>

                        {/* Alerts */}
                        <div className="space-y-3">
                            {sosSent && sosDeliveryState === 'delivered' && (
                                <div className="animate-slide-down bg-emerald-950/90 border border-emerald-500/50 rounded-xl p-4 shadow-[0_0_30px_rgba(16,185,129,0.2)] flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30"><span className="text-lg">✅</span></div>
                                    <div>
                                        <p className="text-emerald-400 font-bold text-sm tracking-wide uppercase">SOS Delivered</p>
                                        <p className="text-emerald-200/70 text-xs">Via {lastSOS?.sos?.delivery?.channel || 'Secure Mesh'}</p>
                                    </div>
                                </div>
                            )}
                            {sosSent && sosDeliveryState === 'cached' && (
                                <div className="animate-slide-down bg-amber-950/90 border border-amber-500/50 rounded-xl p-4 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30"><span className="text-lg animate-pulse">📦</span></div>
                                    <div>
                                        <p className="text-amber-400 font-bold text-sm tracking-wide uppercase">Stored Offline</p>
                                        <p className="text-amber-200/70 text-xs">Will auto-transmit when signal detected</p>
                                    </div>
                                </div>
                            )}
                            {sosSent && sosDeliveryState === 'sending' && (
                                <div className="animate-slide-down bg-rose-950/90 border border-rose-500/50 rounded-xl p-4 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                                        <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                    <div>
                                        <p className="text-rose-400 font-bold text-sm tracking-wide uppercase">Transmitting SOS</p>
                                        <p className="text-rose-200/70 text-xs">Scanning all available frequencies...</p>
                                    </div>
                                </div>
                            )}
                            {!sosSent && !alertDismissed && boatStatus.status === 'warning' && (
                                <div className="animate-fade-in bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 flex justify-between items-center backdrop-blur-sm">
                                    <span className="text-amber-400 text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />Approaching Border
                                    </span>
                                    <button onClick={() => setAlertDismissed(true)} className="text-amber-500/50 hover:text-amber-400">✕</button>
                                </div>
                            )}
                            {!sosSent && !alertDismissed && boatStatus.status === 'danger' && (
                                <div className="animate-fade-in bg-rose-950/60 border border-rose-500/50 rounded-xl p-3 flex justify-between items-center backdrop-blur-sm">
                                    <span className="text-rose-400 text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />Boundary Crossed
                                    </span>
                                    <button onClick={() => setAlertDismissed(true)} className="text-rose-500/50 hover:text-rose-400">✕</button>
                                </div>
                            )}
                        </div>

                        {/* Location Error */}
                        {locError && (
                            <div className="animate-fade-in bg-slate-900/50 border border-rose-500/20 rounded-xl px-4 py-2 text-[10px] font-mono text-rose-300/80 flex items-center gap-2">
                                <span className="text-rose-500">⚠</span>SIMULATION MODE: {locError}
                            </div>
                        )}

                        {/* GPS Indicator */}
                        {location?.accuracy && (
                            <div className="flex justify-center">
                                <div className="inline-flex items-center gap-2 bg-safe/10 border border-safe/20 px-3 py-1 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
                                    <span className="text-[10px] font-semibold text-safe">{t('dashboard.gpsActive')} · ±{Math.round(location.accuracy)}m</span>
                                </div>
                            </div>
                        )}

                        {/* Weather Widget */}
                        <div className="animate-fade-in">
                            <button
                                onClick={() => setShowWeather(!showWeather)}
                                className="w-full flex items-center justify-between py-3 px-4 bg-slate-900/40 rounded-xl border border-white/5 hover:bg-slate-800/60 hover:border-cyan-500/30 transition-all btn-press group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:border-blue-500/50 transition-colors">
                                        <span className="text-sm">🌊</span>
                                    </div>
                                    <p className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">Sea Conditions</p>
                                </div>
                                <div className={`w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-slate-400 transition-transform duration-300 ${showWeather ? 'rotate-180 bg-cyan-500/20 text-cyan-400' : ''}`}>▼</div>
                            </button>
                            {showWeather && <div className="mt-2 animate-scale-in"><WeatherWidget location={location} /></div>}
                        </div>

                        {/* SOS Status Panel */}
                        {showSOSPanel && (
                            <div className="animate-scale-in border border-white/5 rounded-2xl bg-slate-900/30 p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-[13px] font-extrabold text-white">📡 SOS Delivery Status</h3>
                                    <button onClick={() => setShowSOSPanel(false)} className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-all text-[10px]">✕</button>
                                </div>
                                <SOSStatusPanel />
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 gap-3">
                            <ActionButton label={t('dashboard.shareLocation')} icon="📍" variant="ocean" fullWidth size="md" onClick={handleShareLocation} />
                            <ActionButton label={showFishZones ? t('dashboard.hideZones') : t('dashboard.fishZones')} icon="🐟" variant="aqua" fullWidth size="md" onClick={() => setShowFishZones(!showFishZones)} />
                        </div>

                        {/* ── Mesh Chat + NMEA buttons ── */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setShowChat(true)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: '8px', padding: '12px',
                                    background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                                    border: '1px solid rgba(6,182,212,0.25)',
                                    borderRadius: '12px', cursor: 'pointer',
                                    color: '#22d3ee', fontSize: '11px', fontWeight: '800',
                                    letterSpacing: '0.08em',
                                    transition: 'all 0.2s',
                                    fontFamily: 'inherit',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(6,182,212,0.6)'; e.currentTarget.style.background = 'linear-gradient(135deg, #164e63, #0f172a)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(6,182,212,0.25)'; e.currentTarget.style.background = 'linear-gradient(135deg, #1e293b, #0f172a)'; }}
                            >
                                <Radio size={16} />
                                MESH CHAT
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowNMEA(true)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: '8px', padding: '12px',
                                    background: 'linear-gradient(135deg, #0f1f0f, #0f172a)',
                                    border: '1px solid rgba(34,197,94,0.25)',
                                    borderRadius: '12px', cursor: 'pointer',
                                    color: '#4ade80', fontSize: '11px', fontWeight: '800',
                                    letterSpacing: '0.08em',
                                    transition: 'all 0.2s',
                                    fontFamily: 'inherit',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(34,197,94,0.6)'; e.currentTarget.style.background = 'linear-gradient(135deg, #14532d, #0f172a)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(34,197,94,0.25)'; e.currentTarget.style.background = 'linear-gradient(135deg, #0f1f0f, #0f172a)'; }}
                            >
                                <Terminal size={16} />
                                NMEA LOGS
                            </button>
                        </div>

                        {shareMsg && (
                            <div className="text-center text-xs font-bold text-emerald-400 animate-fade-in">{shareMsg}</div>
                        )}
                    </div>

                    {/* Fixed SOS Button */}
                    <div className="p-4 border-t border-white/10 bg-slate-950/50 backdrop-blur-md">
                        {showSosConfirm ? (
                            <div className="bg-danger/[0.06] border-2 border-danger/25 rounded-[20px] p-4 animate-scale-in">
                                <p className="text-[14px] font-extrabold text-danger text-center mb-1">{t('dashboard.confirmSOS')}</p>
                                <p className="text-[11px] text-text-secondary text-center mb-2">{t('dashboard.sosMessage')}</p>
                                <div className="flex justify-center gap-3 mb-4">
                                    {Object.entries({ internet: '🌐', satellite: '🛰️', ais: '📡' }).map(([key, icon]) => (
                                        <div key={key} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${channelAvailability[key] ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-400'}`}>
                                            <span>{icon}</span>
                                            <span className={`w-[5px] h-[5px] rounded-full ${channelAvailability[key] ? 'bg-green-500' : 'bg-red-400'}`} />
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setShowSosConfirm(false)} className="py-3 bg-gray-100 text-text-primary font-bold text-[13px] rounded-xl hover:bg-gray-200 transition-colors">{t('dashboard.cancel')}</button>
                                    <button onClick={handleSOS} className="py-3 text-white font-bold text-[13px] rounded-xl btn-gradient-danger">{t('dashboard.sendSOS')}</button>
                                </div>
                            </div>
                        ) : (
                            <ActionButton label={t('dashboard.sosEmergency')} icon="🚨" variant="danger" fullWidth size="xl" onClick={() => setShowSosConfirm(true)} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}