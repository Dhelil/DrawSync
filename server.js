const WebSocket = require("ws");
const express = require("express");
const http = require("http");
const { v4: uuidv4 } = require("uuid"); // Pour générer des ID uniques

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static("public"));

let users = {}; // Stocker les utilisateurs connectés sous forme { id: { name, ws } }
let drawings = []; // Stocker tous les dessins réalisés

wss.on("connection", (ws) => {
    console.log("Un utilisateur s'est connecté.");

    // Générer un ID unique pour chaque utilisateur
    const userId = uuidv4();
    users[userId] = { name: "Inconnu", ws };

    // Envoyer la liste des utilisateurs + dessins existants au nouvel arrivant
    ws.send(JSON.stringify({ type: "updateUsers", users: Object.values(users).map(u => u.name) }));
    ws.send(JSON.stringify({ type: "loadDrawings", drawings }));

    ws.on("message", (message) => {
        const data = JSON.parse(message);

        if (data.type === "setName") {
            users[userId].name = data.name;
            console.log(`Utilisateur connecté : ${data.name}`);
            broadcastUsers();
        } else if (data.type === "draw") {
            drawings.push(data); // Sauvegarder le dessin
            data.name = users[userId].name;
            broadcast(data);
        } else if (data.type === "clear") {
            drawings = []; // Réinitialiser le canevas
            broadcast(data);
        }
    });

    ws.on("close", () => {
        console.log(`Utilisateur déconnecté : ${users[userId].name}`);
        delete users[userId];
        broadcastUsers();
    });
});

// Fonction pour envoyer la liste des utilisateurs connectés à tous les clients
function broadcastUsers() {
    const userList = Object.values(users).map(u => u.name);
    broadcast({ type: "updateUsers", users: userList });
}

// Fonction pour envoyer un message à tous les clients
function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

server.listen(3000, () => {
    console.log("Serveur WebSocket en écoute sur http://localhost:3000");
});
