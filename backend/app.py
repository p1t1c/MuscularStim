from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import serial
import serial.tools.list_ports
import threading
import time

app = Flask(__name__)
app.config['SECRET_KEY'] = 'stimulator-secret-key'
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Global variables
arduino = None
connected = False
reading_thread = None
stop_reading = False

def list_serial_ports():
    """List all available serial ports"""
    ports = serial.tools.list_ports.comports()
    return [{"port": port.device, "description": port.description} for port in ports]

def read_serial():
    """Background thread to read serial data from Arduino"""
    global arduino, stop_reading
    while not stop_reading and arduino and arduino.is_open:
        try:
            if arduino.in_waiting > 0:
                line = arduino.readline().decode('utf-8').strip()
                print(f"Arduino: {line}")

                # Parse Arduino responses and emit to frontend
                if line.startswith("STATUS:"):
                    status = line.split(":")[1]
                    socketio.emit('status_update', {'status': status})
                elif line.startswith("CONFIRM_PULS:"):
                    value = line.split(":")[1]
                    socketio.emit('param_confirm', {'type': 'puls', 'value': value})
                elif line.startswith("CONFIRM_WAIT:"):
                    value = line.split(":")[1]
                    socketio.emit('param_confirm', {'type': 'wait', 'value': value})
                elif line.startswith("CONFIRM_BURST:"):
                    value = line.split(":")[1]
                    socketio.emit('param_confirm', {'type': 'burst', 'value': value})
                elif line.startswith("CONFIRM_REST:"):
                    value = line.split(":")[1]
                    socketio.emit('param_confirm', {'type': 'rest', 'value': value})
                elif line in ["BURST:START", "BURST:END", "REST:START", "REST:END"]:
                    socketio.emit('burst_event', {'event': line})
                elif line == "SISTEM_GATA" or line == "MODE:BURST":
                    socketio.emit('system_ready', {'message': 'Arduino ready - BURST MODE'})
                else:
                    # Send any other message as log
                    socketio.emit('log_message', {'message': line})

            time.sleep(0.1)
        except Exception as e:
            print(f"Error reading serial: {e}")
            socketio.emit('error', {'message': str(e)})
            break

@app.route('/api/ports', methods=['GET'])
def get_ports():
    """Get list of available serial ports"""
    try:
        ports = list_serial_ports()
        return jsonify({'success': True, 'ports': ports})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/connect', methods=['POST'])
def connect():
    """Connect to Arduino via serial port"""
    global arduino, connected, reading_thread, stop_reading

    try:
        data = request.json
        port = data.get('port', 'COM3')  # Default to COM3
        baudrate = data.get('baudrate', 9600)

        if arduino and arduino.is_open:
            return jsonify({'success': False, 'error': 'Already connected'})

        arduino = serial.Serial(port, baudrate, timeout=1)
        time.sleep(2)  # Wait for Arduino to reset
        connected = True

        # Start reading thread
        stop_reading = False
        reading_thread = threading.Thread(target=read_serial, daemon=True)
        reading_thread.start()

        return jsonify({'success': True, 'message': f'Connected to {port}'})
    except Exception as e:
        connected = False
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/disconnect', methods=['POST'])
def disconnect():
    """Disconnect from Arduino"""
    global arduino, connected, stop_reading

    try:
        stop_reading = True
        if arduino and arduino.is_open:
            # Send STOP command before disconnecting
            arduino.write(b'STOP\n')
            time.sleep(0.5)
            arduino.close()

        arduino = None
        connected = False
        return jsonify({'success': True, 'message': 'Disconnected'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/start', methods=['POST'])
def start_stimulation():
    """Start stimulation"""
    return send_command_helper('START')

@app.route('/api/stop', methods=['POST'])
def stop_stimulation():
    """Stop stimulation"""
    return send_command_helper('STOP')

@app.route('/api/set-burst-params', methods=['POST'])
def set_burst_params():
    """Set all burst mode parameters"""
    try:
        data = request.json
        pulse_duration = data.get('pulseDuration', 200)
        wait_time = data.get('waitTime', 500)
        burst_duration = data.get('burstDuration', 8000)
        rest_duration = data.get('restDuration', 16000)

        # Send all parameters to Arduino
        responses = []
        commands = [
            (f'PULS:{pulse_duration}', 'Pulse duration'),
            (f'WAIT:{wait_time}', 'Wait time'),
            (f'BURST:{burst_duration}', 'Burst duration'),
            (f'REST:{rest_duration}', 'Rest duration')
        ]

        for command, desc in commands:
            if arduino and arduino.is_open:
                arduino.write(f'{command}\n'.encode('utf-8'))
                time.sleep(0.1)
                responses.append(f'{desc} set')
            else:
                return jsonify({'success': False, 'error': 'Not connected to Arduino'})

        return jsonify({'success': True, 'message': 'All burst parameters set', 'details': responses})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/status', methods=['GET'])
def get_status():
    """Get connection status"""
    return jsonify({
        'connected': connected,
        'port': arduino.port if arduino and arduino.is_open else None
    })

def send_command_helper(command):
    """Helper function to send commands"""
    global arduino, connected

    if not connected or not arduino or not arduino.is_open:
        return jsonify({'success': False, 'error': 'Not connected to Arduino'})

    try:
        arduino.write(f'{command}\n'.encode('utf-8'))
        time.sleep(0.1)
        return jsonify({'success': True, 'command': command})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# SocketIO events
@socketio.on('connect')
def handle_connect():
    print('Client connected')
    emit('connection_response', {'status': 'connected'})

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

if __name__ == '__main__':
    print("=" * 50)
    print("  STIMULATOR MUSCULAR - Flask Backend Server")
    print("=" * 50)
    print(f"Server running at: http://localhost:5000")
    print(f"API endpoints available at: http://localhost:5000/api/")
    print("=" * 50)
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
