import React, { useState, useEffect, useRef } from 'react';
import { meshService } from '../services/meshService';
import { Send, Wifi, Users, ShieldAlert, RefreshCw } from 'lucide-react';

const ProximityChat = () => {
    const [peers, setPeers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        // Initialize Mesh Service on mount
        const init = async () => {
            await meshService.initialize();

            meshService.subscribePeers((updatedPeers) => {
                setPeers(updatedPeers);
            });

            meshService.subscribeMessages((updatedMessages) => {
                setMessages(updatedMessages);
                scrollToBottom();
            });
        };
        init();

        return () => {
            // Optional: Stop scanning on unmount if desired, 
            // but usually we want to keep connections alive in background
        };
    }, []);

    const scrollToBottom = () => {
        if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    };

    const toggleScan = async () => {
        if (isScanning) {
            await meshService.stopAll();
            setIsScanning(false);
        } else {
            await meshService.startAdvertising();
            await meshService.startDiscovery();
            setIsScanning(true);
        }
    };

    const handleConnect = (endpointId) => {
        meshService.connect(endpointId);
    };

    const handleSend = () => {
        if (!input.trim()) return;
        meshService.sendMessage(input.trim());
        setInput('');
        scrollToBottom();
    };

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 text-cyan-50">
            {/* Header */}
            <div className="p-4 bg-black/40 backdrop-blur-md border-b border-cyan-500/30 flex justify-between items-center shadow-lg sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Wifi className={`w-6 h-6 ${isScanning ? 'text-green-400 animate-pulse' : 'text-gray-500'}`} />
                        {isScanning && <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping"></span>}
                    </div>
                    <div>
                        <h2 className="font-bold text-lg tracking-wide font-mono">MESH NETWORK</h2>
                        <div className="text-xs text-cyan-400/80 flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${isScanning ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            {isScanning ? 'ONLINE - SCANNING' : 'OFFLINE'}
                        </div>
                    </div>
                </div>
                <button
                    onClick={toggleScan}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]
                        ${isScanning
                            ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                            : 'bg-cyan-500 text-black hover:bg-cyan-400'}`}
                >
                    {isScanning ? 'STOP' : 'GO ONLINE'}
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

                {/* Radar / Peer List Section */}
                <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-cyan-500/20 bg-black/20 backdrop-blur flex flex-col">
                    <div className="p-3 border-b border-cyan-500/20 font-mono text-xs text-cyan-400 uppercase tracking-widest flex justify-between items-center bg-cyan-900/10">
                        <span>Nearby Devices ({peers.length})</span>
                        <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {peers.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-cyan-500/30 p-8 text-center">
                                {isScanning ? (
                                    <>
                                        <div className="w-16 h-16 border-2 border-cyan-500/30 rounded-full animate-[ping_2s_linear_infinite] mb-4"></div>
                                        <p className="text-sm">Scanning for nearby fishermen...</p>
                                    </>
                                ) : (
                                    <p className="text-sm">Go Online to discover nearby devices.</p>
                                )}
                            </div>
                        ) : (
                            peers.map(peer => (
                                <div key={peer.endpointId}
                                    className={`p-3 rounded border transition-all duration-300
                                    ${peer.status === 'connected'
                                            ? 'bg-green-500/10 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                                            : 'bg-cyan-900/20 border-cyan-500/20 hover:bg-cyan-800/30'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${peer.status === 'connected' ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                                            <span className="font-bold text-sm text-cyan-100">{peer.endpointName}</span>
                                        </div>
                                        <span className="text-[10px] font-mono opacity-60">{peer.endpointId.slice(0, 4)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs uppercase font-mono text-cyan-400">{peer.status}</span>
                                        {peer.status !== 'connected' && (
                                            <button
                                                onClick={() => handleConnect(peer.endpointId)}
                                                className="px-2 py-1 text-xs bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 rounded border border-cyan-500/30"
                                            >
                                                CONNECT
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-black">
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-cyan-800">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-cyan-500/20">
                                <ShieldAlert className="w-16 h-16 mb-2 opacity-20" />
                                <p className="text-lg font-light">Secure Mesh Channel</p>
                                <p className="text-xs max-w-xs text-center mt-2 opacity-50">Messages sent here are encrypted and transmitted directly between devices via Bluetooth/WiFi Direct.</p>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`cursor-default max-w-[80%] md:max-w-[60%] p-3 rounded-2xl relative group
                                        ${msg.isMe
                                            ? 'bg-cyan-600 text-white rounded-tr-none shadow-lg shadow-cyan-900/20'
                                            : 'bg-slate-800 text-cyan-50 rounded-tl-none border border-cyan-500/20'}`}
                                    >
                                        {!msg.isMe && <div className="text-[10px] text-cyan-400 mb-1 font-bold">{msg.sender}</div>}
                                        <p className="text-sm leading-relaxed">{msg.text}</p>
                                        <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${msg.isMe ? 'text-cyan-200' : 'text-slate-400'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={scrollRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-black/50 backdrop-blur border-t border-cyan-500/20">
                        <div className="flex gap-2 relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Broadcast message to mesh..."
                                className="flex-1 bg-slate-900/80 border border-cyan-500/30 rounded-lg px-4 py-3 text-sm text-cyan-50 placeholder-cyan-500/30 focus:outline-none focus:border-cyan-400 transition-colors shadow-inner"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim()}
                                className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-black p-3 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all transform active:scale-95"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="text-[10px] text-center mt-2 text-cyan-500/40 font-mono">
                            ENCRYPTED • DECENTRALIZED • OFFLINE
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProximityChat;
