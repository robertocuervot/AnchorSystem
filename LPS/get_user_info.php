<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

$conn = new mysqli("127.0.0.1", "root", "", "données d'identification");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Erreur connexion BDD"]);
    exit;
}

// On suppose que tu as stocké l'email de l'utilisateur connecté en session
session_start();
if (!isset($_SESSION['user_email'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Non authentifié"]);
    exit;
}

$email = $_SESSION['user_email'];

$stmt = $conn->prepare("SELECT Username, Email FROM users WHERE Email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();
$stmt->bind_result($username, $emailResult);

if ($stmt->num_rows > 0 && $stmt->fetch()) {
    echo json_encode([
        "success" => true,
        "username" => $username,
        "email" => $emailResult
    ]);
} else {
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "Utilisateur non trouvé"]);
}
?>