# USB Serial Connection Setup Guide

## 🔌 How to Connect Arduino to Backend via USB

### Step 1: Hardware Connection

1. **Connect Arduino Uno to Computer**:
   - Use USB cable (Arduino Uno → Computer USB port)
   - Arduino should appear as COM port (e.g., COM3, COM4, COM5)

### Step 2: Upload Updated Arduino Code

1. **Open Arduino IDE**
2. **Open**: `hardware/step3_no_lcd_test/step3_no_lcd_test.ino`
3. **Select Board**: Arduino Uno
4. **Select Port**: Your Arduino's COM port
5. **Upload** the code

### Step 3: Start Backend Server

```powershell
# Navigate to backend folder
cd "c:\Users\Admin\Desktop\RFID-ENABLED AND IOT-BASED GATE AND MONITORING SYSTEM\backend"

# Start the server (this will auto-connect to Arduino)
npm start
```

### Step 4: Test the Connection

#### Expected Backend Output:

```
🔍 Searching for Arduino...
📡 Available ports: COM3 (Arduino LLC), COM4 (CH340), ...
✅ Found Arduino at: COM3
🔗 Connected to Arduino at COM3
```

#### When you scan a card, you'll see:

```
🤖 Arduino: 🔍 Card Scanned: D0D39925
📡 Arduino Event: CARD_SCANNED { cardID: "D0D39925", timestamp: "12345" }
📡 Arduino Event: ACCESS_GRANTED { cardID: "D0D39925", message: "Student access approved" }
```

### Step 5: Monitor Real-Time Events

#### Arduino Serial Monitor (Arduino IDE):

- Baud Rate: 9600
- Shows regular Arduino messages + backend events

#### Backend Console:

- Shows all Arduino events
- Logs database interactions
- WebSocket broadcasts to frontend

#### Frontend Dashboard:

- Real-time access logs
- System status updates
- Live gate monitoring

## 🔄 Data Flow:

```
Arduino Uno → USB Serial → Backend → WebSocket → Frontend Dashboard
     ↓
1. RFID card scanned
2. Arduino validates card
3. Sends JSON event to backend
4. Backend logs to database
5. Frontend updates in real-time
```

## 📱 Real-Time Events Sent to Backend:

### System Events:

- `SYSTEM_READY` - Arduino system started
- `CARD_SCANNED` - RFID card detected
- `ACCESS_GRANTED` - Valid student card
- `ACCESS_DENIED` - Unknown/invalid card
- `GATE_CLOSED` - System returned to ready state

### JSON Format Example:

```json
{
  "event": "ACCESS_GRANTED",
  "timestamp": "12345",
  "cardID": "D0D39925",
  "message": "Student access approved"
}
```

## 🛠️ Troubleshooting:

### Arduino Not Found:

1. Check USB cable connection
2. Install Arduino drivers if needed
3. Check Windows Device Manager for COM ports
4. Try different USB port

### Connection Issues:

1. Close Arduino IDE Serial Monitor
2. Restart backend server
3. Check if another program is using the COM port

### No Data Received:

1. Verify Arduino code is uploaded correctly
2. Check baud rate (should be 9600)
3. Look for `BACKEND_DATA:` messages in Arduino output

## ✅ Success Indicators:

- **Arduino**: LED blinks, buzzer sounds on card scan
- **Backend**: Shows "Connected to Arduino" message
- **Database**: New access logs appear in MongoDB
- **Frontend**: Real-time updates on dashboard

Your system is now fully integrated with **real-time hardware-to-software communication**! 🚀
