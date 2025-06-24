// Ethernet and MQTT dependencies
#include <ETH.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include "Config.h"

// MAX2001 dependencies
#include <SPI.h>
#include "DW1000Ranging.h"

// For the timestamp
#include <time.h>

// Ethernet configuration
#define ETH_CLK_MODE ETH_CLOCK_GPIO17_OUT // Clock mode for LAN8710A
#define ETH_POWER_PIN -1 // Power pin not used
#define ETH_TYPE ETH_PHY_LAN8720 // PHY type
#define ETH_ADDR 0 // PHY I2C address
#define ETH_MDC_PIN 23 // MDC pin (not used in Olimex, but defined)
#define ETH_MDIO_PIN 18 // MDIO pin (not used in Olimex, but defined)

bool ethernet_connected = false; // To verify ethernet connection

WiFiClient espClient; // WiFi object (Ethernet compatible)
PubSubClient client(espClient); // MQTT object

// MAX2001 connection pins
#define MOSI 13
#define MISO 12
#define SCK 4
#define CS 32

#define RST 14
#define IRQ 2

#define ANCHOR_ADD "83:17:5B:D5:A9:9A:E2:9C" // Anchor address

// Variables for ranging info
uint16_t tagShortAddr = 0;
float distance = 0.0;
long timestamp = 0;

////////////////////////////////// FUNCTIONS ////////////////////////////////////

// Ethernet event handler
void EthEvent(WiFiEvent_t event) {
  switch (event) {
    case ARDUINO_EVENT_ETH_START:
      Serial.println("Ethernet started");
      ETH.setHostname("ESP32-Gateway");
      break;
    case ARDUINO_EVENT_ETH_CONNECTED:
      Serial.println("Ethernet connected");
      break;
    case ARDUINO_EVENT_ETH_GOT_IP:
      Serial.print("Ethernet IP assigned: ");
      Serial.println(ETH.localIP());
      Serial.print("Ethernet MAC: ");
      Serial.println(ETH.macAddress());
      ethernet_connected = true;
      break;
    case ARDUINO_EVENT_ETH_DISCONNECTED:
      Serial.println("Ethernet disconnected");
      ethernet_connected = false;
      break;
    case ARDUINO_EVENT_ETH_STOP:
      Serial.println("Ethernet stopped");
      ethernet_connected = false;
      break;
    default:
      break;
  }
}

// Function to connect to MQTT broker
void connectMQTT() {
  Serial.print("Connecting to MQTT broker");
  while (!client.connected()) {
    Serial.print(".");
    if (client.connect(mqtt_client_id, mqtt_username, mqtt_password)) {
      Serial.println("\nConnected to MQTT broker");
    } else {
      Serial.print("\nFailed with state ");
      Serial.println(client.state());
      delay(1000);
    }
  }
}

void newRange() { // Callback: new distance measure
  // Get tag data
  uint16_t tagShortAddr = DW1000Ranging.getDistantDevice()->getShortAddress();
  float distance = DW1000Ranging.getDistantDevice()->getRange();

  // To get timestamp
  time_t now;
  struct tm timeinfo;
  time(&now);
  localtime_r(&now, &timeinfo);

  char timeString[25];
  strftime(timeString, sizeof(timeString), "%Y-%m-%dT%H:%M:%S", &timeinfo);

  // Format this data in JSON
  String payload = "{";
  payload += "\"timestamp\":" + String(timeString) + ",";
  payload += "\"tag_id\":\"" + String(tagShortAddr, HEX) + "\",";
  payload += "\"distance\":" + String(distance, 2);
  payload += "}";

  // Publish to MQTT broker
  if (client.publish(topic, payload.c_str())) {
    Serial.println("Data published successfully: " + payload);
  } else {
    Serial.println("Failed to publish data");
  }
}

void newBlink(DW1000Device* device) { // Callback: new tag detected
  Serial.print("blink; 1 device added ! -> ");
  Serial.print(" short:");
  Serial.println(device->getShortAddress(), HEX);
}

void inactiveDevice(DW1000Device* device) { // Callback: inactive device
  Serial.print("delete inactive device: ");
  Serial.println(device->getShortAddress(), HEX);
}

//////////////////////////////////// SETUP ///////////////////////////////////

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("Starting Ethernet...");
  WiFi.onEvent(EthEvent); // Register Ethernet event handler

  // Start Ethernet
  ETH.begin(ETH_TYPE, ETH_ADDR, ETH_MDC_PIN, ETH_MDIO_PIN, ETH_POWER_PIN, ETH_CLK_MODE);

  // Time configuration
  configTime(0, 0, "pool.ntp.org"); // UTC timezone

  // Initialize MQTT client
  client.setServer(mqtt_server, 1883);
  connectMQTT(); // Conect to broker

  // Initialize SPI communincation and MAX2001 config
  Serial.println("Starting SPI communication with MAX2001...");
  SPI.begin(SCK, MISO, MOSI, CS); //SPI configuration
  // SPI.begin(SCK, MISO, MOSI); //SPI configuration

  DW1000Ranging.initCommunication(RST, CS, IRQ); //Reset, CS, IRQ pin

  // Define the callbacks
  DW1000Ranging.attachNewRange(newRange);
  DW1000Ranging.attachBlinkDevice(newBlink);
  DW1000Ranging.attachInactiveDevice(inactiveDevice);
  //Enable the filter to smooth the distance
  //DW1000Ranging.useRangeFilter(true);

  //Start the module as an anchor
  DW1000Ranging.startAsAnchor(ANCHOR_ADD, DW1000.MODE_LONGDATA_RANGE_ACCURACY); // Most robust option
  // DW1000Ranging.startAsAnchor(ANCHOR_ADD, DW1000.MODE_LONGDATA_FAST_ACCURACY); // Faster option, tests required

}

void loop() {
  client.loop(); // MQTT loop
  DW1000Ranging.loop(); // UWB module loop

  if (ethernet_connected) {
    Serial.print("IP: ");
    Serial.println(ETH.localIP());
  }

  // Ensure MQTT connection is alive
  if (!client.connected()) {
    Serial.print("MQTT connection lost.");
    connectMQTT();
  }
}