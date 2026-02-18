import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAlerts } from '../contexts/AlertContext';
import { useSOS } from '../contexts/SOSContext';
import { useTranslation } from '../contexts/TranslationContext';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import MapView from '../components/MapView';
import AlertBanner from '../components/AlertBanner';
import ActionButton from '../components/ActionButton';
import SOSStatusPanel from '../components/SOSStatusPanel';
import WeatherWidget from '../components/WeatherWidget';
import NMEAConsole from '../components/NMEAConsole';
import ProximityChat from '../components/ProximityChat';
import { watchPosition, getBoatStatus, formatDistance, formatCoord } from '../services/locationService';
import { Radio, MessageSquare, Terminal } from 'lucide-react';

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
    const [sosDeliveryState, setSOSDeliveryState] = useState(null); // 'sending' | 'delivered' | 'cached'
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

    // Border alert — uses both legacy + SOS engine
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

    // SOS handler — now goes through multi-channel engine
    useEffect(() => {
        const handlePeerSOS = (e) => {
            const sos = e.detail;
            console.log("Dashboard: Peer SOS Received", sos);
            // Show alert or update UI
            alert(`🚨 SOS RECEIVED FROM ${sos.boatNumber} 🚨\nSee Map/Chat for details.`);
            // You could also set state to show a specific overlay
        };
        window.addEventListener('cg_sos_received', handlePeerSOS);
        return () => window.removeEventListener('cg_sos_received', handlePeerSOS);
    }, []);

    // Track SOS delivery state from context
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

    // SOS handler — now goes through multi-channel engine
    const handleSOS = useCallback(async () => {
        if (!location) return;
        setShowSosConfirm(false);
        setSosSent(true);
        setShowSOSPanel(true);
        setSOSDeliveryState('sending');

        await triggerSOS({
            type: 'sos',
            fishermanId: user.id,
            fishermanName: user.fullName,
            boatNumber: user.boatNumber,
            location,
        });

        setTimeout(() => setSosSent(false), 8000);
    }, [location, user, triggerSOS]);

    const handleShareLocation = useCallback(() => {
        if (!location) return;
        setShareMsg(t('dashboard.locationShared'));
        setTimeout(() => setShareMsg(''), 3000);
    }, [location, t]);

    return (
        <div className="min-h-dvh bg-slate-950 flex flex-col relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(6,182,212,0.1),rgba(0,0,0,0)_50%)] pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#06b6d4 1px, transparent 1px), linear-gradient(90deg, #06b6d4 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <Navbar />

            {/* Overlays */}
            <NMEAConsole isOpen={showNMEA} onClose={() => setShowNMEA(false)} />

            {/* Fullscreen Chat Overlay */}
            {showChat && (
                <div className="fixed inset-0 z-50 animate-slide-up">
                    <ProximityChat />
                    <button
                        onClick={() => setShowChat(false)}
                        className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full z-50 hover:bg-black/70 border border-white/10"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* SOS Delivery Banner */}
            <div className="px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4 space-y-2 sm:space-y-3">
                {sosSent && sosDeliveryState === 'delivered' && (
                    <div className="animate-slide-down bg-emerald-950/90 border border-emerald-500/50 rounded-xl p-4 shadow-[0_0_30px_rgba(16,185,129,0.2)] backdrop-blur-md flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                            <span className="text-lg">✅</span>
                        </div>
                        <div>
                            <p className="text-emerald-400 font-bold text-sm tracking-wide uppercase">SOS Delivered</p>
                            <p className="text-emerald-200/70 text-xs">Via {lastSOS?.sos?.delivery?.channel || 'Secure Mesh'}</p>
                        </div>
                    </div>
                )}
                {sosSent && sosDeliveryState === 'cached' && (
                    <div className="animate-slide-down bg-amber-950/90 border border-amber-500/50 rounded-xl p-4 shadow-[0_0_30px_rgba(245,158,11,0.2)] backdrop-blur-md flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                            <span className="text-lg animate-pulse">📦</span>
                        </div>
                        <div>
                            <p className="text-amber-400 font-bold text-sm tracking-wide uppercase">Stored Offline</p>
                            <p className="text-amber-200/70 text-xs">Will auto-transmit when signal detected</p>
                        </div>
                    </div>
                )}
                {sosSent && sosDeliveryState === 'sending' && (
                    <div className="animate-slide-down bg-rose-950/90 border border-rose-500/50 rounded-xl p-4 shadow-[0_0_30px_rgba(244,63,94,0.2)] backdrop-blur-md flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                            <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                        <div>
                            <p className="text-rose-400 font-bold text-sm tracking-wide uppercase">Transmitting SOS</p>
                            <p className="text-rose-200/70 text-xs">Scanning all available frequencies...</p>
                        </div>
                    </div>
                )}

                {/* Border Alerts */}
                {!sosSent && !alertDismissed && boatStatus.status === 'warning' && (
                    <div className="animate-fade-in bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 flex justify-between items-center backdrop-blur-sm">
                        <span className="text-amber-400 text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            Approaching Border
                        </span>
                        <button onClick={() => setAlertDismissed(true)} className="text-amber-500/50 hover:text-amber-400">✕</button>
                    </div>
                )}
                {!sosSent && !alertDismissed && boatStatus.status === 'danger' && (
                    <div className="animate-fade-in bg-rose-950/60 border border-rose-500/50 rounded-xl p-3 flex justify-between items-center backdrop-blur-sm shadow-[0_0_20px_rgba(244,63,94,0.15)]">
                        <span className="text-rose-400 text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                            Boundary Crossed
                        </span>
                        <button onClick={() => setAlertDismissed(true)} className="text-rose-500/50 hover:text-rose-400">✕</button>
                    </div>
                )}
            </div>

            {shareMsg && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-cyan-950/90 border border-cyan-500/50 text-cyan-400 px-6 py-3 rounded-full shadow-[0_0_30px_rgba(6,182,212,0.3)] backdrop-blur-xl text-xs font-bold tracking-widest uppercase animate-slide-down flex items-center gap-2">
                    <span className="text-lg">📍</span>
                    {shareMsg}
                </div>
            )}

            <div className="flex-1 w-full max-w-5xl mx-auto space-y-4 sm:space-y-5">
                {/* Status Card + Channel Status */}
                <div className="px-3 sm:px-4 lg:px-6">
                    <div className="bg-slate-900/40 border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 backdrop-blur-md relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                        <div className="flex items-start justify-between relative z-10">
                            <div className="space-y-1">
                                <p className="text-[8px] sm:text-[9px] font-bold text-cyan-500/60 uppercase tracking-[0.2em] mb-1">Vessel ID</p>
                                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tighter leading-none bg-gradient-to-br from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
                                    {user?.boatNumber || 'N/A'}
                                </h1>
                                <p className="text-xs text-slate-400 font-medium tracking-wide flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-slate-500" />
                                    {user?.fullName}
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <StatusBadge status={boatStatus.status} large />
                                <SOSStatusPanel compact />
                            </div>
                        </div>
                    </div>
                </div>

                {locError && (
                    <div className="px-3 sm:px-4 lg:px-6 animate-fade-in">
                        <div className="bg-slate-900/50 border border-rose-500/20 rounded-xl px-4 py-2 text-[10px] font-mono text-rose-300/80 flex items-center gap-2">
                            <span className="text-rose-500">⚠</span>
                            SIMULATION MODE: {locError}
                        </div>
                    </div>
                )}

                <div className="px-3 sm:px-4 lg:px-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <div className="relative rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
                        <div className="absolute inset-0 z-20 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]" />
                        {/* Scanline effect */}
                        <div className="absolute inset-0 z-20 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px]" />
                        <MapView userLocation={location} showBoundary showFishZones={showFishZones} height="h-[220px] sm:h-[300px] lg:h-[380px]" />

                        {/* Map Overlay Stats */}
                        <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3 z-30 flex gap-1.5 sm:gap-2">
                            <div className="flex-1 bg-black/80 backdrop-blur border border-white/10 rounded-lg p-1.5 sm:p-2 text-center">
                                <p className="text-[8px] sm:text-[9px] text-cyan-500/80 font-bold uppercase tracking-wider mb-0.5">Latitude</p>
                                <p className="text-[10px] sm:text-xs font-mono text-white">{location ? formatCoord(location.lat, 'lat') : '—'}</p>
                            </div>
                            <div className="flex-1 bg-black/80 backdrop-blur border border-white/10 rounded-lg p-1.5 sm:p-2 text-center">
                                <p className="text-[8px] sm:text-[9px] text-cyan-500/80 font-bold uppercase tracking-wider mb-0.5">Longitude</p>
                                <p className="text-[10px] sm:text-xs font-mono text-white">{location ? formatCoord(location.lng, 'lng') : '—'}</p>
                            </div>
                            <div className={`flex-1 backdrop-blur border rounded-lg p-1.5 sm:p-2 text-center ${boatStatus.status === 'safe' ? 'bg-emerald-950/80 border-emerald-500/30' : 'bg-rose-950/80 border-rose-500/30'}`}>
                                <p className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-wider mb-0.5 ${boatStatus.status === 'safe' ? 'text-emerald-500' : 'text-rose-500'}`}>To Border</p>
                                <p className={`text-[10px] sm:text-xs font-mono font-bold ${boatStatus.status === 'safe' ? 'text-emerald-400' : 'text-rose-400'}`}>{formatDistance(boatStatus.distance)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Removed Stats Grid (moved to map overlay) */}

                {location?.accuracy && (
                    <div className="px-4 pb-3 flex justify-center">
                        <div className="inline-flex items-center gap-2 bg-safe/8 px-3.5 py-1.5 rounded-full">
                            <span className="w-[6px] h-[6px] rounded-full bg-safe animate-pulse" />
                            <span className="text-[11px] font-semibold text-safe">{t('dashboard.gpsActive')} · ±{Math.round(location.accuracy)}m</span>
                        </div>
                    </div>
                )}

                {/* Weather & Sea Conditions */}
                <div className="px-3 sm:px-4 lg:px-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <button
                        onClick={() => setShowWeather(!showWeather)}
                        className="w-full flex items-center justify-between py-4 px-5 bg-slate-900/40 rounded-2xl border border-white/5 hover:bg-slate-800/60 hover:border-cyan-500/30 transition-all btn-press group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:border-blue-500/50 transition-colors">
                                <span className="text-lg">�</span>
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">Sea Conditions</p>
                                <p className="text-[10px] text-slate-400 font-medium">Live Wave & Wind Data</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <WeatherWidget location={location} compact />
                            <div className={`w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-slate-400 transition-transform duration-300 ${showWeather ? 'rotate-180 bg-cyan-500/20 text-cyan-400' : ''}`}>
                                ▼
                            </div>
                        </div>
                    </button>

                    {showWeather && (
                        <div className="mt-3 animate-scale-in border-t border-white/5 pt-3">
                            <WeatherWidget location={location} />
                        </div>
                    )}
                </div>

                {/* SOS Delivery Status Panel (expanded) */}
                {showSOSPanel && (
                    <div className="px-3 sm:px-4 lg:px-6 pb-3 animate-scale-in">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[13px] font-extrabold text-text-primary">📡 SOS Delivery Status</h3>
                            <button
                                onClick={() => setShowSOSPanel(false)}
                                className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-text-light hover:bg-gray-200 transition-all btn-press text-[12px]"
                            >✕</button>
                        </div>
                        <SOSStatusPanel />
                    </div>
                )}

                {/* Pending SOS indicator */}
                {hasPendingSOS && !showSOSPanel && (
                    <div className="px-3 sm:px-4 lg:px-6 pb-3 animate-fade-in">
                        <button
                            onClick={() => setShowSOSPanel(true)}
                            className="w-full py-3 bg-amber-50 border border-amber-200 rounded-2xl text-[12px] font-bold text-amber-800 flex items-center justify-center gap-2 btn-press hover:bg-amber-100 transition-colors"
                        >
                            <span>📦</span>
                            <span>SOS queued offline — Tap to view delivery status</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="sticky bottom-0 bg-slate-950/80 backdrop-blur-xl border-t border-white/10 px-3 sm:px-4 py-3 sm:py-5 safe-area-bottom z-40 pb-8 sm:pb-5">
                <div className="max-w-lg mx-auto lg:max-w-2xl space-y-2 sm:space-y-3">
                    {showSosConfirm ? (
                        <div className="bg-danger/[0.06] border-2 border-danger/25 rounded-[16px] sm:rounded-[20px] p-4 sm:p-5 animate-scale-in">
                            <p className="text-[14px] sm:text-[15px] font-extrabold text-danger text-center mb-1">{t('dashboard.confirmSOS')}</p>
                            <p className="text-[11px] sm:text-[12px] text-text-secondary text-center mb-2">{t('dashboard.sosMessage')}</p>
                            {/* Channel availability preview */}
                            <div className="flex justify-center gap-3 mb-4">
                                {Object.entries({ internet: '🌐', satellite: '🛰️', ais: '📡' }).map(([key, icon]) => (
                                    <div key={key} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${channelAvailability[key] ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-400'}`}>
                                        <span>{icon}</span>
                                        <span className={`w-[5px] h-[5px] rounded-full ${channelAvailability[key] ? 'bg-green-500' : 'bg-red-400'}`} />
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                <button onClick={() => setShowSosConfirm(false)} className="py-3 sm:py-3.5 bg-gray-100 text-text-primary font-bold text-[13px] sm:text-[14px] rounded-xl sm:rounded-2xl hover:bg-gray-200 transition-colors btn-press">{t('dashboard.cancel')}</button>
                                <button onClick={handleSOS} className="py-3 sm:py-3.5 text-white font-bold text-[13px] sm:text-[14px] rounded-xl sm:rounded-2xl btn-gradient-danger">{t('dashboard.sendSOS')}</button>
                            </div>
                        </div>
                    ) : (
                        <ActionButton label={t('dashboard.sosEmergency')} icon="🚨" variant="danger" fullWidth size="xl" onClick={() => setShowSosConfirm(true)} />
                    )}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <ActionButton label={t('dashboard.shareLocation')} icon="📍" variant="ocean" fullWidth size="md" onClick={handleShareLocation} />
                        <ActionButton label={showFishZones ? t('dashboard.hideZones') : t('dashboard.fishZones')} icon="🐟" variant="aqua" fullWidth size="md" onClick={() => setShowFishZones(!showFishZones)} />
                    </div>

                    {/* Advanced Tools Row */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2 border-t border-gray-100/50">
                        <button
                            onClick={() => setShowChat(true)}
                            className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 text-cyan-400 rounded-xl hover:border-cyan-500/50 transition-all shadow-lg active:scale-95"
                        >
                            <Radio className="w-4 h-4" />
                            <span className="text-xs font-bold tracking-wider">MESH CHAT</span>
                        </button>
                        <button
                            onClick={() => setShowNMEA(true)}
                            className="flex items-center justify-center gap-2 py-3 bg-slate-900 border border-slate-700 text-emerald-400 rounded-xl hover:border-emerald-500/50 transition-all shadow-lg active:scale-95"
                        >
                            <Terminal className="w-4 h-4" />
                            <span className="text-xs font-bold tracking-wider">NMEA LOGS</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}


