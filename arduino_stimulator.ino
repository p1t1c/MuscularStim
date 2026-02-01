//   STIMULATOR MUSCULAR - CONTROL WEB APP (SERIAL)
//   PROTOCOL DENERVARE - BURST MODE (CALUPURI)

const int pinSemnal = 9;   // Ieșire către driver (OPA541) sau LED de test
const int pinLed = 13;     // LED martor vizual

// Parametri protocol burst (ajustabili prin Web App)
bool stimulareActiva = false;
unsigned long durataImpuls = 200;           // ms - durata unui puls
unsigned long pauzaIntreImpulsuri = 500;    // ms - pauză între pulsuri în calup
unsigned long durataCalup = 8000;           // ms - 8 secunde de pulsuri
unsigned long pauzaIntreCalupuri = 16000;   // ms - 16 secunde pauză între calupuri

// Variabile pentru controlul timpului (Non-blocking)
unsigned long momentAnterior = 0;
unsigned long momentStartCalup = 0;
bool inPuls = false;
bool inCalup = false;

void setup() {
  pinMode(pinSemnal, OUTPUT);
  pinMode(pinLed, OUTPUT);

  // Viteza de comunicare cu Web App
  Serial.begin(9600);

  // Mesaj de confirmare pentru consola Web
  Serial.println("SISTEM_GATA");
  Serial.println("MODE:BURST");
}

void loop() {
  // 1. ASCULTARE COMENZI WEB APP
  if (Serial.available() > 0) {
    String comanda = Serial.readStringUntil('\n');
    comanda.trim();

    if (comanda == "START") {
      stimulareActiva = true;
      inCalup = true;
      momentStartCalup = millis();
      momentAnterior = millis();
      Serial.println("STATUS:ACTIV");
      Serial.println("BURST:START");
    }
    else if (comanda == "STOP") {
      stimulareActiva = false;
      digitalWrite(pinSemnal, LOW);
      digitalWrite(pinLed, LOW);
      inPuls = false;
      inCalup = false;
      Serial.println("STATUS:OPRIT");
    }
    else if (comanda.startsWith("PULS:")) { // Setează durata pulsului (ex: PULS:200)
      durataImpuls = comanda.substring(5).toInt();
      Serial.print("CONFIRM_PULS:");
      Serial.println(durataImpuls);
    }
    else if (comanda.startsWith("WAIT:")) { // Setează pauza între pulsuri (ex: WAIT:500)
      pauzaIntreImpulsuri = comanda.substring(5).toInt();
      Serial.print("CONFIRM_WAIT:");
      Serial.println(pauzaIntreImpulsuri);
    }
    else if (comanda.startsWith("BURST:")) { // Setează durata calupului (ex: BURST:8000)
      durataCalup = comanda.substring(6).toInt();
      Serial.print("CONFIRM_BURST:");
      Serial.println(durataCalup);
    }
    else if (comanda.startsWith("REST:")) { // Setează pauza între calupuri (ex: REST:16000)
      pauzaIntreCalupuri = comanda.substring(5).toInt();
      Serial.print("CONFIRM_REST:");
      Serial.println(pauzaIntreCalupuri);
    }
  }

  // 2. LOGICA DE GENERARE BURST (NON-BLOCKING)
  if (stimulareActiva) {
    unsigned long momentActual = millis();

    if (inCalup) {
      // SUNTEM ÎN CALUP (8 secunde de pulsuri)
      unsigned long timpInCalup = momentActual - momentStartCalup;

      if (timpInCalup >= durataCalup) {
        // Calupul s-a terminat, începe pauza
        digitalWrite(pinSemnal, LOW);
        digitalWrite(pinLed, LOW);
        inCalup = false;
        inPuls = false;
        momentAnterior = momentActual;
        Serial.println("BURST:END");
        Serial.println("REST:START");
      } else {
        // Continuăm cu pulsurile în calup
        if (!inPuls) {
          // Verificăm dacă a trecut timpul de pauză pentru a începe un nou puls
          if (momentActual - momentAnterior >= pauzaIntreImpulsuri) {
            digitalWrite(pinSemnal, HIGH);
            digitalWrite(pinLed, HIGH);
            momentAnterior = momentActual;
            inPuls = true;
          }
        } else {
          // Verificăm dacă a trecut durata pulsului pentru a-l opri
          if (momentActual - momentAnterior >= durataImpuls) {
            digitalWrite(pinSemnal, LOW);
            digitalWrite(pinLed, LOW);
            momentAnterior = momentActual;
            inPuls = false;
          }
        }
      }
    } else {
      // SUNTEM ÎN PAUZĂ ÎNTRE CALUPURI (16 secunde)
      if (momentActual - momentAnterior >= pauzaIntreCalupuri) {
        // Pauza s-a terminat, începe un nou calup
        inCalup = true;
        momentStartCalup = momentActual;
        momentAnterior = momentActual;
        Serial.println("REST:END");
        Serial.println("BURST:START");
      }
    }
  }
}
