import paho.mqtt.client as mqtt
import json
import time
import random

# === MQTT Config ===
broker_ip = "127.0.0.1"
broker_port = 1883
topic = "esp32/position"

# === Terrain
WIDTH = 18
HEIGHT = 9

# === Configuration des tags
NUM_TAGS = 4
tags = []

for i in range(NUM_TAGS):
    tags.append({
        "id": f"tag{i+1}",
        "x": random.uniform(1, WIDTH - 1),
        "y": random.uniform(1, HEIGHT - 1),
        "z": round(random.uniform(0.5, 2.8), 2),  # Z fixe par tag
        "vx": random.uniform(0.15, 0.35),
        "vy": random.uniform(0.15, 0.35),
    })

# === MQTT Client
client = mqtt.Client()
client.connect(broker_ip, broker_port, 60)

try:
    while True:
        for tag in tags:
            # Mise à jour de la position
            tag["x"] += tag["vx"]
            tag["y"] += tag["vy"]

            # Rebonds sur les bords
            if tag["x"] <= 0 or tag["x"] >= WIDTH:
                tag["vx"] *= -1
            if tag["y"] <= 0 or tag["y"] >= HEIGHT:
                tag["vy"] *= -1

            # Construction du message
            message = {
                "tag": tag["id"],
                "x": round(tag["x"], 2),
                "y": round(tag["y"], 2),
                "z": tag["z"],  # constante
                "time": time.strftime("%H:%M:%S")
            }

            client.publish(topic, json.dumps(message))
            print("📤", message)

        time.sleep(0.5)

except KeyboardInterrupt:
    print("🛑 Simulation arrêtée.")
    client.disconnect()
