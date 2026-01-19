const { useState, useEffect, useRef } = React;

const API_URL = 'http://localhost:5000';

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
                <h1>⚡ Stimulator Muscular</h1>
                <p className="subtitle">Protocol Denervare - Control Web</p>
            </header>

            <div className={`status-bar ${connected ? 'connected' : ''}`}>
                <div className="status-indicator">
                    <span className={`status-dot ${connected ? 'active' : ''}`}></span>
                    <span>{connected ? 'Conectat' : 'Deconectat'}</span>
                </div>
                {stimulating && (
                    <div className="stimulation-indicator">
                        <span className="pulse-icon">⚡</span>
                        <span>Stimulare activă</span>
                    </div>
                )}
            </div>

            <div className="control-panel">
                {/* Connection Section */}
                <section className="card">
                    <h2>Conexiune Arduino</h2>
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
                            className="btn btn-secondary"
                        >
                            🔄 Reîncarcă
                        </button>
                    </div>
                    <div className="button-group">
                        <button
                            onClick={connectArduino}
                            disabled={connected}
                            className="btn btn-primary"
                        >
                            🔌 Conectează
                        </button>
                        <button
                            onClick={disconnectArduino}
                            disabled={!connected}
                            className="btn btn-secondary"
                        >
                            Deconectează
                        </button>
                    </div>
                </section>

                {/* Stimulation Control */}
                <section className="card">
                    <h2>Control Stimulare</h2>
                    <div className="button-group">
                        <button
                            onClick={startStimulation}
                            disabled={!connected || stimulating}
                            className="btn btn-success"
                        >
                            ▶️ START
                        </button>
                        <button
                            onClick={stopStimulation}
                            disabled={!connected || !stimulating}
                            className="btn btn-danger"
                        >
                            ⏹️ STOP
                        </button>
                    </div>
                    <div className={`pulse-display ${isPulsing ? 'pulsing' : ''}`}>
                        <div className="pulse-wave"></div>
                    </div>
                </section>

                {/* Parameters */}
                <section className="card">
                    <h2>Parametri Impuls</h2>

                    <div className="param-control">
                        <label>
                            Durată Impuls: <strong>{durata} ms</strong>
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
                            Pauză între Impulsuri: <strong>{pauza} ms</strong>
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
                        className="btn btn-primary"
                    >
                        Aplică Parametri
                    </button>
                </section>

                {/* Info Display */}
                <section className="card info-card">
                    <h2>Informații Active</h2>
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-label">Durată:</span>
                            <span className="info-value">{durata} ms</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Pauză:</span>
                            <span className="info-value">{pauza} ms</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Frecvență:</span>
                            <span className="info-value">~{frequency} Hz</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Ciclu complet:</span>
                            <span className="info-value">{durata + pauza} ms</span>
                        </div>
                    </div>
                </section>

                {/* Activity Log */}
                <section className="card">
                    <h2>Monitor Activitate</h2>
                    <div className="activity-log">
                        {logs.length === 0 ? (
                            <p className="log-empty">Aștept evenimente...</p>
                        ) : (
                            logs.map((log, index) => (
                                <div key={index} className="log-entry">
                                    <span className="log-time">{log.time}</span>
                                    <span className="log-message">{log.message}</span>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

            <footer>
                <p>⚠️ Asigurați-vă că Arduino este conectat și portul serial este corect</p>
                <p className="tech-info">React + Flask + Socket.IO</p>
            </footer>
        </div>
    );
}

// Render the app
ReactDOM.render(<App />, document.getElementById('root'));
