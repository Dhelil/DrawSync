let drawing = false;
let nameAdded = false;
const userName = prompt("Entrez votre nom :"); // Demande le nom de l'utilisateur
const canvas = document.getElementById("drawCanvas");
const ctx = canvas.getContext("2d");
const clearBtn = document.getElementById("clearBtn");
const colorPicker = document.getElementById("colorPicker");
const sizePicker = document.getElementById("sizePicker");

// Ajouter le nom de l'utilisateur à la liste des utilisateurs
const userList = document.getElementById("userList");
const userItem = document.createElement("li");
userItem.textContent = userName;
userList.appendChild(userItem);

// Configuration du canvas
canvas.width = window.innerWidth - 20;
canvas.height = window.innerHeight - 15;

// Connexion au serveur WebSocket
const ws = new WebSocket('ws://localhost:3000');

// Événement déclenché lorsque la connexion WebSocket est établie
ws.onopen = () => {
    console.log('Connecté au serveur WebSocket');
    // Envoie un message au serveur avec le type 'setName' et le nom de l'utilisateur
    ws.send(JSON.stringify({ type: 'setName', name: userName }));
};

// Événement déclenché lorsque le client reçoit un message du serveur
ws.onmessage = (event) => {
    // Analyse le message reçu en tant qu'objet JSON
    const data = JSON.parse(event.data);
    
    // Vérifie le type de message reçu et effectue les actions appropriées
    if (data.type === 'draw') {
        // Appelle la fonction draw avec les coordonnées, la couleur, la taille et l'état de dessin
        draw(data.x, data.y, data.color, data.size, data.isDrawing);
    } else if (data.type === 'clear') {
        // Efface le canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else if (data.type === 'updateUsers') {
        // Met à jour la liste des utilisateurs connectés
        updateUsersList(data.users);
    } else if (data.type === 'loadDrawings') {
        // Charge et dessine les dessins précédents
        data.drawings.forEach(d => draw(d.x, d.y, d.color, d.size, d.isDrawing));
    }
};

// Mettre à jour la liste des utilisateurs
function updateUsersList(users) {
    userList.innerHTML = '';
    users.forEach(user => {
        const userItem = document.createElement("li");
        userItem.textContent = user;
        userList.appendChild(userItem);
    });
}

// Commence à dessiner
canvas.addEventListener("mousedown", (e) => {
    drawing = true;
    nameAdded = false;
    draw(e.offsetX, e.offsetY, colorPicker.value, sizePicker.value, false);
    sendDrawMessage(e.offsetX, e.offsetY, colorPicker.value, sizePicker.value, false);
});

// Dessine
canvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;
    if (!nameAdded) {
        ctx.fillText(userName, e.offsetX, e.offsetY);
        nameAdded = true;
    }
    draw(e.offsetX, e.offsetY, colorPicker.value, sizePicker.value, true);
    sendDrawMessage(e.offsetX, e.offsetY, colorPicker.value, sizePicker.value, true);
});

// Arrête de dessiner
canvas.addEventListener("mouseup", () => {
    drawing = false;
    nameAdded = false;
    ctx.beginPath();
});

// Arrête de dessiner
canvas.addEventListener("mouseleave", () => {
    drawing = false;
    nameAdded = false;
    ctx.beginPath();
});

// Effacer le canevas
clearBtn.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ws.send(JSON.stringify({ type: "clear" }));
});

// Fonction pour dessiner
function draw(x, y, color, size, isDrawing) {
    if (!isDrawing) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = "round";

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

// Fonction pour envoyer les messages de dessin
function sendDrawMessage(x, y, color, size, isDrawing) {
    ws.send(JSON.stringify({
        type: 'draw',
        x: x,
        y: y,
        color: color,
        size: size,
        isDrawing: isDrawing
    }));
}