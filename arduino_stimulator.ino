//   STIMULATOR MUSCULAR - CONTROL WEB APP (SERIAL)
//   PROTOCOL DENERVARE - FĂRĂ RAMPĂ

const int pinSemnal = 9;   // Ieșire către driver (OPA541)
const int pinLed = 13;     // Martor vizual

// Parametri ajustabili prin Web App
bool stimulareActiva = false;
unsigned long durataImpuls = 50;       // ms
unsigned long pauzaIntreImpulsuri = 1500; // ms

// Variabile pentru controlul timpului (Non-blocking)
unsigned long momentAnterior = 0;
bool inPuls = false;

void setup() {
  pinMode(pinSemnal, OUTPUT);
  pinMode(pinLed, OUTPUT);

  // Viteza de comunicare cu Web App
  Serial.begin(9600);

  // Mesaj de confirmare pentru consola Web
  Serial.println("SISTEM_GATA");
}

void loop() {
  // 1. ASCULTARE COMENZI WEB APP
  if (Serial.available() > 0) {
    String comanda = Serial.readStringUntil('\n');
    comanda.trim();

    if (comanda == "START") {
      stimulareActiva = true;
      Serial.println("STATUS:ACTIV");
    }
    else if (comanda == "STOP") {
      stimulareActiva = false;
      digitalWrite(pinSemnal, LOW);
      digitalWrite(pinLed, LOW);
      inPuls = false;
      Serial.println("STATUS:OPRIT");
    }
    else if (comanda.startsWith("DUR:")) { // Setează durata (ex: DUR:60)
      durataImpuls = comanda.substring(4).toInt();
      Serial.print("CONFIRM_DUR:");
      Serial.println(durataImpuls);
    }
    else if (comanda.startsWith("PAUZA:")) { // Setează pauza (ex: PAUZA:2000)
      pauzaIntreImpulsuri = comanda.substring(6).toInt();
      Serial.print("CONFIRM_PAUZA:");
      Serial.println(pauzaIntreImpulsuri);
    }
  }

  // 2. LOGICA DE GENERARE IMPULS (NON-BLOCKING)
  if (stimulareActiva) {
    unsigned long momentActual = millis();

    if (!inPuls) {
      // Verificăm dacă a trecut timpul de pauză pentru a începe un nou impuls
      if (momentActual - momentAnterior >= pauzaIntreImpulsuri) {
        digitalWrite(pinSemnal, HIGH);
        digitalWrite(pinLed, HIGH);
        momentAnterior = momentActual;
        inPuls = true;
      }
    } else {
      // Verificăm dacă a trecut durata impulsului (50ms) pentru a-l opri
      if (momentActual - momentAnterior >= durataImpuls) {
        digitalWrite(pinSemnal, LOW);
        digitalWrite(pinLed, LOW);
        momentAnterior = momentActual;
        inPuls = false;
      }
    }
  }
}
