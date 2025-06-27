<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

$conn = new mysqli("localhost", "root", "", "données d'identification");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success"=>false, "message"=>"Connexion BDD échouée"]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if(!$data || !isset($data['username'], $data['email'], $data['password'])){
    http_response_code(400);
    echo json_encode(["success"=>false, "message"=>"Données manquantes"]);
    exit;
}

$username = trim($data['username']);
$email = trim($data['email']);
$password = $data['password'];

// Vérifier si l'utilisateur existe déjà
$stmt = $conn->prepare("SELECT ID FROM users WHERE Email = ? OR Username = ?");
$stmt->bind_param("ss", $email, $username);
$stmt->execute();
$stmt->store_result();
if($stmt->num_rows > 0){
    echo json_encode(["success"=>false, "message"=>"Utilisateur ou email déjà utilisé."]);
    exit;
}

// Hasher le mot de passe
$hashedPassword = password_hash($password, PASSWORD_BCRYPT);

$stmt = $conn->prepare("INSERT INTO users (Username, Email, Password) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $username, $email, $hashedPassword);
if($stmt->execute()){
    echo json_encode(["success"=>true]);
} else {
    http_response_code(500);
    echo json_encode(["success"=>false, "message"=>"Erreur lors de l'inscription."]);
}
?>