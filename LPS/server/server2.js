const mqtt = require("mqtt");
const WebSocket = require("ws");
const mysql = require("mysql");

// --- CONFIGURATION GÉNÉRALE ---
const mqttUrl = "mqtt://digisport.icam.fr:1883";
const mqttTopic = "esp32/position";
const websocketPort = 3000;

const mqttOptions = {
  username: "ocia",
  password: "1c@m2n@nt3s",
  clientId: "JuanitoAlimania"
};

// --- CONFIGURATION MYSQL ---
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "données d'identification", // Remplace si besoin par le vrai nom de ta BDD
  charset: "utf8mb4_general_ci"
});

db.connect(err => {
  if (err) {
    console.error("❌ Erreur connexion MySQL:", err);
    process.exit(1);
  } else {
    console.log("✅ Connexion MySQL OK");
  }
});

// --- SERVEUR WEBSOCKET ---
const wss = new WebSocket.Server({ port: websocketPort }, () => {
  console.log(`✅ WebSocket server listening on ws://localhost:${websocketPort}`);
});

// --- CONNEXION AU BROKER MQTT DISTANT ---
const mqttClient = mqtt.connect(mqttUrl, mqttOptions);

mqttClient.on("connect", () => {
  console.log("✅ Connecté au broker MQTT distant");
  mqttClient.subscribe(mqttTopic, (err) => {
    if (err) {
      console.error("❌ Erreur abonnement topic MQTT:", err);
    } else {
      console.log("📡 Abonné au topic:", mqttTopic);
    }
  });
});

mqttClient.on("error", (err) => {
  console.error("❌ Erreur MQTT:", err);
});

// --- TRAITEMENT DES MESSAGES MQTT ---
mqttClient.on("message", (topic, message) => {
  const payload = message.toString();
  try {
    const data = JSON.parse(payload); // {tag, x, y, z, time}

    // --- ENVOI AUX CLIENTS WEBSOCKET ---
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });

    // --- ENREGISTREMENT EN BASE DE DONNÉES ---
    const sql = "INSERT INTO positions (tag, x, y, z, time) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [data.tag, data.x, data.y, data.z, data.time], (err, res) => {
      if (err) {
        console.error("❌ Erreur insertion BDD:", err);
      } else {
        console.log("✅ Données insérées en BDD:", data);
      }
    });

  } catch (e) {
    console.warn("⚠️ Message non JSON ignoré:", payload);
  }
});