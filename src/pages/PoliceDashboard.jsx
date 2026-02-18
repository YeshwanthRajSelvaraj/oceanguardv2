import { useState, useEffect, useRef } from 'react';
import { useAlerts } from '../contexts/AlertContext';
import { useSOS } from '../contexts/SOSContext';
import { useTranslation } from '../contexts/TranslationContext';
import Navbar from '../components/Navbar';
import AlertCard from '../components/AlertCard';
import MapView from '../components/MapView';
import { requestPermission, getPermissionStatus, sendSOSNotification, registerServiceWorker } from '../services/notificationService';
import ProximityChat from '../components/ProximityChat';
import { Radio, X } from 'lucide-react';

const CHANNEL_INFO = {
    internet: { icon: '🌐', label: 'Internet', color: '#1CA7A6' },
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

    useEffect(() => { registerServiceWorker(); }, []);

    useEffect(() => {
        if (alerts.length > prevAlertCount.current) {
            const newAlerts = alerts.slice(prevAlertCount.current);
            newAlerts.forEach(alert => {
                if (alert.type === 'sos' || alert.type === 'border') {
                    sendSOSNotification({ type: alert.type, boatNumber: alert.boatNumber || 'Unknown', fishermanName: alert.fishermanName || 'Unknown', location: alert.location, alertId: alert.id });
                }
            });
        }
        prevAlertCount.current = alerts.length;
    }, [alerts]);

    useEffect(() => {
        const handleMeshSOS = (e) => {
            const sosData = e.detail;
            const isDuplicate = alerts.some(a => a.boatNumber === sosData.boatNumber && a.status !== 'resolved' && (new Date() - new Date(a.timestamp)) < 120000);
            if (!isDuplicate) {
                sendSOS({ fishermanId: sosData.fishermanId || 'mesh-user', fishermanName: sosData.fishermanName || 'Unknown Fisherman', boatNumber: sosData.boatNumber || 'Unknown Boat', location: sosData.location });
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
        <>
            <style>{`
                .pd-root {
                    height: 100dvh;
                    background: #07192a;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    font-family: 'Inter', system-ui, sans-serif;
                }

                .pd-scroll {
                    flex: 1;
                    overflow-y: auto;
                    overflow-x: hidden;
                }

                /* ── Stats ── */
                .pd-stats {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 10px;
                    padding: 16px 16px 0;
                }
                @media (max-width: 480px) {
                    .pd-stats { grid-template-columns: repeat(2, 1fr); }
                }

                .pd-stat {
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 14px;
                    padding: 12px;
                    text-align: center;
                    transition: all 0.2s;
                }
                .pd-stat.danger-pulse {
                    border-color: rgba(230,57,70,0.3);
                    box-shadow: 0 0 20px rgba(230,57,70,0.08);
                }
                .pd-stat-val {
                    font-size: 22px;
                    font-weight: 900;
                    line-height: 1;
                }
                .pd-stat-lbl {
                    font-size: 9px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: rgba(255,255,255,0.3);
                    margin-top: 5px;
                }

                /* ── Mesh Chat button ── */
                .pd-mesh-btn {
                    position: fixed;
                    bottom: 24px; right: 24px;
                    z-index: 40;
                    width: 56px; height: 56px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #0B3C5D, #1CA7A6);
                    border: none;
                    color: white;
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 8px 24px rgba(28,167,166,0.4);
                    transition: transform 0.2s, box-shadow 0.2s;
                    font-family: inherit;
                }
                .pd-mesh-btn:hover { transform: scale(1.08); box-shadow: 0 12px 32px rgba(28,167,166,0.5); }

                @media (min-width: 640px) {
                    .pd-mesh-btn {
                        position: absolute;
                        top: 16px; right: 16px;
                        bottom: auto;
                        width: auto; height: 36px;
                        border-radius: 10px;
                        padding: 0 14px;
                        gap: 6px;
                        font-size: 11px; font-weight: 800;
                    }
                    .pd-mesh-btn-label { display: inline; }
                }
                .pd-mesh-btn-label { display: none; }

                /* ── Notif banner ── */
                .pd-notif-banner {
                    margin: 12px 16px 0;
                    display: flex; align-items: center; gap: 12px;
                    padding: 12px 16px;
                    background: rgba(28,167,166,0.07);
                    border: 1px solid rgba(28,167,166,0.2);
                    border-radius: 14px;
                }
                .pd-notif-banner p { margin: 0; }
                .pd-notif-title { font-size: 12px; font-weight: 700; color: #1CA7A6; }
                .pd-notif-sub { font-size: 10px; color: rgba(255,255,255,0.35); margin-top: 2px !important; }
                .pd-notif-enable {
                    margin-left: auto; flex-shrink: 0;
                    padding: 8px 14px;
                    background: #1CA7A6; color: white;
                    font-size: 11px; font-weight: 700;
                    border: none; border-radius: 10px; cursor: pointer;
                    font-family: inherit;
                    transition: background 0.2s;
                }
                .pd-notif-enable:hover { background: #22c4c3; }

                /* ── Channel Monitor ── */
                .pd-channel-wrap { padding: 12px 16px 0; }
                .pd-channel-card {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 16px;
                    overflow: hidden;
                }
                .pd-channel-header {
                    display: flex; align-items: center; gap: 8px;
                    padding: 12px 16px;
                    cursor: pointer;
                    font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.7);
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    transition: background 0.2s;
                }
                .pd-channel-header:hover { background: rgba(255,255,255,0.02); }
                .pd-channel-body { padding: 12px 16px; }

                .pd-ch-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 8px;
                }
                .pd-ch-item {
                    border-radius: 12px;
                    padding: 10px 8px;
                    text-align: center;
                    border: 1px solid;
                    transition: all 0.2s;
                }
                .pd-ch-item.online {
                    background: rgba(28,167,166,0.07);
                    border-color: rgba(28,167,166,0.25);
                }
                .pd-ch-item.offline {
                    background: rgba(230,57,70,0.05);
                    border-color: rgba(230,57,70,0.15);
                }
                .pd-ch-icon { font-size: 18px; margin-bottom: 4px; }
                .pd-ch-name { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.6); display: block; margin-bottom: 3px; }
                .pd-ch-status { font-size: 9px; font-weight: 700; }
                .pd-ch-item.online .pd-ch-status { color: #1CA7A6; }
                .pd-ch-item.offline .pd-ch-status { color: rgba(230,57,70,0.7); }

                .pd-queue-badge {
                    margin-top: 10px; padding: 10px 14px;
                    background: rgba(245,158,11,0.08);
                    border: 1px solid rgba(245,158,11,0.2);
                    border-radius: 10px;
                    font-size: 11px; font-weight: 700; color: #fbbf24;
                    display: flex; align-items: center; gap: 8px;
                }

                .pd-log-title {
                    font-size: 10px; font-weight: 700;
                    color: rgba(255,255,255,0.25);
                    text-transform: uppercase; letter-spacing: 0.08em;
                    margin: 10px 0 6px;
                }
                .pd-log-list { max-height: 120px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
                .pd-log-item {
                    display: flex; align-items: center; gap: 8px;
                    padding: 6px 10px; border-radius: 8px;
                    font-size: 10px; font-weight: 600;
                }
                .pd-log-item.delivered { background: rgba(34,197,94,0.08); }
                .pd-log-item.cached { background: rgba(245,158,11,0.08); }
                .pd-log-item.failed { background: rgba(230,57,70,0.08); }
                .pd-log-item.default { background: rgba(255,255,255,0.03); }
                .pd-log-text { color: rgba(255,255,255,0.6); flex: 1; }
                .pd-log-time { color: rgba(255,255,255,0.25); font-size: 9px; font-variant-numeric: tabular-nums; }

                /* ── Main content grid ── */
                .pd-main {
                    padding: 16px;
                    display: grid;
                    gap: 24px;
                }
                @media (min-width: 1024px) {
                    .pd-main { grid-template-columns: 440px 1fr; }
                }

                /* ── Section header ── */
                .pd-section-hdr {
                    display: flex; align-items: center; justify-content: space-between;
                    margin-bottom: 14px;
                }
                .pd-section-title {
                    font-size: 17px; font-weight: 900; color: white; letter-spacing: -0.3px;
                }
                .pd-count-badge {
                    font-size: 11px; font-weight: 600;
                    color: rgba(255,255,255,0.35);
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.08);
                    padding: 4px 10px; border-radius: 99px;
                }

                /* ── Filter tabs ── */
                .pd-filters {
                    display: flex; gap: 8px;
                    overflow-x: auto; padding-bottom: 8px;
                    margin-bottom: 16px;
                    scrollbar-width: none;
                }
                .pd-filters::-webkit-scrollbar { display: none; }

                .pd-filter-btn {
                    padding: 8px 16px;
                    border-radius: 12px;
                    font-size: 11px; font-weight: 700;
                    white-space: nowrap;
                    cursor: pointer;
                    border: 1px solid;
                    transition: all 0.2s;
                    font-family: inherit;
                    display: flex; align-items: center; gap: 6px;
                }
                .pd-filter-btn.active {
                    background: linear-gradient(135deg, #0B3C5D, #1CA7A6);
                    border-color: rgba(28,167,166,0.4);
                    color: white;
                    box-shadow: 0 4px 14px rgba(28,167,166,0.25);
                }
                .pd-filter-btn.inactive {
                    background: rgba(255,255,255,0.04);
                    border-color: rgba(255,255,255,0.08);
                    color: rgba(255,255,255,0.5);
                }
                .pd-filter-btn.inactive:hover {
                    background: rgba(255,255,255,0.07);
                    color: rgba(255,255,255,0.8);
                }
                .pd-filter-count {
                    background: rgba(255,255,255,0.2);
                    color: white;
                    font-size: 10px; font-weight: 800;
                    padding: 1px 6px; border-radius: 99px;
                    min-width: 18px; text-align: center;
                }

                /* ── Empty state ── */
                .pd-empty {
                    text-align: center; padding: 48px 16px;
                }
                .pd-empty-icon { font-size: 44px; margin-bottom: 14px; }
                .pd-empty-title { font-size: 15px; font-weight: 700; color: rgba(255,255,255,0.5); margin-bottom: 6px; }
                .pd-empty-sub { font-size: 12px; color: rgba(255,255,255,0.25); }

                /* ── Live badge ── */
                .pd-live-badge {
                    display: flex; align-items: center; gap: 6px;
                    background: rgba(42,157,143,0.1);
                    border: 1px solid rgba(42,157,143,0.2);
                    padding: 5px 12px; border-radius: 99px;
                }
                .pd-live-dot { width: 6px; height: 6px; border-radius: 50%; background: #2A9D8F; animation: pdPulse 1.5s ease-in-out infinite; }
                .pd-live-text { font-size: 11px; font-weight: 700; color: #2A9D8F; }

                /* ── Selected Alert card ── */
                .pd-sel-alert {
                    margin: 0 16px 16px;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 18px;
                    padding: 16px 20px;
                    display: flex; align-items: center; justify-content: space-between;
                }
                .pd-sel-boat { font-size: 14px; font-weight: 800; color: white; }
                .pd-sel-name { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 3px; }
                .pd-sel-coord { font-size: 11px; font-family: monospace; color: rgba(255,255,255,0.3); margin-top: 3px; }
                .pd-sel-close {
                    width: 34px; height: 34px; border-radius: 10px;
                    background: rgba(255,255,255,0.07);
                    border: none; cursor: pointer; color: rgba(255,255,255,0.5);
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.2s;
                }
                .pd-sel-close:hover { background: rgba(255,255,255,0.12); color: white; }

                /* ── Bulk actions ── */
                .pd-bulk {
                    padding: 16px;
                    display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
                    max-width: 500px; margin: 0 auto;
                }
                @media (min-width: 1024px) { .pd-bulk { max-width: none; } }

                .pd-bulk-btn {
                    padding: 14px;
                    border: none; border-radius: 16px;
                    color: white; font-size: 13px; font-weight: 700;
                    cursor: pointer; font-family: inherit;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    transition: opacity 0.2s, transform 0.15s;
                }
                .pd-bulk-btn:hover:not(:disabled) { transform: translateY(-1px); }
                .pd-bulk-btn:active:not(:disabled) { transform: scale(0.98); }
                .pd-bulk-btn:disabled { opacity: 0.3; cursor: not-allowed; }
                .pd-bulk-btn.ack {
                    background: linear-gradient(135deg, #0B3C5D, #1CA7A6);
                    box-shadow: 0 6px 20px rgba(28,167,166,0.3);
                }
                .pd-bulk-btn.resolve {
                    background: linear-gradient(135deg, #1CA7A6, #2A9D8F);
                    box-shadow: 0 6px 20px rgba(42,157,143,0.3);
                }

                /* ── Chat modal ── */
                .pd-chat-modal {
                    position: fixed; inset: 0; z-index: 9999;
                    background: rgba(0,0,0,0.8);
                    backdrop-filter: blur(6px);
                    display: flex; align-items: stretch;
                }
                .pd-chat-inner {
                    position: relative; width: 100%; max-width: 480px;
                    margin: auto; height: 90dvh;
                    border-radius: 20px; overflow: hidden;
                    box-shadow: 0 30px 80px rgba(0,0,0,0.6);
                    border: 1px solid rgba(28,167,166,0.2);
                }
                .pd-chat-close {
                    position: absolute; top: 12px; right: 12px; z-index: 10;
                    width: 32px; height: 32px; border-radius: 8px;
                    background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15);
                    color: white; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                }

                @keyframes pdPulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
            `}</style>

            <div className="pd-root">
                <Navbar title={t('app.name')} showAlertBadge />

                {/* ── Mesh Chat Modal ── */}
                {showChat && (
                    <div className="pd-chat-modal" onClick={(e) => { if (e.target === e.currentTarget) setShowChat(false); }}>
                        <div className="pd-chat-inner">
                            <button className="pd-chat-close" onClick={() => setShowChat(false)}><X size={16} /></button>
                            <ProximityChat />
                        </div>
                    </div>
                )}

                <div className="pd-scroll">

                    {/* Stats row */}
                    <div style={{ position: 'relative' }}>
                        <div className="pd-stats">
                            <StatCard value={activeCount} label={t('police.active')} color="#1CA7A6" />
                            <StatCard value={sosCount} label={t('police.sos')} color="#E63946" pulse={sosCount > 0} />
                            <StatCard value={borderCount} label={t('police.border')} color="#f59e0b" />
                            <StatCard value={resolvedCount} label={t('police.resolved')} color="#2A9D8F" />
                        </div>

                        {/* Mesh Chat button */}
                        <button className="pd-mesh-btn" onClick={() => setShowChat(true)}>
                            <Radio size={22} />
                            <span className="pd-mesh-btn-label">MESH CHAT</span>
                        </button>
                    </div>

                    {/* Notification banner */}
                    {notifPermission !== 'granted' && notifPermission !== 'unsupported' && (
                        <div className="pd-notif-banner">
                            <span style={{ fontSize: '20px' }}>🔔</span>
                            <div>
                                <p className="pd-notif-title">Enable Notifications</p>
                                <p className="pd-notif-sub">Get instant alerts when fishermen send SOS</p>
                            </div>
                            <button className="pd-notif-enable" onClick={handleEnableNotifications}>Enable</button>
                        </div>
                    )}

                    {/* Channel Monitor */}
                    <div className="pd-channel-wrap">
                        <div className="pd-channel-card">
                            <div className="pd-channel-header" onClick={() => setShowChannelMonitor(!showChannelMonitor)}>
                                <span>📡</span>
                                <span>Communication Channels</span>
                                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: connectivity.isOnline ? '#2A9D8F' : '#E63946', display: 'inline-block', animation: 'pdPulse 1.5s infinite' }} />
                                    <span style={{ fontSize: '10px', color: connectivity.isOnline ? '#2A9D8F' : '#E63946', fontWeight: 700 }}>{connectivity.isOnline ? 'Online' : 'Offline'}</span>
                                    <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}>{showChannelMonitor ? '▲' : '▼'}</span>
                                </div>
                            </div>

                            {showChannelMonitor && (
                                <div className="pd-channel-body">
                                    <div className="pd-ch-grid">
                                        {Object.entries(CHANNEL_INFO).map(([key, ch]) => (
                                            <div key={key} className={`pd-ch-item ${channelAvailability[key] ? 'online' : 'offline'}`}>
                                                <div className="pd-ch-icon">{ch.icon}</div>
                                                <span className="pd-ch-name">{ch.label}</span>
                                                <span className="pd-ch-status">{channelAvailability[key] ? '● Ready' : '○ Down'}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {(queueStats.pending > 0 || queueStats.cached > 0) && (
                                        <div className="pd-queue-badge">
                                            <span>📦</span>
                                            <span>{queueStats.pending + queueStats.cached} SOS in offline queue — auto-retrying every 30s</span>
                                        </div>
                                    )}

                                    {deliveryLog.length > 0 && (
                                        <>
                                            <div className="pd-log-title">Recent Delivery Log</div>
                                            <div className="pd-log-list">
                                                {deliveryLog.slice(0, 8).map((entry, i) => (
                                                    <div key={i} className={`pd-log-item ${entry.event === 'sos_delivered' ? 'delivered' : entry.event === 'sos_cached' ? 'cached' : entry.event === 'sos_failed' ? 'failed' : 'default'}`}>
                                                        <span>
                                                            {entry.event === 'sos_delivered' ? '✅' : entry.event === 'sos_queued' ? '📤' : entry.event === 'sos_sending' ? '⏳' : entry.event === 'sos_cached' ? '📦' : entry.event === 'sos_failed' ? '❌' : entry.event === 'channels_probed' ? '📡' : '•'}
                                                        </span>
                                                        <span className="pd-log-text">
                                                            {entry.event === 'sos_delivered' && `SOS delivered via ${entry.data?.delivery?.channel || 'channel'}`}
                                                            {entry.event === 'sos_queued' && `SOS queued: ${entry.data?.boatNumber || 'Unknown'}`}
                                                            {entry.event === 'sos_sending' && 'Attempting delivery...'}
                                                            {entry.event === 'sos_cached' && 'SOS cached offline — retrying'}
                                                            {entry.event === 'sos_failed' && 'SOS delivery failed'}
                                                            {entry.event === 'channels_probed' && 'Channel scan complete'}
                                                        </span>
                                                        <span className="pd-log-time">
                                                            {new Date(entry.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Alerts + Map grid */}
                    <div className="pd-main">

                        {/* Alerts column */}
                        <div>
                            <div className="pd-section-hdr">
                                <h2 className="pd-section-title">{t('police.liveAlerts')}</h2>
                                <span className="pd-count-badge">{filteredAlerts.length} {filteredAlerts.length !== 1 ? t('police.results') : t('police.result')}</span>
                            </div>

                            <div className="pd-filters">
                                {FILTERS.map((f) => (
                                    <button key={f.value} className={`pd-filter-btn ${filter === f.value ? 'active' : 'inactive'}`} onClick={() => setFilter(f.value)}>
                                        {f.label}
                                        {f.value === 'pending' && pendingCount > 0 && <span className="pd-filter-count">{pendingCount}</span>}
                                    </button>
                                ))}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {filteredAlerts.map((alert) => (
                                    <AlertCard key={alert.id} alert={alert} onAcknowledge={acknowledge} onResolve={resolve} />
                                ))}
                                {filteredAlerts.length === 0 && (
                                    <div className="pd-empty">
                                        <div className="pd-empty-icon">{filter === 'resolved' ? '✅' : '🛡️'}</div>
                                        <p className="pd-empty-title">{filter === 'resolved' ? t('police.noResolvedAlerts') : t('police.noActiveAlerts')}</p>
                                        <p className="pd-empty-sub">{filter === 'all' ? t('police.allClear') : t('police.noFilterAlerts', { filter })}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Map column */}
                        <div>
                            <div className="pd-section-hdr">
                                <h2 className="pd-section-title">{t('police.mapMonitoring')}</h2>
                                <div className="pd-live-badge">
                                    <div className="pd-live-dot" />
                                    <span className="pd-live-text">{t('police.live')}</span>
                                </div>
                            </div>
                            <MapView alertMarkers={alertMarkers} showBoundary height="h-full min-h-[300px] lg:min-h-[500px]" onMarkerClick={(m) => setSelectedAlert(m)} />
                        </div>
                    </div>

                    {/* Selected alert detail */}
                    {selectedAlert && (
                        <div className="pd-sel-alert">
                            <div>
                                <p className="pd-sel-boat">{selectedAlert.boatNumber}</p>
                                <p className="pd-sel-name">{selectedAlert.fishermanName}</p>
                                <p className="pd-sel-coord">{selectedAlert.location.lat.toFixed(4)}°, {selectedAlert.location.lng.toFixed(4)}°</p>
                            </div>
                            <button className="pd-sel-close" onClick={() => setSelectedAlert(null)}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>
                    )}

                    {/* Bulk actions */}
                    <div className="pd-bulk">
                        <button className="pd-bulk-btn ack" onClick={acknowledgeAll} disabled={pendingCount === 0}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                            {t('police.ackAll')} ({pendingCount})
                        </button>
                        <button className="pd-bulk-btn resolve" onClick={resolveAll} disabled={activeCount === 0}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                            {t('police.resolveAll')}
                        </button>
                    </div>

                    <div style={{ height: '32px' }} />
                </div>
            </div>
        </>
    );
}

function StatCard({ value, label, color, pulse = false }) {
    return (
        <div className={`pd-stat ${pulse ? 'danger-pulse' : ''}`}>
            <p className="pd-stat-val" style={{ color }}>{value}</p>
            <p className="pd-stat-lbl">{label}</p>
        </div>
    );
}