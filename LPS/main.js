// --- SCENE & CAMERA ---
var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(18, 12, 18);
camera.lookAt(0, 0, 0);

// --- RENDERER ---
var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setClearColor(0xffffff, 1);
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("scene-container").appendChild(renderer.domElement);

// --- CONTROLS (optionnel) ---
var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.update();

// --- BORDURE BLEU FONCÉ 21x12 ---
var terrainBord = new THREE.Mesh(
  new THREE.BoxGeometry(21, 0.3, 12),
  new THREE.MeshPhongMaterial({ color: 0x003366 }) // bleu foncé
);
terrainBord.position.y = 0.13; // posée un peu plus bas
scene.add(terrainBord);

// --- TERRAIN PRINCIPAL 18x9 AVEC IMAGE SUR LE DESSUS ---
var loader = new THREE.TextureLoader();
loader.load('terrain_volley.jpg', function(texture) {
    var materials = [
        new THREE.MeshPhongMaterial({ color: 0x003366 }), // right
        new THREE.MeshPhongMaterial({ color: 0x003366 }), // left
        new THREE.MeshPhongMaterial({ map: texture }),    // top (face supérieure)
        new THREE.MeshPhongMaterial({ color: 0x003366 }), // bottom
        new THREE.MeshPhongMaterial({ color: 0x003366 }), // front
        new THREE.MeshPhongMaterial({ color: 0x003366 })  // back
    ];
    var terrain = new THREE.Mesh(
        new THREE.BoxGeometry(18, 0.10, 9),
        new THREE.MeshFaceMaterial(materials)
    );
    terrain.position.y = 0.31/2 + 0.3/2 + 0.01; // posé juste au-dessus du cadre bleu
    scene.add(terrain);

    // --- FILET DE VOLLEY ---
    // Paramètres
    var hauteurFilet = 2.43;
    var hauteurPoteau = 2.6;
    var xFilet = 0; // centre du terrain
    var zDebut = -9/2;
    var zFin = 9/2;
    var epaisseurLigne = 0.025;
    var rayonPoteau = 0.07;
    var nbLignes = 7;
    var nbColonnes = 12;
    var yBaseFilet = terrain.position.y + 0.16; // base filet posée juste au-dessus du terrain image

    // Poteaux
    var matPoteau = new THREE.MeshBasicMaterial({ color: 0x111111 });
    var geoPoteau = new THREE.CylinderGeometry(rayonPoteau, rayonPoteau, hauteurPoteau, 16);

    // Poteau gauche
    var poteauG = new THREE.Mesh(geoPoteau, matPoteau);
    poteauG.position.set(xFilet, yBaseFilet + hauteurPoteau/2, zDebut);
    scene.add(poteauG);

    // Poteau droit
    var poteauD = new THREE.Mesh(geoPoteau, matPoteau);
    poteauD.position.set(xFilet, yBaseFilet + hauteurPoteau/2, zFin);
    scene.add(poteauD);

    // Filet - lignes horizontales (laisse un espace en bas)
    for (var i = 2; i <= nbLignes; i++) {
        var y = yBaseFilet + i * (hauteurFilet / nbLignes);
        var geom = new THREE.BoxGeometry(epaisseurLigne, epaisseurLigne, 9);
        var mesh = new THREE.Mesh(geom, matPoteau);
        mesh.position.set(xFilet, y, 0);
        scene.add(mesh);
    }

    // Calcule l'espace en bas (identique à ce qui est retiré pour les horizontales)
    var espaceEnBas = 2 * (hauteurFilet / nbLignes);

    // Filet - lignes verticales (elles commencent au-dessus de l'espace du bas)
    for (var j = 0; j <= nbColonnes; j++) {
        var z = zDebut + j * (9 / nbColonnes);
        var geom = new THREE.BoxGeometry(
            epaisseurLigne,
            hauteurFilet - espaceEnBas,
            epaisseurLigne
        );
        var mesh = new THREE.Mesh(geom, matPoteau);
        mesh.position.set(
            xFilet,
            yBaseFilet + espaceEnBas + (hauteurFilet - espaceEnBas) / 2,
            z
        );
        scene.add(mesh);
    }
    // --- FIN FILET ---
});

// --- LUMIÈRES ---
scene.add(new THREE.AmbientLight(0xffffff, 0.8));
var dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);


// --- GESTION DES TAGS AVEC TRIANGLE ROUGE ET TEXTE ---
let font3d = null;
let tagQueue = [];
let fontLoaded = false;

const fontLoader = new THREE.FontLoader();
fontLoader.load('fonts/helvetiker_regular.typeface.json', function (font) {
  console.log("Police chargée !");
  font3d = font;
  fontLoaded = true;
  // Traite tous les tags reçus pendant le chargement de la police
  tagQueue.forEach(data => createOrUpdateTag(data));
  tagQueue = [];
});

const tagMap = {};

const socket = new WebSocket("ws://localhost:3000");
socket.onopen = () => console.log("✅ WebSocket connecté");
socket.onerror = err => console.error("❌ Erreur WebSocket", err);

socket.onmessage = event => {
  try {
    const data = JSON.parse(event.data);
    // Log pour débogage
    console.log("Réception WebSocket :", data);

    if (!fontLoaded) {
      tagQueue.push(data);
      console.log("Police pas chargée, tag mis en attente.");
      return;
    }
    createOrUpdateTag(data);
  } catch (e) {
    console.error("Erreur parsing JSON", e);
  }
};

function createOrUpdateTag(data) {
  let tag = tagMap[data.tag];
  if (!tag) {
    tag = new THREE.Group();

    // Triangle rouge pointe vers le bas
    const geom = new THREE.ConeGeometry(0.18, 0.3, 16);
    const mat = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    const triangle = new THREE.Mesh(geom, mat);
    triangle.rotation.x = Math.PI;
    triangle.position.set(0, 0.15, 0);
    tag.add(triangle);

    // Création du texte sous le triangle
    const textGeom = new THREE.TextGeometry(data.tag, {
      font: font3d,
      size: 0.18,
      height: 0.04,
    });
    const textMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const textMesh = new THREE.Mesh(textGeom, textMat);
    textGeom.computeBoundingBox();
    const textWidth = textGeom.boundingBox.max.x - textGeom.boundingBox.min.x;
    textMesh.position.set(-textWidth/2, -0.15, 0); // centré sous le triangle
    tag.add(textMesh);

    tag.name = data.tag;
    scene.add(tag);
    tagMap[data.tag] = tag;
    console.log("Tag ajouté à la scène :", data.tag);
  }

  // Transformation coordonnées (corrigé !)
  const terrainWidth = 18;
  const terrainHeight = 9;
  const xThree = data.x - terrainWidth / 2;
  const zThree = data.y - terrainHeight / 2;
  tag.position.set(xThree, data.z + 0.01, zThree);

  // Affiche l'heure de la dernière mise à jour (prévois un élément HTML avec id="timestamp")
  const ts = document.getElementById("timestamp");
  if (ts) ts.textContent = "Dernière mise à jour : " + data.time;
}

// --- RESPONSIVE ---
window.addEventListener('resize', function() {
  var width = window.innerWidth;
  var height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});

// --- ANIMATION ---
function animate() {
  requestAnimationFrame(animate);
  for (const tagId in tagMap) {
  const tag = tagMap[tagId];
  // On suppose que le texte est le 2e enfant du groupe (le triangle est en premier)
  const textMesh = tag.children[1];
  if (textMesh) {
    textMesh.lookAt(camera.position);
  }
}
  renderer.render(scene, camera);
}
animate();