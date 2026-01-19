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
    const [durata, setDurata] = useState(50);
    const [pauza, setPauza] = useState(1500);
    const [logs, setLogs] = useState([]);
    const [isPulsing, setIsPulsing] = useState(false);

    const socketRef = useRef(null);

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
            }
        });

        socketRef.current.on('param_confirm', (data) => {
            addLog(`✓ ${data.type === 'durata' ? 'Durată' : 'Pauză'} setată: ${data.value} ms`);
        });

        socketRef.current.on('system_ready', () => {
            addLog('✓ Arduino gata!');
        });

        socketRef.current.on('log_message', (data) => {
            addLog(data.message);
        });

        socketRef.current.on('error', (data) => {
            addLog(`❌ Eroare: ${data.message}`);
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

    // Pulse animation when stimulating
    useEffect(() => {
        if (stimulating) {
            const interval = setInterval(() => {
                setIsPulsing(true);
                setTimeout(() => setIsPulsing(false), durata);
            }, durata + pauza);

            return () => clearInterval(interval);
        }
    }, [stimulating, durata, pauza]);

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
            // Set durata
            await fetch(`${API_URL}/api/set-durata`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({durata})
            });

            // Set pauza
            await fetch(`${API_URL}/api/set-pauza`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({pauza})
            });

            addLog('⚙ Parametri aplicați');
        } catch (error) {
            addLog(`❌ Eroare setare parametri: ${error.message}`);
        }
    };

    const frequency = (1000 / (durata + pauza)).toFixed(2);

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

                    <div className="divider"></div>

                    <div className="section-group">
                        <h2><Icons.Settings /> Pulse Parameters</h2>

                        <div className="param-control">
                            <label>
                                Pulse Duration: <strong>{durata} ms</strong>
                            </label>
                            <input
                                type="range"
                                min="10"
                                max="200"
                                step="5"
                                value={durata}
                                onChange={(e) => setDurata(Number(e.target.value))}
                                disabled={!connected}
                            />
                            <div className="param-info">
                                <span>10 ms</span>
                                <span>200 ms</span>
                            </div>
                        </div>

                        <div className="param-control">
                            <label>
                                Pause Between Pulses: <strong>{pauza} ms</strong>
                            </label>
                            <input
                                type="range"
                                min="500"
                                max="5000"
                                step="100"
                                value={pauza}
                                onChange={(e) => setPauza(Number(e.target.value))}
                                disabled={!connected}
                            />
                            <div className="param-info">
                                <span>0.5 s</span>
                                <span>5.0 s</span>
                            </div>
                        </div>

                        <button
                            onClick={applyParameters}
                            disabled={!connected}
                            className="btn btn-primary btn-block"
                        >
                            <Icons.Check /> Apply Parameters
                        </button>
                    </div>
                </section>

                {/* RIGHT COLUMN - Info & Logs */}
                <section className="card">
                    <div className="section-group info-card">
                        <h2><Icons.Chart /> Active Parameters</h2>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-label">Duration</span>
                                <span className="info-value">{durata} ms</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Pause</span>
                                <span className="info-value">{pauza} ms</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Frequency</span>
                                <span className="info-value">~{frequency} Hz</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Full Cycle</span>
                                <span className="info-value">{durata + pauza} ms</span>
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
