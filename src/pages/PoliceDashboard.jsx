import { useState, useEffect, useRef } from 'react';
import { useAlerts } from '../contexts/AlertContext';
import { useSOS } from '../contexts/SOSContext';
import { useTranslation } from '../contexts/TranslationContext';
import Navbar from '../components/Navbar';
import AlertCard from '../components/AlertCard';
import MapView from '../components/MapView';
import { requestPermission, getPermissionStatus, sendSOSNotification, registerServiceWorker } from '../services/notificationService';
import ProximityChat from '../components/ProximityChat';
import { Radio } from 'lucide-react';

const CHANNEL_INFO = {
    internet: { icon: '🌐', label: 'Internet', color: '#1E88E5' },
    satellite: { icon: '🛰️', label: 'Satellite', color: '#7B1FA2' },
    ais: { icon: '📡', label: 'AIS/VHF', color: '#E65100' },
};

export default function PoliceDashboard() {
    const { alerts, sendSOS, acknowledge, resolve, acknowledgeAll, resolveAll, pendingCount, activeCount } = useAlerts();
    const { engineStatus, connectivity, queueStats, deliveryLog, channelAvailability } = useSOS();
    const { t } = useTranslation();
    const [filter, setFilter] = useState('all');
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [showChannelMonitor, setShowChannelMonitor] = useState(true);
    const [notifPermission, setNotifPermission] = useState(getPermissionStatus());
    const prevAlertCount = useRef(alerts.length);
    const [showChat, setShowChat] = useState(false);

    // Register service worker on mount
    useEffect(() => {
        registerServiceWorker();
    }, []);

    // Send browser notification on new SOS alerts
    useEffect(() => {
        if (alerts.length > prevAlertCount.current) {
            const newAlerts = alerts.slice(prevAlertCount.current);
            newAlerts.forEach(alert => {
                if (alert.type === 'sos' || alert.type === 'border') {
                    sendSOSNotification({
                        type: alert.type,
                        boatNumber: alert.boatNumber || 'Unknown',
                        fishermanName: alert.fishermanName || 'Unknown',
                        location: alert.location,
                        alertId: alert.id,
                    });
                }
            });
        }
        prevAlertCount.current = alerts.length;
    }, [alerts]);

    // Listen for MESH SOS events (from MeshService) and inject into AlertContext
    useEffect(() => {
        const handleMeshSOS = (e) => {
            const sosData = e.detail;
            console.log("PoliceDashboard: Received Mesh SOS", sosData);

            // Check for potential duplicates (prevent spamming same alert)
            // If we have an active alert from this boat within 2 minutes, ignore.
            const isDuplicate = alerts.some(a =>
                a.boatNumber === sosData.boatNumber &&
                a.status !== 'resolved' &&
                (new Date() - new Date(a.timestamp)) < 120000
            );

            if (!isDuplicate) {
                // Add to system
                sendSOS({
                    fishermanId: sosData.fishermanId || 'mesh-user',
                    fishermanName: sosData.fishermanName || 'Unknown Fisherman',
                    boatNumber: sosData.boatNumber || 'Unknown Boat',
                    location: sosData.location
                });
            }
        };

        window.addEventListener('cg_sos_received', handleMeshSOS);
        return () => window.removeEventListener('cg_sos_received', handleMeshSOS);
    }, [alerts, sendSOS]);

    const handleEnableNotifications = async () => {
        const granted = await requestPermission();
        setNotifPermission(granted ? 'granted' : 'denied');
    };

    const FILTERS = [
        { label: t('police.all'), value: 'all' },
        { label: t('police.sos'), value: 'sos' },
        { label: t('police.border'), value: 'border' },
        { label: t('police.pending'), value: 'pending' },
        { label: t('police.resolved'), value: 'resolved' },
    ];

    const filteredAlerts = alerts.filter((a) => {
        if (filter === 'all') return true;
        if (filter === 'pending') return a.status === 'pending';
        if (filter === 'resolved') return a.status === 'resolved';
        return a.type === filter;
    });

    const sosCount = alerts.filter((a) => a.type === 'sos' && a.status !== 'resolved').length;
    const borderCount = alerts.filter((a) => a.type === 'border' && a.status !== 'resolved').length;
    const resolvedCount = alerts.filter((a) => a.status === 'resolved').length;

    const alertMarkers = alerts
        .filter((a) => a.status !== 'resolved' && a.location)
        .map((a) => ({ id: a.id, type: a.type, location: a.location, boatNumber: a.boatNumber, fishermanName: a.fishermanName, timestamp: a.timestamp }));

    return (
        <div className="min-h-dvh bg-bg flex flex-col">
            <Navbar title={t('app.name')} showAlertBadge />

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

            <div className="flex-1 w-full max-w-5xl mx-auto">
                {/* Stats */}
                <div className="px-3 sm:px-4 lg:px-6 pt-4 pb-3 animate-fade-in relative">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                        <StatCard value={activeCount} label={t('police.active')} color="text-ocean" />
                        <StatCard value={sosCount} label={t('police.sos')} color="text-danger" pulse={sosCount > 0} />
                        <StatCard value={borderCount} label={t('police.border')} color="text-amber-600" />
                        <StatCard value={resolvedCount} label={t('police.resolved')} color="text-safe" />
                    </div>

                    {/* Mesh Chat Floating Button (Desktop: Top Right, Mobile: Bottom Right Fixed) */}
                    <button
                        onClick={() => setShowChat(true)}
                        className="fixed bottom-6 right-6 z-40 sm:absolute sm:top-4 sm:right-6 sm:bottom-auto w-14 h-14 sm:w-auto sm:h-10 sm:px-4 bg-gradient-to-r from-ocean to-blue-600 text-white rounded-full sm:rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 hover:scale-105 transition-transform btn-press"
                    >
                        <Radio className="w-6 h-6 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline text-xs font-bold">MESH CHAT</span>
                    </button>
                </div>

                {/* Notification Permission Banner */}
                {notifPermission !== 'granted' && notifPermission !== 'unsupported' && (
                    <div className="px-3 sm:px-4 lg:px-6 pb-3 animate-slide-down">
                        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-ocean/[0.06] border border-ocean/20 rounded-[16px]">
                            <span className="text-[18px] sm:text-[20px]">🔔</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] sm:text-[12px] font-bold text-ocean">Enable Notifications</p>
                                <p className="text-[9px] sm:text-[10px] text-text-secondary mt-0.5 truncate">Get instant alerts when fishermen send SOS</p>
                            </div>
                            <button
                                onClick={handleEnableNotifications}
                                className="px-4 py-2 bg-ocean text-white text-[11px] font-bold rounded-xl btn-press hover:bg-ocean-light transition-colors"
                                id="enable-notifications-btn"
                            >
                                Enable
                            </button>
                        </div>
                    </div>
                )}

                {/* Channel Delivery Monitor */}
                <div className="px-3 sm:px-4 lg:px-6 pb-3 animate-fade-in" style={{ animationDelay: '0.05s' }}>
                    <div className="channel-monitor">
                        <div className="cm-title" style={{ cursor: 'pointer' }} onClick={() => setShowChannelMonitor(!showChannelMonitor)}>
                            <span>📡</span>
                            <span>Communication Channels</span>
                            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className={`w-[6px] h-[6px] rounded-full ${connectivity.isOnline ? 'bg-safe' : 'bg-danger'} animate-pulse`} />
                                <span style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280' }}>{connectivity.isOnline ? 'Online' : 'Offline'}</span>
                                <span style={{ fontSize: '8px', opacity: 0.5 }}>{showChannelMonitor ? '▲' : '▼'}</span>
                            </span>
                        </div>

                        {showChannelMonitor && (
                            <>
                                <div className="cm-channels">
                                    {Object.entries(CHANNEL_INFO).map(([key, ch]) => {
                                        const available = channelAvailability[key];
                                        return (
                                            <div key={key} className={`cm-channel ${available ? 'cm-ch-online' : 'cm-ch-offline'}`}>
                                                <div className="cm-ch-icon">{ch.icon}</div>
                                                <span className="cm-ch-name">{ch.label}</span>
                                                <span className="cm-ch-status">{available ? '● Ready' : '○ Down'}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Queue Status */}
                                {(queueStats.pending > 0 || queueStats.cached > 0) && (
                                    <div style={{
                                        marginTop: '10px', padding: '10px 14px', background: '#fffbeb',
                                        borderRadius: '10px', border: '1px solid #fde68a',
                                        fontSize: '11px', fontWeight: 700, color: '#92400e',
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                    }}>
                                        <span>📦</span>
                                        <span>{queueStats.pending + queueStats.cached} SOS in offline queue — auto-retrying every 30s</span>
                                    </div>
                                )}

                                {/* Recent Delivery Log */}
                                {deliveryLog.length > 0 && (
                                    <div style={{ marginTop: '10px' }}>
                                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                                            Recent Delivery Log
                                        </div>
                                        <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {deliveryLog.slice(0, 8).map((entry, i) => (
                                                <div key={i} style={{
                                                    display: 'flex', alignItems: 'center', gap: '8px',
                                                    padding: '6px 10px', borderRadius: '8px',
                                                    background: entry.event === 'sos_delivered' ? '#f0fdf4' :
                                                        entry.event === 'sos_cached' ? '#fffbeb' :
                                                            entry.event === 'sos_failed' ? '#fef2f2' : '#f8fafc',
                                                    fontSize: '10px', fontWeight: 600,
                                                }}>
                                                    <span>
                                                        {entry.event === 'sos_delivered' ? '✅' :
                                                            entry.event === 'sos_queued' ? '📤' :
                                                                entry.event === 'sos_sending' ? '⏳' :
                                                                    entry.event === 'sos_cached' ? '📦' :
                                                                        entry.event === 'sos_failed' ? '❌' :
                                                                            entry.event === 'channels_probed' ? '📡' : '•'}
                                                    </span>
                                                    <span style={{ color: '#374151', flex: 1 }}>
                                                        {entry.event === 'sos_delivered' && `SOS delivered via ${entry.data?.delivery?.channel || 'channel'}`}
                                                        {entry.event === 'sos_queued' && `SOS queued: ${entry.data?.boatNumber || 'Unknown'}`}
                                                        {entry.event === 'sos_sending' && `Attempting delivery...`}
                                                        {entry.event === 'sos_cached' && `SOS cached offline — retrying`}
                                                        {entry.event === 'sos_failed' && `SOS delivery failed`}
                                                        {entry.event === 'channels_probed' && `Channel scan complete`}
                                                    </span>
                                                    <span style={{ color: '#9ca3af', fontSize: '9px', fontVariantNumeric: 'tabular-nums' }}>
                                                        {new Date(entry.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Alerts + Map — side-by-side on desktop */}
                <div className="lg:grid lg:grid-cols-[1fr_400px] lg:gap-6 px-3 sm:px-4 lg:px-6">
                    {/* Alerts */}
                    <div className="pt-3 pb-3">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-[17px] font-extrabold text-text-primary tracking-tight">{t('police.liveAlerts')}</h2>
                            <span className="text-[12px] font-semibold text-text-light bg-gray-100 px-3 py-1 rounded-full">
                                {filteredAlerts.length} {filteredAlerts.length !== 1 ? t('police.results') : t('police.result')}
                            </span>
                        </div>

                        <div className="flex gap-2 mb-5 overflow-x-auto pb-2 scrollbar-none animate-fade-in" style={{ animationDelay: '0.05s' }}>
                            {FILTERS.map((f) => (
                                <button key={f.value} onClick={() => setFilter(f.value)} className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-[14px] text-[11px] sm:text-[12px] font-bold whitespace-nowrap transition-all duration-200 btn-press ${filter === f.value ? 'bg-ocean text-white shadow-lg shadow-ocean/25' : 'bg-white text-text-secondary border border-border/60 hover:bg-gray-50 hover:border-border'}`}>
                                    {f.label}
                                    {f.value === 'pending' && pendingCount > 0 && (
                                        <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 bg-white/20 rounded-full text-[10px] font-bold px-1">{pendingCount}</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-3 stagger">
                            {filteredAlerts.map((alert) => (
                                <AlertCard key={alert.id} alert={alert} onAcknowledge={acknowledge} onResolve={resolve} />
                            ))}
                            {filteredAlerts.length === 0 && (
                                <div className="text-center py-16 animate-fade-in">
                                    <div className="text-5xl mb-4">{filter === 'resolved' ? '✅' : '🛡'}</div>
                                    <p className="text-[15px] font-bold text-text-secondary">
                                        {filter === 'resolved' ? t('police.noResolvedAlerts') : t('police.noActiveAlerts')}
                                    </p>
                                    <p className="text-[12px] text-text-light mt-1.5">
                                        {filter === 'all' ? t('police.allClear') : t('police.noFilterAlerts', { filter })}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Map — stacked on mobile, sidebar on desktop */}
                    <div className="pt-4 pb-3 lg:pt-3">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-[17px] font-extrabold text-text-primary tracking-tight">{t('police.mapMonitoring')}</h2>
                            <div className="flex items-center gap-1.5 bg-safe/8 px-3 py-1.5 rounded-full">
                                <span className="w-[6px] h-[6px] rounded-full bg-safe animate-pulse" />
                                <span className="text-[11px] font-bold text-safe">{t('police.live')}</span>
                            </div>
                        </div>
                        <MapView alertMarkers={alertMarkers} showBoundary height="h-[260px] sm:h-[340px] lg:h-[500px]" onMarkerClick={(m) => setSelectedAlert(m)} />
                    </div>
                </div>

                {selectedAlert && (
                    <div className="px-3 sm:px-4 lg:px-6 py-2 animate-scale-in">
                        <div className="bg-white rounded-[20px] shadow-lg border border-border/50 p-5 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="font-extrabold text-[14px] text-text-primary">{selectedAlert.boatNumber}</p>
                                <p className="text-[12px] text-text-secondary font-medium">{selectedAlert.fishermanName}</p>
                                <p className="text-[11px] text-text-light font-mono">{selectedAlert.location.lat.toFixed(4)}°, {selectedAlert.location.lng.toFixed(4)}°</p>
                            </div>
                            <button onClick={() => setSelectedAlert(null)} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-text-light hover:bg-gray-200 hover:text-text-secondary transition-all btn-press">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* Bulk Actions */}
                <div className="px-3 sm:px-4 lg:px-6 pt-4 pb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-lg mx-auto lg:max-w-none">
                        <button onClick={acknowledgeAll} disabled={pendingCount === 0} className="py-3 sm:py-4 text-white font-bold text-[12px] sm:text-[13px] rounded-[16px] btn-gradient-ocean disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2 btn-press">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                            {t('police.ackAll')} ({pendingCount})
                        </button>
                        <button onClick={resolveAll} disabled={activeCount === 0} className="py-3 sm:py-4 text-white font-bold text-[12px] sm:text-[13px] rounded-[16px] btn-gradient-aqua disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2 btn-press">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                            {t('police.resolveAll')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ value, label, color, pulse = false }) {
    return (
        <div className={`bg-white rounded-[14px] sm:rounded-[16px] shadow-sm border p-3 sm:p-3.5 text-center transition-all hover:shadow-md ${pulse ? 'border-danger/30 shadow-danger/[0.08] shadow-md' : 'border-border/40'}`}>
            <p className={`text-[20px] sm:text-[22px] font-extrabold ${color} leading-none`}>{value}</p>
            <p className="text-[8px] sm:text-[9px] font-bold text-text-light mt-1 sm:mt-1.5 uppercase tracking-[0.1em]">{label}</p>
        </div>
    );
}
