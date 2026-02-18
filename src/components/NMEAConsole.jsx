import React, { useState, useEffect, useRef } from 'react';
import { getCurrentPosition, watchPosition } from '../services/locationService';
import { generateNMEABlock } from '../services/nmeaBuilder';

const NMEAConsole = ({ isOpen, onClose }) => {
    const [logs, setLogs] = useState([]);
    const [isPaused, setIsPaused] = useState(false);
    const logEndRef = useRef(null);

    useEffect(() => {
        if (!isOpen || isPaused) return;

        // Initial position
        getCurrentPosition().then(pos => {
            addLog(generateNMEABlock(pos));
        }).catch(() => { });

        // Live stream
        const stopWatch = watchPosition((pos) => {
            addLog(generateNMEABlock(pos));
        });

        return () => stopWatch();
    }, [isOpen, isPaused]);

    const addLog = (text) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [...prev.slice(-49), `[${time}] ${text}`]); // Keep last 50
    };

    useEffect(() => {
        if (logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-2xl bg-black border border-cyan-500/50 rounded-lg shadow-2xl flex flex-col h-[70dvh] sm:h-[500px] font-mono text-sm overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-cyan-900/20 border-b border-cyan-500/30">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                        <h3 className="text-cyan-400 font-bold tracking-wider">NMEA 0183 STREAM</h3>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsPaused(!isPaused)}
                            className={`px-3 py-1 text-xs rounded border ${isPaused ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'bg-green-500/20 border-green-500 text-green-500 hover:bg-green-500/30'}`}
                        >
                            {isPaused ? 'RESUME' : 'PAUSE'}
                        </button>
                        <button
                            onClick={() => { navigator.clipboard.writeText(logs.join('\n')); }}
                            className="px-3 py-1 text-xs bg-cyan-500/10 border border-cyan-500 text-cyan-400 rounded hover:bg-cyan-500/20"
                        >
                            COPY
                        </button>
                        <button
                            onClick={onClose}
                            className="px-3 py-1 text-xs text-red-400 hover:text-red-300"
                        >
                            CLOSE
                        </button>
                    </div>
                </div>

                {/* Console Output */}
                <div className="flex-1 p-4 overflow-y-auto bg-black/90 scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-transparent">
                    {logs.length === 0 ? (
                        <div className="text-gray-500 italic">Waiting for GPS fix...</div>
                    ) : (
                        logs.map((log, i) => (
                            <div key={i} className="mb-1 break-all">
                                <span className="text-gray-500 mr-2">{log.split(']')[0]}]</span>
                                <span className="text-green-400">{log.split(']')[1]}</span>
                            </div>
                        ))
                    )}
                    <div ref={logEndRef} />
                </div>

                {/* Diagnostics Footer */}
                <div className="px-4 py-2 bg-gray-900 border-t border-gray-800 text-xs text-gray-500 flex justify-between">
                    <span>PROTOCOL: NMEA 0183 v4.10</span>
                    <span>BAUD: 4800 (Simulated)</span>
                </div>
            </div>
        </div>
    );
};

export default NMEAConsole;
