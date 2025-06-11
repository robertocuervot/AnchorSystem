// config.h
#ifndef CONFIG_H
#define CONFIG_H

// MQTT setup
const char* mqtt_server = "digisport.icam.fr"; // The hostname of the MQTT broker.
const int mqtt_port = 1883;                    // Default port

const char* mqtt_username = "ocia";
const char* mqtt_client_id = "JuanitoAlimania";
const char* mqtt_password = "1c@m2n@nt3s";

const char* topic = "proyect/uwb/status";


#endif