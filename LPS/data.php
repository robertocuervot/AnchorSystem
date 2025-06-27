<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

$host = "localhost";
$db = "données d'identification";
$user = "root";
$pass = "";

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Erreur connexion BDD"]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['identifier']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Données manquantes"]);
    exit;
}

$identifier = trim($data['identifier']);
$motDePasseEntre = trim($data['password']);

// Récupération de l'utilisateur (par email ou username)
$stmt = $conn->prepare("SELECT ID, Username, Email, Password FROM users WHERE Email = ? OR Username = ?");
$stmt->bind_param("ss", $identifier, $identifier);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if($user && password_verify($motDePasseEntre, $user['Password'])) {
    // Connexion OK
    echo json_encode(["success"=>true, "username" => $user['Username']]);
} else {
    // Identifiants incorrects
    http_response_code(401);
    echo json_encode(["success"=>false, "message"=>"Identifiants incorrects"]);
}
?>