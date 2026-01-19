# Muscle Stimulator - Web Control Application

Web application for controlling a muscle stimulator via Arduino using the denervation protocol.

## Project Structure

```
stimulator/
├── backend/
│   ├── app.py              # Flask server with Socket.IO
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── index.html         # Main HTML file
│   ├── app.js            # React app (vanilla JS)
│   └── style.css         # CSS styles
├── test                   # Arduino code
└── README.md
```

## Installation and Setup

### Prerequisites

- Python 3.8+
- Arduino IDE
- Modern web browser (Chrome/Edge/Firefox)
- USB drivers for Arduino

### 1. Backend Setup (Flask)

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment (optional but recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Upload Code to Arduino

1. Open the `test` file in Arduino IDE
2. Select the correct board (Tools > Board)
3. Select the correct COM port (Tools > Port)
4. Upload the code to Arduino (Ctrl+U)

### 3. Start the Application

#### Backend (Flask Server)

```bash
cd backend
python app.py
```

The server will start on `http://localhost:5000`

#### Frontend

Open the `frontend/index.html` file in your browser or use a local HTTP server:

```bash
cd frontend

# Option 1: Python HTTP Server
python -m http.server 8000

# Option 2: Node.js http-server (if installed)
npx http-server -p 8000

# Option 3: PHP (if installed)
php -S localhost:8000
```

Then open your browser at `http://localhost:8000`

## API Endpoints

### Backend (Flask)

- `GET /api/ports` - List available serial ports
- `POST /api/connect` - Connect to Arduino
  ```json
  {"port": "COM3", "baudrate": 9600}
  ```
- `POST /api/disconnect` - Disconnect from Arduino
- `POST /api/start` - Start stimulation
- `POST /api/stop` - Stop stimulation
- `POST /api/set-durata` - Set pulse duration
  ```json
  {"durata": 50}
  ```
- `POST /api/set-pauza` - Set pause between pulses
  ```json
  {"pauza": 1500}
  ```
- `GET /api/status` - Connection status

### WebSocket Events (Socket.IO)

**Client -> Server:**
- `connect` - WebSocket connection

**Server -> Client:**
- `status_update` - Stimulation status update
- `param_confirm` - Parameter confirmation
- `system_ready` - Arduino ready
- `log_message` - Log messages
- `error` - Error messages

## Usage

1. **Connect Arduino**
   - Select the correct COM port from the dropdown
   - Click "Connect"
   - Verify that the status becomes "Connected" (green indicator)

2. **Control Stimulation**
   - Click "START" to begin stimulation
   - Click "STOP" to stop stimulation
   - Observe the real-time visual pulse indicator

3. **Parameter Adjustment**
   - Modify pulse duration (10-200 ms)
   - Modify pause between pulses (0.5-5 seconds)
   - Click "Apply Parameters" to send changes to Arduino

4. **Monitoring**
   - View approximate frequency in the "Active Information" section
   - Track activity in the real-time log

## Arduino Protocol

### Commands Sent to Arduino:

- `START` - Start stimulation
- `STOP` - Stop stimulation
- `DUR:50` - Set duration to 50ms
- `PAUZA:1500` - Set pause to 1500ms

### Responses from Arduino:

- `SISTEM_GATA` - Arduino initialized
- `STATUS:ACTIV` - Stimulation active
- `STATUS:OPRIT` - Stimulation stopped
- `CONFIRM_DUR:50` - Duration confirmed
- `CONFIRM_PAUZA:1500` - Pause confirmed

## Technical Parameters

### Stimulator
- **Signal pin**: 9 (output to OPA541)
- **LED pin**: 13 (visual indicator)
- **Baud rate**: 9600
- **Protocol**: Non-blocking, based on millis()

### Adjustable Parameters
- **Pulse duration**: 10-200 ms (default: 50 ms)
- **Pause between pulses**: 500-5000 ms (default: 1500 ms)
- **Resulting frequency**: ~0.65 Hz (with default values)

## Troubleshooting

### Arduino Won't Connect
- Verify the COM port is correct
- Check that Arduino is connected via USB
- Ensure Arduino IDE is not open (it blocks the port)
- Reinstall USB drivers for Arduino

### Frontend Won't Connect to Backend
- Verify Flask server is running on port 5000
- Check firewall settings
- Open browser Console (F12) for errors

### Socket.IO Not Working
- Verify `flask-socketio` is installed correctly
- Check Socket.IO client and server versions
- Verify CORS settings in `app.py`

### Commands Don't Reach Arduino
- Check logs in backend terminal
- Verify Arduino is responding (LED on pin 13)
- Test serial communication directly from Arduino IDE (Serial Monitor)

## Dependencies

### Backend (Python)
- Flask 3.0.0
- Flask-SocketIO 5.3.5
- Flask-CORS 4.0.0
- pyserial 3.5
- python-socketio 5.10.0
- eventlet 0.33.3

### Frontend
- React 18 (CDN)
- ReactDOM 18 (CDN)
- Babel Standalone (CDN)
- Socket.IO Client 4.5.4 (CDN)

## Safety

- DO NOT use on patients without medical supervision
- Always verify parameters before use
- Test on resistor/LED before real applications
- Ensure OPA541 circuit is correctly connected

