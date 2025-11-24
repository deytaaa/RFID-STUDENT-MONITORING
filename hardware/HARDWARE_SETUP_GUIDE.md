# Arduino RFID Gate System - Hardware Setup Guide

## 🔌 Component Wiring Diagram

### 🎨 Wire Color Coding Standard

Follow this color coding for professional assembly and easy troubleshooting:

```
🔴 Red Wire     →    Power (VCC, 5V, 3.3V)
⚫ Black Wire   →    Ground (GND)
🔵 Blue Wire    →    Data/Communication (SDA, MISO)
🟡 Yellow Wire  →    Clock/Communication (SCL, SCK)
🟢 Green Wire   →    MOSI/LED Positive
🟠 Orange Wire  →    Reset/Control Signals
⚪ White Wire   →    Chip Select (SS/SDA)
🟤 Brown Wire   →    Alternative Ground/Clock
🟣 Purple Wire  →    Alternative Data Lines
🩷 Pink Wire    →    Alternative Control
```

### Entry & Exit RFID-RC522 Module Connections (Dual Reader, Shared SPI)

```
Entry RFID Module    →    Arduino UNO              Wire Color
VCC           →    3.3V (shared)             (Red Wire)
RST           →    Pin 9                     (Orange Wire)
GND           →    GND (shared)              (Black Wire)
MISO          →    Pin 12 (shared SPI)       (Blue Wire)
MOSI          →    Pin 11 (shared SPI)       (Green Wire)
SCK           →    Pin 13 (shared SPI)       (Yellow Wire)
SDA/SS        →    Pin 10                    (White Wire)

Exit RFID Module    →    Arduino UNO              Wire Color
VCC           →    3.3V (shared)             (Red Wire)
RST           →    Pin 3                     (Pink Wire)
GND           →    GND (shared)              (Black Wire)
MISO          →    Pin 12 (shared SPI)       (Blue Wire)
MOSI          →    Pin 11 (shared SPI)       (Green Wire)
SCK           →    Pin 13 (shared SPI)       (Yellow Wire)
SDA/SS        →    Pin 4                     (Violet Wire)
```

**Note:**

- Both RFID modules share the Arduino's single 3.3V and GND pins. Use a breadboard rail or jumper wires to split power.
- SPI data lines (MOSI, MISO, SCK) are shared (Pins 11, 12, 13). Do NOT use A0, A1, or A2 for SPI data lines.
- Each RFID module must have a unique SS (SDA) and RST pin.
- Make sure no other device uses pins 3, 4, 9, or 10.

#### Shared SPI Bus Diagram (ASCII)

```
         +-------------------+         +-------------------+
         |   RFID ENTRY      |         |   RFID EXIT       |
         +-------------------+         +-------------------+
         | VCC  GND  SCK     |         | VCC  GND  SCK     |
         |  |    |    |      |         |  |    |    |      |
         |  |    |    |      |         |  |    |    |      |
         +--+----+----+------+---------+--+----+----+------|
            |    |    |      |            |    |    |      |
           3.3V GND  13(SCK) |           3.3V GND  13(SCK) |
                 |    |      |                 |    |      |
                12(MISO)     |                12(MISO)     |
                 |           |                 |           |
                11(MOSI)     |                11(MOSI)     |
                 |           |                 |           |
                10(SS)       |                4(SS)        |
                 9(RST)      |                3(RST)       |
```

### Servo Motor (Gate Mechanism)

```
Servo Motor   →    Arduino UNO              Wire Color
Red (VCC)     →    5V                       (Red Wire - Power)
Brown (GND)   →    GND                      (Brown/Black Wire - Ground)
Orange (PWM)  →    Pin 6                    (Orange/Yellow Wire - Signal)
```

### LCD Display (16x2 with I2C) optional!! im not using this

```
LCD I2C       →    Arduino UNO              Wire Color
VCC           →    5V                       (Red Wire)
GND           →    GND                      (Black Wire)
SDA           →    A4                       (Blue Wire - Data)
SCL           →    A5                       (Yellow Wire - Clock)
```

### LED Indicators

```
Component           →    Arduino UNO              Wire Color
Green LED (+)       →    Pin 7 (with 220Ω)       (Green Wire)
Green LED (-)       →    GND                      (Black Wire)
Red LED (+)         →    Pin 8 (with 220Ω)       (Red Wire)
Red LED (-)         →    GND                      (Black Wire)
```

### Buzzer

```
Buzzer        →    Arduino UNO              Wire Color
Positive      →    Pin 5                    (Red Wire)
Negative      →    GND                      (Black Wire)
```

## 📊 Current Working Pin Assignments

### ✅ Physical Implementation (Tested & Working):

```
Arduino UNO Pin Usage:
├── Pin 3:  Exit RFID RST
├── Pin 4:  Exit RFID SS
├── Pin 5:  Piezo Buzzer
├── Pin 6:  Servo Motor PWM
├── Pin 7:  Green LED (Access Granted)
├── Pin 8:  Red LED (Access Denied)
├── Pin 9:  Entry RFID RST
├── Pin 10: Entry RFID SS
├── Pin 11: RFID MOSI (SPI, shared)
├── Pin 12: RFID MISO (SPI, shared)
├── Pin 13: RFID SCK (SPI, shared)
├── 3.3V:   RFID Module Power (shared)
├── 5V:     Servo Motor Power
└── GND:    Common Ground (shared)
```

### 🔄 Database Configuration Update Needed:

Your MongoDB device document should reflect actual pins:

```javascript
"ledPins": {
  "green": 7,  // Actual physical pin
  "red": 8     // Actual physical pin
}
```

### ~~Ultrasonic Sensor HC-SR04~~ // REMOVED - Not used in final design

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
2. Connect power rails using **RED** wire (5V) and **BLACK** wire (GND)
3. Use **RED** jumper wire: Arduino 5V → Breadboard positive rail (+)
4. Use **BLACK** jumper wire: Arduino GND → Breadboard negative rail (-)

### Step 2: Entry RFID Module

1. Connect RFID-RC522 to breadboard
2. Use the following **color-coded wires**:
   - **RED** wire: RFID VCC → Arduino 3.3V ⚠️ (NOT 5V!)
   - **BLACK** wire: RFID GND → Arduino GND
   - **ORANGE** wire: RFID RST → Arduino Pin 9
   - **WHITE** wire: RFID SDA/SS → Arduino Pin 10
   - **GREEN** wire: RFID MOSI → Arduino Pin 11
   - **BLUE** wire: RFID MISO → Arduino Pin 12
   - **YELLOW** wire: RFID SCK → Arduino Pin 13

### Step 3: Servo Motor (Gate Mechanism)

1. Connect servo using **standard servo wire colors**:
   - **RED** wire: Servo VCC → Arduino 5V
   - **BROWN/BLACK** wire: Servo GND → Arduino GND
   - **ORANGE/YELLOW** wire: Servo Signal → Arduino Pin 6
2. Servo has built-in wires - **DO NOT** cut or modify them
3. Test servo movement before final assembly

### Step 4: LCD Display (Optional - Not Currently Used)

1. Connect I2C LCD using **color-coded wires**:
   - **RED** wire: LCD VCC → Arduino 5V
   - **BLACK** wire: LCD GND → Arduino GND
   - **BLUE** wire: LCD SDA → Arduino A4
   - **YELLOW** wire: LCD SCL → Arduino A5
2. Test display with simple "Hello World" sketch first

### Step 5: LEDs and Buzzer

**LED Connections** (with 220Ω resistors):

1. **Green LED**:
   - **GREEN** wire: LED long leg (+) → 220Ω resistor → Arduino Pin 7
   - **BLACK** wire: LED short leg (-) → Arduino GND
2. **Red LED**:
   - **RED** wire: LED long leg (+) → 220Ω resistor → Arduino Pin 8
   - **BLACK** wire: LED short leg (-) → Arduino GND

**Buzzer Connection**: 3. **Piezo Buzzer**:

- **RED** wire: Buzzer positive → Arduino Pin 5
- **BLACK** wire: Buzzer negative → Arduino GND

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
- Connect both modules to shared SPI lines (MOSI, MISO, SCK) and unique SS/RST pins as shown above.
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
