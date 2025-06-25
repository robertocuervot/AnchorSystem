#ifndef CONFIG_H
#define CONFIG_H

// MQTT setup
const char* mqtt_server = "hostname.mqtt"; // The hostname of the MQTT broker.
const int mqtt_port = 1883;                    // Default port

const char* mqtt_username = "user";
const char* mqtt_client_id = "ClientID";
const char* mqtt_password = "password";

const char* topic = "your/topic/here";

#endif