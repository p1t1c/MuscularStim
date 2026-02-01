import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

const API_URL = 'http://localhost:5000';

// SVG Icons Components
const Icons = {
    Activity: () => (
        <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
    ),
    Settings: () => (
        <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    Usb: () => (
        <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
    Refresh: () => (
        <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
    ),
    Play: () => (
        <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    Stop: () => (
        <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
        </svg>
    ),
    Chart: () => (
        <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    ),
    Terminal: () => (
        <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
    Check: () => (
        <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    Alert: () => (
        <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    )
};

function App() {
    // State management
    const [connected, setConnected] = useState(false);
    const [stimulating, setStimulating] = useState(false);
    const [ports, setPorts] = useState([]);
    const [selectedPort, setSelectedPort] = useState('COM3');

    // Burst mode parameters
    const [pulseDuration, setPulseDuration] = useState(200);      // 200 ms
    const [waitTime, setWaitTime] = useState(500);                 // 500 ms
    const [burstDuration, setBurstDuration] = useState(8000);     // 8 seconds
    const [restDuration, setRestDuration] = useState(16000);      // 16 seconds

    const [logs, setLogs] = useState([]);
    const [isPulsing, setIsPulsing] = useState(false);
    const [inBurst, setInBurst] = useState(false);
    const [scopeData, setScopeData] = useState([]);
    const [phaseTimer, setPhaseTimer] = useState(0);

    const socketRef = useRef(null);
    const canvasRef = useRef(null);
    const phaseStartTimeRef = useRef(0);

    // Initialize Socket.IO connection
    useEffect(() => {
        socketRef.current = io(API_URL);

        socketRef.current.on('connect', () => {
            addLog('WebSocket conectat');
        });

        socketRef.current.on('status_update', (data) => {
            addLog(`Status: ${data.status}`);
            if (data.status === 'ACTIV') {
                setStimulating(true);
            } else if (data.status === 'OPRIT') {
                setStimulating(false);
                setIsPulsing(false);
                setInBurst(false);
            }
        });

        socketRef.current.on('burst_event', (data) => {
            if (data.event === 'BURST:START') {
                setInBurst(true);
                phaseStartTimeRef.current = Date.now();
                addLog('Burst started - 8 seconds of pulses');
            } else if (data.event === 'BURST:END') {
                setInBurst(false);
                setIsPulsing(false);
                addLog('Burst ended - entering rest period');
            } else if (data.event === 'REST:START') {
                phaseStartTimeRef.current = Date.now();
                addLog('Rest period - 16 seconds pause');
            } else if (data.event === 'REST:END') {
                addLog('Rest ended - starting new burst');
            }
        });

        socketRef.current.on('param_confirm', (data) => {
            const paramNames = {
                'puls': 'Pulse Duration',
                'wait': 'Wait Time',
                'burst': 'Burst Duration',
                'rest': 'Rest Duration'
            };
            addLog(`${paramNames[data.type] || data.type} set to: ${data.value} ms`);
        });

        socketRef.current.on('system_ready', () => {
            addLog('Arduino ready - BURST MODE');
        });

        socketRef.current.on('log_message', (data) => {
            addLog(data.message);
        });

        socketRef.current.on('error', (data) => {
            addLog(`Error: ${data.message}`);
        });

        // Load available ports on mount
        loadPorts();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
        // eslint-disable-next-line
    }, []);

    // Pulse animation when stimulating AND in burst
    useEffect(() => {
        if (stimulating && inBurst) {
            const interval = setInterval(() => {
                setIsPulsing(true);
                setTimeout(() => setIsPulsing(false), pulseDuration);
            }, pulseDuration + waitTime);

            return () => {
                clearInterval(interval);
                setIsPulsing(false);
            };
        } else {
            // Ensure pulse is stopped when not in burst or not stimulating
            setIsPulsing(false);
        }
    }, [stimulating, inBurst, pulseDuration, waitTime]);

    // Oscilloscope data collection
    useEffect(() => {
        if (stimulating) {
            const interval = setInterval(() => {
                const value = isPulsing ? 1 : 0;
                setScopeData(prev => {
                    const newData = [...prev, value];
                    return newData.slice(-100); // Keep last 100 points
                });
            }, 50); // Update every 50ms

            return () => clearInterval(interval);
        } else {
            setScopeData([]);
        }
    }, [stimulating, isPulsing]);

    // Set canvas size
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeCanvas = () => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    // Timer countdown logic
    useEffect(() => {
        if (!stimulating) {
            setPhaseTimer(0);
            return;
        }

        const interval = setInterval(() => {
            const elapsed = Date.now() - phaseStartTimeRef.current;
            const totalDuration = inBurst ? burstDuration : restDuration;
            const remaining = Math.max(0, Math.ceil((totalDuration - elapsed) / 1000));
            setPhaseTimer(remaining);
        }, 100);

        return () => clearInterval(interval);
    }, [stimulating, inBurst, burstDuration, restDuration]);

    // Draw oscilloscope
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        if (width === 0 || height === 0) return;

        // Clear canvas
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, width, height);

        // Draw grid
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = (height / 5) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Draw waveform
        if (scopeData.length > 1) {
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 2;
            ctx.beginPath();

            const xStep = width / scopeData.length;
            scopeData.forEach((value, index) => {
                const x = index * xStep;
                const y = height - (value * height * 0.8) - (height * 0.1);

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.stroke();
        }

        // Draw labels
        ctx.fillStyle = '#64748b';
        ctx.font = '10px monospace';
        ctx.fillText('HIGH', 5, 15);
        ctx.fillText('LOW', 5, height - 5);
    }, [scopeData]);

    const addLog = (message) => {
        const timestamp = new Date().toLocaleTimeString('ro-RO');
        setLogs(prev => [{time: timestamp, message}, ...prev].slice(0, 50));
    };

    const loadPorts = async () => {
        try {
            const response = await fetch(`${API_URL}/api/ports`);
            const data = await response.json();
            if (data.success) {
                setPorts(data.ports);
                if (data.ports.length > 0) {
                    setSelectedPort(data.ports[0].port);
                }
            }
        } catch (error) {
            addLog(`❌ Eroare la încărcarea porturilor: ${error.message}`);
        }
    };

    const connectArduino = async () => {
        try {
            const response = await fetch(`${API_URL}/api/connect`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({port: selectedPort, baudrate: 9600})
            });
            const data = await response.json();

            if (data.success) {
                setConnected(true);
                addLog(`✓ Conectat la ${selectedPort}`);
            } else {
                addLog(`❌ Conexiune eșuată: ${data.error}`);
            }
        } catch (error) {
            addLog(`❌ Eroare conexiune: ${error.message}`);
        }
    };

    const disconnectArduino = async () => {
        try {
            const response = await fetch(`${API_URL}/api/disconnect`, {
                method: 'POST'
            });
            const data = await response.json();

            if (data.success) {
                setConnected(false);
                setStimulating(false);
                addLog('Deconectat de la Arduino');
            }
        } catch (error) {
            addLog(`❌ Eroare deconectare: ${error.message}`);
        }
    };

    const startStimulation = async () => {
        try {
            const response = await fetch(`${API_URL}/api/start`, {method: 'POST'});
            const data = await response.json();

            if (data.success) {
                addLog('▶ START stimulare');
            } else {
                addLog(`❌ ${data.error}`);
            }
        } catch (error) {
            addLog(`❌ Eroare: ${error.message}`);
        }
    };

    const stopStimulation = async () => {
        try {
            const response = await fetch(`${API_URL}/api/stop`, {method: 'POST'});
            const data = await response.json();

            if (data.success) {
                addLog('⏹ STOP stimulare');
            }
        } catch (error) {
            addLog(`❌ Eroare: ${error.message}`);
        }
    };

    const applyParameters = async () => {
        try {
            // Set all burst parameters
            await fetch(`${API_URL}/api/set-burst-params`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    pulseDuration,
                    waitTime,
                    burstDuration,
                    restDuration
                })
            });

            addLog('⚙ Burst parameters applied successfully');
        } catch (error) {
            addLog(`❌ Error setting parameters: ${error.message}`);
        }
    };

    // Calculate pulse frequency within burst
    const pulseFrequency = (1000 / (pulseDuration + waitTime)).toFixed(2);
    // Calculate number of pulses per burst
    const pulsesPerBurst = Math.floor(burstDuration / (pulseDuration + waitTime));

    return (
        <div className="container">
            <header>
                <h1>Muscle Stimulator Control</h1>
                <p className="subtitle">Denervation Protocol - Medical Device Interface</p>
            </header>

            <div className={`status-bar ${connected ? 'connected' : ''}`}>
                <div className="status-indicator">
                    <span className={`status-dot ${connected ? 'active' : ''}`}></span>
                    <span>{connected ? 'Connected' : 'Disconnected'}</span>
                </div>
                {stimulating && (
                    <div className="stimulation-indicator">
                        <span className="pulse-icon"><Icons.Activity /></span>
                        <span>Stimulation Active</span>
                    </div>
                )}
            </div>

            <div className="control-panel">
                {/* LEFT COLUMN - Connection & Control */}
                <section className="card">
                    <div className="section-group">
                        <h2><Icons.Usb /> Device Connection</h2>
                        <div className="connection-controls">
                            <select
                                value={selectedPort}
                                onChange={(e) => setSelectedPort(e.target.value)}
                                disabled={connected}
                                className="port-select"
                            >
                                {ports.map(port => (
                                    <option key={port.port} value={port.port}>
                                        {port.port} - {port.description}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={loadPorts}
                                disabled={connected}
                                className="btn btn-secondary btn-icon"
                            >
                                <Icons.Refresh />
                            </button>
                        </div>
                        <div className="button-group">
                            <button
                                onClick={connectArduino}
                                disabled={connected}
                                className="btn btn-primary"
                            >
                                <Icons.Check /> Connect
                            </button>
                            <button
                                onClick={disconnectArduino}
                                disabled={!connected}
                                className="btn btn-secondary"
                            >
                                Disconnect
                            </button>
                        </div>
                    </div>

                    <div className="divider"></div>

                    <div className="section-group">
                        <h2><Icons.Activity /> Stimulation Control</h2>
                        <div className="button-group">
                            <button
                                onClick={startStimulation}
                                disabled={!connected || stimulating}
                                className="btn btn-success btn-lg"
                            >
                                <Icons.Play /> START
                            </button>
                            <button
                                onClick={stopStimulation}
                                disabled={!connected || !stimulating}
                                className="btn btn-danger btn-lg"
                            >
                                <Icons.Stop /> STOP
                            </button>
                        </div>
                    </div>
                </section>

                {/* CENTER COLUMN - Visual Feedback & Parameters */}
                <section className="card">
                    <h2><Icons.Activity /> Pulse Indicator</h2>
                    <div className={`pulse-display ${isPulsing ? 'pulsing' : ''}`}>
                        <div className="pulse-wave"></div>
                    </div>

                    <div className="oscilloscope-container">
                        {stimulating && (
                            <div className="phase-timer-top">
                                <span className={`phase-indicator ${inBurst ? 'burst' : 'rest'}`}>
                                    {inBurst ? 'BURST' : 'REST'} - {phaseTimer}s
                                </span>
                            </div>
                        )}
                        <canvas
                            ref={canvasRef}
                            className="oscilloscope-canvas"
                        />
                    </div>

                    <div className="divider"></div>

                    <div className="section-group">
                        <h2><Icons.Settings /> Burst Parameters</h2>

                        <div className="param-control">
                            <label>
                                Pulse Duration: <strong>{pulseDuration} ms</strong>
                            </label>
                            <input
                                type="range"
                                min="50"
                                max="500"
                                step="10"
                                value={pulseDuration}
                                onChange={(e) => setPulseDuration(Number(e.target.value))}
                                disabled={!connected}
                            />
                            <div className="param-info">
                                <span>50 ms</span>
                                <span>500 ms</span>
                            </div>
                        </div>

                        <div className="param-control">
                            <label>
                                Wait Between Pulses: <strong>{waitTime} ms</strong>
                            </label>
                            <input
                                type="range"
                                min="100"
                                max="2000"
                                step="50"
                                value={waitTime}
                                onChange={(e) => setWaitTime(Number(e.target.value))}
                                disabled={!connected}
                            />
                            <div className="param-info">
                                <span>100 ms</span>
                                <span>2000 ms</span>
                            </div>
                        </div>

                        <div className="param-control">
                            <label>
                                Burst Duration: <strong>{(burstDuration / 1000).toFixed(1)} s</strong>
                            </label>
                            <input
                                type="range"
                                min="1000"
                                max="30000"
                                step="1000"
                                value={burstDuration}
                                onChange={(e) => setBurstDuration(Number(e.target.value))}
                                disabled={!connected}
                            />
                            <div className="param-info">
                                <span>1 s</span>
                                <span>30 s</span>
                            </div>
                        </div>

                        <div className="param-control">
                            <label>
                                Rest Duration: <strong>{(restDuration / 1000).toFixed(1)} s</strong>
                            </label>
                            <input
                                type="range"
                                min="5000"
                                max="60000"
                                step="1000"
                                value={restDuration}
                                onChange={(e) => setRestDuration(Number(e.target.value))}
                                disabled={!connected}
                            />
                            <div className="param-info">
                                <span>5 s</span>
                                <span>60 s</span>
                            </div>
                        </div>

                        <button
                            onClick={applyParameters}
                            disabled={!connected}
                            className="btn btn-primary btn-block"
                        >
                            <Icons.Check /> Apply Burst Parameters
                        </button>
                    </div>
                </section>

                {/* RIGHT COLUMN - Info & Logs */}
                <section className="card">
                    <div className="section-group info-card">
                        <h2><Icons.Chart /> Burst Protocol Info</h2>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-label">Pulse</span>
                                <span className="info-value">{pulseDuration} ms</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Wait</span>
                                <span className="info-value">{waitTime} ms</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Burst</span>
                                <span className="info-value">{(burstDuration / 1000).toFixed(1)} s</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Rest</span>
                                <span className="info-value">{(restDuration / 1000).toFixed(1)} s</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Pulse Freq</span>
                                <span className="info-value">~{pulseFrequency} Hz</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Pulses/Burst</span>
                                <span className="info-value">{pulsesPerBurst}</span>
                            </div>
                        </div>
                    </div>

                    <div className="divider"></div>

                    <div className="section-group" style={{flex: 1, minHeight: 0}}>
                        <h2><Icons.Terminal /> Activity Monitor</h2>
                        <div className="activity-log">
                            {logs.length === 0 ? (
                                <p className="log-empty">Waiting for events...</p>
                            ) : (
                                logs.map((log, index) => (
                                    <div key={index} className="log-entry">
                                        <span className="log-time">{log.time}</span>
                                        <span className="log-message">{log.message}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </section>
            </div>

            <footer>
                <p><Icons.Alert /> Ensure Arduino is connected and serial port is correct</p>
                <p className="tech-info">Medical Device Control System - React + Flask + Socket.IO</p>
            </footer>
        </div>
    );
}

export default App;
