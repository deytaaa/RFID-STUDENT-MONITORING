#include <SPI.h>
#include <MFRC522.h>
#include <Servo.h>

// ----------------------------
// Pin Definitions
// ----------------------------
#define RST_PIN_ENTRY    9
#define SS_PIN_ENTRY     10
#define RST_PIN_EXIT     3
#define SS_PIN_EXIT      4

#define GREEN_LED_PIN    7
#define RED_LED_PIN      8
#define BUZZER_PIN       5
#define SERVO_PIN        6

MFRC522 mfrc522_entry(SS_PIN_ENTRY, RST_PIN_ENTRY);
MFRC522 mfrc522_exit(SS_PIN_EXIT, RST_PIN_EXIT);
Servo gateServo;

// ----------------------------
// Timing Variables
// ----------------------------
unsigned long lastScanTime_entry = 0;
unsigned long lastScanTime_exit = 0;
const unsigned long cooldownMs = 3000;

// Non-blocking servo/LED/buzzer timing
bool entryActive = false;
unsigned long entryStartTime = 0;
const unsigned long gateOpenDuration = 5000; // 5 seconds open
const unsigned long buzzerDuration = 200;    // buzzer duration
bool buzzerOn = false;

// Last scanned card
String lastCardID_entry = "";
String lastCardID_exit = "";

// Device serial numbers
#define ENTRY_DEVICE_SERIAL "ARD-GATE-001"
#define EXIT_DEVICE_SERIAL  "TEST-001"

// ----------------------------
// Setup
// ----------------------------
void setup() {
  Serial.begin(9600);
  while (!Serial);

  SPI.begin();
  mfrc522_entry.PCD_Init();
  mfrc522_exit.PCD_Init();

  gateServo.attach(SERVO_PIN);
  gateServo.write(0); // gate closed

  pinMode(GREEN_LED_PIN, OUTPUT);
  pinMode(RED_LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  digitalWrite(GREEN_LED_PIN, LOW);
  digitalWrite(RED_LED_PIN, HIGH);
  digitalWrite(BUZZER_PIN, LOW);

  Serial.println("RFID Access Control Ready (Non-blocking)");
}

// ----------------------------
// Loop
// ----------------------------
void loop() {
  checkSerialCommands();
  unsigned long currentMillis = millis();

  // --- ENTRY READER ---
  if (mfrc522_entry.PICC_IsNewCardPresent() && mfrc522_entry.PICC_ReadCardSerial()) {
    String rfidTag = "";
    for (byte i = 0; i < mfrc522_entry.uid.size; i++) {
      if (mfrc522_entry.uid.uidByte[i] < 0x10) rfidTag += "0";
      rfidTag += String(mfrc522_entry.uid.uidByte[i], HEX);
    }
    rfidTag.toUpperCase();

    // Cooldown check
    if (rfidTag != lastCardID_entry || (currentMillis - lastScanTime_entry >= cooldownMs)) {
      lastCardID_entry = rfidTag;
      lastScanTime_entry = currentMillis;

      Serial.println("[ENTRY] Card Scanned: " + rfidTag);
      sendBackendData("ENTRY_SCANNED", rfidTag, "Entry card detected", ENTRY_DEVICE_SERIAL);
      // Do NOT open gate or activate entry sequence here!
    }

    mfrc522_entry.PICC_HaltA();
    mfrc522_entry.PCD_StopCrypto1();
  }

  // --- EXIT READER ---
  if (mfrc522_exit.PICC_IsNewCardPresent() && mfrc522_exit.PICC_ReadCardSerial()) {
    String rfidTag = "";
    for (byte i = 0; i < mfrc522_exit.uid.size; i++) {
      if (mfrc522_exit.uid.uidByte[i] < 0x10) rfidTag += "0";
      rfidTag += String(mfrc522_exit.uid.uidByte[i], HEX);
    }
    rfidTag.toUpperCase();

    // Cooldown check
    if (rfidTag != lastCardID_exit || (currentMillis - lastScanTime_exit >= cooldownMs)) {
      lastCardID_exit = rfidTag;
      lastScanTime_exit = currentMillis;

      Serial.println("[EXIT] Card Scanned: " + rfidTag);
      sendBackendData("EXIT_SCANNED", rfidTag, "Exit card detected", EXIT_DEVICE_SERIAL);
      // Feedback for exit scan (blink green LED and beep)
      digitalWrite(RED_LED_PIN, LOW);
      digitalWrite(GREEN_LED_PIN, HIGH);
      tone(BUZZER_PIN, 1000, 100);
      delay(100);
      digitalWrite(GREEN_LED_PIN, LOW);
      digitalWrite(RED_LED_PIN, HIGH);
    }

    mfrc522_exit.PICC_HaltA();
    mfrc522_exit.PCD_StopCrypto1();
  }

  // --- ENTRY sequence non-blocking ---
  if (entryActive) {
    // Turn off buzzer after buzzerDuration
    if (buzzerOn && (currentMillis - entryStartTime >= buzzerDuration)) {
      digitalWrite(BUZZER_PIN, LOW);
      buzzerOn = false;
    }

    // Close gate and reset LEDs after gateOpenDuration
    if (currentMillis - entryStartTime >= gateOpenDuration) {
      gateServo.write(0);          // Close gate
      digitalWrite(GREEN_LED_PIN, LOW);
      digitalWrite(RED_LED_PIN, HIGH);
      entryActive = false;
      Serial.println("[ENTRY] Gate closed, ready for next scan");
      sendBackendData("GATE_CLOSED", lastCardID_entry, "Gate closed after entry", ENTRY_DEVICE_SERIAL);
    }
  }
}

// ----------------------------
// Send JSON-like data to backend
// ----------------------------
void sendBackendData(String event, String cardID, String message, String deviceSerial) {
  Serial.print("BACKEND_DATA:{\"event\":\"");
  Serial.print(event);
  Serial.print("\",\"timestamp\":\"");
  Serial.print(millis());
  Serial.print("\"");

  if (cardID != "") {
    Serial.print(",\"cardID\":\"");
    Serial.print(cardID);
    Serial.print("\"");
  }
  if (message != "") {
    Serial.print(",\"message\":\"");
    Serial.print(message);
    Serial.print("\"");
  }
  if (deviceSerial != "") {
    Serial.print(",\"deviceSerial\":\"");
    Serial.print(deviceSerial);
    Serial.print("\"");
  }
  Serial.println("}");
}

// ----------------------------
// Backend Command Listener
// ----------------------------
void checkSerialCommands() {
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    if (command == "OPEN_GATE") {
      // Start entry sequence only when backend grants access
      entryActive = true;
      entryStartTime = millis();
      buzzerOn = true;
      gateServo.write(90); // Open gate
      digitalWrite(GREEN_LED_PIN, HIGH);
      digitalWrite(RED_LED_PIN, LOW);
      digitalWrite(BUZZER_PIN, HIGH);
      Serial.println("[REMOTE] Gate OPENED by backend");
      sendBackendData("GATE_OPEN", lastCardID_entry, "Gate opened by backend command", ENTRY_DEVICE_SERIAL);
    } else if (command == "CLOSE_GATE") {
      gateServo.write(0); // Close gate
      Serial.println("[REMOTE] Gate CLOSED by backend");
      sendBackendData("GATE_CLOSED", "", "Gate closed by backend command", ENTRY_DEVICE_SERIAL);
    } else if (command.startsWith("ACCESS_GRANTED:")) {
      // Parse card ID (and optionally pin) from command
      int firstColon = command.indexOf(':');
      int secondColon = command.indexOf(':', firstColon + 1);
      String cardID = (secondColon > 0) ? command.substring(firstColon + 1, secondColon) : command.substring(firstColon + 1);
      entryActive = true;
      entryStartTime = millis();
      buzzerOn = true;
      gateServo.write(90); // Open gate
      digitalWrite(GREEN_LED_PIN, HIGH);
      digitalWrite(RED_LED_PIN, LOW);
      digitalWrite(BUZZER_PIN, HIGH);
      Serial.println("[REMOTE] Gate OPENED by backend (ACCESS_GRANTED)");
      sendBackendData("GATE_OPEN", cardID, "Gate opened by backend ACCESS_GRANTED", ENTRY_DEVICE_SERIAL);
    } else if (command.startsWith("ACCESS_DENIED:")) {
      // Feedback for denied access: red LED and buzzer
      int firstColon = command.indexOf(':');
      int secondColon = command.indexOf(':', firstColon + 1);
      String cardID = (secondColon > 0) ? command.substring(firstColon + 1, secondColon) : command.substring(firstColon + 1);
      digitalWrite(GREEN_LED_PIN, LOW);
      digitalWrite(RED_LED_PIN, HIGH);
      // Buzzer pattern for denied
      tone(BUZZER_PIN, 400, 200);
      delay(200);
      tone(BUZZER_PIN, 300, 200);
      delay(200);
      tone(BUZZER_PIN, 200, 400);
      delay(400);
      digitalWrite(BUZZER_PIN, LOW);
      Serial.println("[REMOTE] ACCESS DENIED by backend");
      sendBackendData("ACCESS_DENIED", cardID, "Access denied by backend", ENTRY_DEVICE_SERIAL);
    }
  }
}
