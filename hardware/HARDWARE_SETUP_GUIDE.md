# Arduino RFID Gate System - Hardware Setup Guide

## 🔌 Component Wiring Diagram

### Entry & Exit RFID-RC522 Module Connections

```
Entry RFID Module    →    Arduino UNO
VCC           →    3.3V
RST           →    Pin 9
GND           →    GND
MISO          →    Pin 12
MOSI          →    Pin 11
SCK           →    Pin 13
SDA/SS        →    Pin 10

Exit RFID Module    →    Arduino UNO (use different pins)
VCC           →    3.3V
RST           →    Pin 8
GND           →    GND
MISO          →    Pin 6
MOSI          →    Pin 5
SCK           →    Pin 7
SDA/SS        →    Pin 4
```

### Servo Motor (Gate Mechanism)

```
Servo Motor   →    Arduino UNO
Red (VCC)     →    5V
Brown (GND)   →    GND
Orange (PWM)  →    Pin 6
```

### LCD Display (16x2 with I2C) OPTIONAL

```
LCD I2C       →    Arduino UNO
VCC           →    5V
GND           →    GND
SDA           →    A4
SCL           →    A5
```

### LED Indicators

```
Green LED     →    Pin 7 (with 220Ω resistor)
Red LED       →    Pin 8 (with 220Ω resistor)
Both LEDs GND →    GND
```

### Buzzer

```
Buzzer        →    Arduino UNO
Positive      →    Pin 5
Negative      →    GND
```

### Ultrasonic Sensor HC-SR04 OPTIONAL

```
HC-SR04       →    Arduino UNO
VCC           →    5V
GND           →    GND
Trig          →    Pin 4
Echo          →    Pin 3
```


## 📋 Required Arduino Libraries

Install these libraries in Arduino IDE:

1. **MFRC522** - for RFID functionality
2. **Servo** - for gate motor control
3. **LiquidCrystal_I2C** - for LCD display
4. **WiFi** - for ESP32 (if using ESP32 instead of UNO)// im using arduino uno
5. **HTTPClient** - for API communication
6. **ArduinoJson** - for JSON handling

### Installation Steps:

1. Open Arduino IDE
2. Go to **Sketch** → **Include Library** → **Manage Libraries**
3. Search and install each library listed above

## 🛠️ Physical Assembly Steps

### Step 1: Breadboard Setup

1. Place Arduino UNO next to breadboard
2. Connect power rails (red = 5V, blue = GND)
3. Use jumper wires to connect 5V and GND to breadboard rails

### Step 2: RFID Module

1. Connect RFID-RC522 to breadboard
2. Wire according to pin diagram above
3. **Important**: Use 3.3V for VCC, NOT 5V!

### Step 3: Servo Motor

1. Connect servo directly to Arduino (strong enough power)
2. Test servo movement before final assembly

### Step 4: LCD Display

1. Connect I2C LCD module
2. Test display with simple "Hello World" sketch first

### Step 5: LEDs and Buzzer

1. Use 220Ω resistors for LEDs to prevent burnout
2. Connect buzzer directly (built-in current limiting)

### Step 6: Ultrasonic Sensor

1. Mount facing the gate area
2. Use for presence detection and safety

## 🔧 Configuration Changes Needed

### 1. Update WiFi Credentials

```cpp
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";
```

### 2. Update Server IP Address

```cpp
const char* serverURL = "http://YOUR_COMPUTER_IP:3000/api";
```

Find your computer's IP with: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

### 3. I2C LCD Address

If LCD doesn't work, scan for I2C address:

```cpp
LiquidCrystal_I2C lcd(0x27, 16, 2); // Try 0x27 or 0x3F
```

## 🚪 Dual RFID Reader Setup

- Use one RFID reader for entry and another for exit.
- Connect both modules to separate pins on Arduino UNO.
- In your Arduino code, distinguish between entry and exit scans (e.g., send a device/location identifier to backend).
- Update backend to log entry and exit events separately.

## 🧪 Testing Steps

### Step 1: Basic Component Test

1. Upload code to Arduino
2. Check serial monitor for WiFi connection
3. Test each component individually

### Step 2: RFID Test

1. Hold RFID card near reader
2. Check serial monitor for tag reading
3. Verify API calls to backend

### Step 3: Integration Test

1. Add RFID tag to student database
2. Test complete access flow
3. Verify real-time updates in web dashboard

- Test both entry and exit RFID readers.
- Verify that entry logs and exit logs are recorded correctly in the backend and shown in the dashboard.

## 🔧 Troubleshooting

### Common Issues:

1. **RFID not reading**: Check wiring, use 3.3V not 5V
2. **LCD blank**: Wrong I2C address, try 0x3F instead of 0x27
3. **WiFi not connecting**: Check credentials and signal strength
4. **Servo not moving**: Check power supply, may need external power
5. **API calls failing**: Verify computer IP and backend running

### Debug Tips:

- Use Serial Monitor to see real-time status
- Test components one by one
- Check all connections with multimeter
- Verify backend API endpoints with Postman

## 📱 Mobile Hotspot Option

If no WiFi available, use phone hotspot:

1. Enable hotspot on phone
2. Update WiFi credentials in code
3. Use phone's hotspot IP for serverURL

## 🎯 Next Steps

1. **Assemble hardware** following this guide
2. **Test basic functionality** component by component
3. **Update backend** to handle Arduino API calls
4. **Integrate with web dashboard** for real-time monitoring
5. **Build physical gate structure** using cardboard/wood

Your hardware setup is ready for a professional capstone demonstration!
