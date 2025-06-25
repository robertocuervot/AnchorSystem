#include <SPI.h>
#include "DW1000Ranging.h"
 
#define MOSI 13
#define MISO 12
#define SCK 4
#define CS 32

#define RST 14
#define IRQ 2

#define TAG_ADD "45:8C:3F:12:3A:7B:4D:2F" // tag address
 
void setup()
{
    Serial.begin(115200);
    delay(1000);
    //init the configuration
    Serial.println("Setting UWB module as tag...");
    // SPI.begin(SCK, MISO, MOSI, CS); //SPI configuration
    SPI.begin(SCK, MISO, MOSI); //SPI configuration

    DW1000Ranging.initCommunication(RST, CS, IRQ); //Reset, CS, IRQ pin
    
    DW1000Ranging.attachNewRange(newRange);
    DW1000Ranging.attachNewDevice(newDevice);
    DW1000Ranging.attachInactiveDevice(inactiveDevice);
 
    //we start the module as a tag, don't assign random short address
    DW1000Ranging.startAsTag(TAG_ADD, DW1000.MODE_LONGDATA_RANGE_ACCURACY, false); // Use the same mode that the anchor
}
 
void loop()
{
    DW1000Ranging.loop();
}
 
void newRange()
{
    Serial.print("from: ");
    Serial.print(DW1000Ranging.getDistantDevice()->getShortAddress(), HEX);
    Serial.print("\t Range: ");
    Serial.print(DW1000Ranging.getDistantDevice()->getRange());
    Serial.print(" m");
    Serial.print("\t RX power: ");
    Serial.print(DW1000Ranging.getDistantDevice()->getRXPower());
    Serial.println(" dBm");
}
 
void newDevice(DW1000Device *device)
{
    Serial.print("ranging init; 1 device added ! -> ");
    Serial.print(" short:");
    Serial.println(device->getShortAddress(), HEX);
}
 
void inactiveDevice(DW1000Device *device)
{
    Serial.print("delete inactive device: ");
    Serial.println(device->getShortAddress(), HEX);
}