/*
 * RFID Gate Access Control - Backend Integrated Version (NO LCD)
 * Communicates with backend for RFID validation
 * by Manuel Data Jr 💪
 */

#include <SPI.h>
#include <MFRC522.h>

// Pin Definitions
#define RST_PIN         9
#define SS_PIN          10
#define GREEN_LED_PIN   7
#define RED_LED_PIN     8
#define BUZZER_PIN      5

MFRC522 mfrc522(SS_PIN, RST_PIN);

// ==========================
// Function Declarations
// ==========================
void sendBackendData(String event, String cardID = "", String message = "");
void grantAccess(String cardID);
void denyAccess(String cardID);
void returnToReadyState();
void checkSerialCommands();

// ==========================
// Setup
// ==========================
void setup() {
  Serial.begin(9600);
  while (!Serial);

  SPI.begin();
  mfrc522.PCD_Init();

  pinMode(GREEN_LED_PIN, OUTPUT);
  pinMode(RED_LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  // Startup state
  digitalWrite(RED_LED_PIN, HIGH);
  digitalWrite(GREEN_LED_PIN, LOW);

  // Beep startup sound
  tone(BUZZER_PIN, 1000, 200);
  delay(300);
  tone(BUZZER_PIN, 1200, 200);

  Serial.println("=================================");
  Serial.println("🎯 RFID Access Control - Backend Integrated");
  Serial.println("GREEN LED = Access Granted");
  Serial.println("RED LED = Denied / Waiting");
  Serial.println("=================================");
  Serial.println("🔍 Ready to scan cards...");

  sendBackendData("SYSTEM_READY", "", "RFID Access Control Online");
}

// ==========================
// Loop
// ==========================
void loop() {
  checkSerialCommands(); // always listen to backend

  if (!mfrc522.PICC_IsNewCardPresent()) return;
  if (!mfrc522.PICC_ReadCardSerial()) return;

  // Convert UID to String
  String rfidTag = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) rfidTag += "0";
    rfidTag += String(mfrc522.uid.uidByte[i], HEX);
  }
  rfidTag.toUpperCase();

  static String lastCardID = "";
  static unsigned long lastScanTime = 0;
  unsigned long currentTime = millis();

  // Ignore repeated reads of the same card within 3 seconds
  if (rfidTag == lastCardID && (currentTime - lastScanTime < 3000)) {
    return;
  }

  lastCardID = rfidTag;
  lastScanTime = currentTime;

  Serial.println("🔍 Card Scanned: " + rfidTag);

  // Send card scan info to backend (backend will validate in MongoDB)
  sendBackendData("CARD_SCANNED", rfidTag, "Card detected by RFID reader");

  // Halt communication with card
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
}


// ==========================
// Listen for Backend Commands
// ==========================
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
  }
}

// ==========================
// Send Data to Backend
// ==========================
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

// ==========================
// Access Control Feedback
// ==========================
void grantAccess(String cardID) {
  Serial.println("✅ ACCESS GRANTED for " + cardID);
  digitalWrite(GREEN_LED_PIN, HIGH);
  digitalWrite(RED_LED_PIN, LOW);
  
  // Buzzer sequence
  tone(BUZZER_PIN, 1000, 200);
  delay(250);
  tone(BUZZER_PIN, 1200, 200);
  delay(250);
  tone(BUZZER_PIN, 1400, 200);
  
  sendBackendData("ACCESS_GRANTED", cardID, "Access granted by backend");
  delay(4000);
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
  
  sendBackendData("ACCESS_DENIED", cardID, "Access denied by backend");
  delay(3000);
  returnToReadyState();
}

void returnToReadyState() {
  digitalWrite(GREEN_LED_PIN, LOW);
  digitalWrite(RED_LED_PIN, HIGH);
  Serial.println("🔍 Ready for next scan...");
  sendBackendData("GATE_CLOSED", "", "System ready for next scan");
}
