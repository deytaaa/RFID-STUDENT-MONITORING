/*
 * RFID Gate Access Control with Servo Motor (SG90)
 * by Manuel Data Jr 💪
 */

#include <SPI.h>
#include <MFRC522.h>
#include <Servo.h> // ✅ Added for SG90 servo

// Pin Definitions
#define RST_PIN         9
#define SS_PIN          10
#define GREEN_LED_PIN   7
#define RED_LED_PIN     8
#define BUZZER_PIN      5
#define SERVO_PIN       6   // ✅ Connect SG90 signal pin here

MFRC522 mfrc522(SS_PIN, RST_PIN);
Servo gateServo; // ✅ Servo object

// ----------------------------
// Variables
// ----------------------------
String lastCardID = "";
unsigned long lastScanTime = 0;
const unsigned long cooldownMs = 3000; // 3 seconds

// ----------------------------
// Setup
// ----------------------------
void setup() {
  Serial.begin(9600);
  while (!Serial);

  SPI.begin();
  mfrc522.PCD_Init();

  gateServo.attach(SERVO_PIN); // ✅ Initialize SG90
  gateServo.write(0);          // ✅ Start in closed position (0°)

  pinMode(GREEN_LED_PIN, OUTPUT);
  pinMode(RED_LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  digitalWrite(RED_LED_PIN, HIGH);
  digitalWrite(GREEN_LED_PIN, LOW);

  tone(BUZZER_PIN, 1000, 200);
  delay(300);
  tone(BUZZER_PIN, 1200, 200);

  Serial.println("=================================");
  Serial.println("🎯 RFID Access Control + Servo Motor");
  Serial.println("GREEN LED = Access Granted");
  Serial.println("RED LED = Denied / Waiting");
  Serial.println("=================================");
  Serial.println("🔍 Ready to scan cards...");

  sendBackendData("SYSTEM_READY", "", "RFID Access Control Online");
}

// ----------------------------
// Loop
// ----------------------------
void loop() {
  checkSerialCommands();

  if (!mfrc522.PICC_IsNewCardPresent()) return;
  if (!mfrc522.PICC_ReadCardSerial()) return;

  // Convert UID to String
  String rfidTag = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) rfidTag += "0";
    rfidTag += String(mfrc522.uid.uidByte[i], HEX);
  }
  rfidTag.toUpperCase();

  unsigned long currentTime = millis();

  // Ignore repeated reads
  if (rfidTag == lastCardID && (currentTime - lastScanTime < cooldownMs)) {
    return;
  }

  lastCardID = rfidTag;
  lastScanTime = currentTime;

  Serial.println("🔍 Card Scanned: " + rfidTag);

  // Send scan info to backend
  sendBackendData("CARD_SCANNED", rfidTag, "Card detected by RFID reader");

  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
}

// ----------------------------
// Listen for backend commands
// ----------------------------
void checkSerialCommands() {
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();

    if (command.startsWith("ACCESS_GRANTED:")) {
      String cardID = command.substring(15);
      grantAccess(cardID);
    } 
    else if (command.startsWith("ACCESS_DENIED:")) {
      String cardID = command.substring(14);
      denyAccess(cardID);
    }
    // --- NEW: Direct gate control from backend ---
    else if (command == "OPEN_GATE") {
      gateServo.write(90); // Open position
      Serial.println("🚪 Gate OPENED (manual command)");
      sendBackendData("GATE_OPEN", "", "Servo gate opened by backend");
    }
    else if (command == "CLOSE_GATE") {
      gateServo.write(0); // Closed position
      Serial.println("🚪 Gate CLOSED (manual command)");
      sendBackendData("GATE_CLOSED", "", "Servo gate closed by backend");
    }
  }
}

// ----------------------------
// Send JSON data to backend
// ----------------------------
void sendBackendData(String event, String cardID, String message) {
  Serial.print("BACKEND_DATA:");
  Serial.print("{\"event\":\"");
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

  Serial.println("}");
}

// ----------------------------
// Access Control Feedback
// ----------------------------
void grantAccess(String cardID) {
  Serial.println("✅ ACCESS GRANTED for " + cardID);
  digitalWrite(GREEN_LED_PIN, HIGH);
  digitalWrite(RED_LED_PIN, LOW);

  tone(BUZZER_PIN, 1000, 200);
  delay(250);
  tone(BUZZER_PIN, 1200, 200);
  delay(250);
  tone(BUZZER_PIN, 1400, 200);

  // ✅ Open gate (servo moves)
  gateServo.write(90); // Open position (adjust angle if needed)
  Serial.println("🚪 Gate OPENED");
  sendBackendData("GATE_OPEN", cardID, "Servo gate opened");

  // Wait for 10 seconds before closing
  delay(10000);

  // ✅ Close gate
  gateServo.write(0);
  Serial.println("🚪 Gate CLOSED");
  sendBackendData("GATE_CLOSED", cardID, "Servo gate closed after 10s");

  sendBackendData("ACCESS_GRANTED", cardID, "Access granted by backend");
  delay(1000);
  returnToReadyState();
}

void denyAccess(String cardID) {
  Serial.println("❌ ACCESS DENIED for " + cardID);
  digitalWrite(RED_LED_PIN, HIGH);
  digitalWrite(GREEN_LED_PIN, LOW);

  tone(BUZZER_PIN, 400, 300);
  delay(200);
  tone(BUZZER_PIN, 300, 300);
  delay(200);
  tone(BUZZER_PIN, 200, 500);

  // ❌ Do not move the servo here
  Serial.println("🚫 Gate remains CLOSED");
  sendBackendData("ACCESS_DENIED", cardID, "Access denied - gate not opened");
  delay(3000);
  returnToReadyState();
}

void returnToReadyState() {
  digitalWrite(GREEN_LED_PIN, LOW);
  digitalWrite(RED_LED_PIN, HIGH);
  Serial.println("🔍 Ready for next scan...");
  sendBackendData("SYSTEM_READY", "", "System ready for next scan");
}
