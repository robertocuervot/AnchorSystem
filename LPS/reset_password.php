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

$data = json_decode(file_get_contents('php://input'), true);
if (!$data || !isset($data['email'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Données manquantes"]);
    exit;
}

$email = trim($data['email']);

$stmt = $conn->prepare("SELECT ID, Username FROM users WHERE Email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    // Générer un mot de passe temporaire
    $newPassword = bin2hex(random_bytes(4));
    // Mettre à jour dans la base
    $update = $conn->prepare("UPDATE users SET Password = ? WHERE Email = ?");
    $update->bind_param("ss", $newPassword, $email);
    $update->execute();

    // Envoyer l'email (adapter l'adresse d'envoi !)
    $to = $email;
    $subject = "Réinitialisation de votre mot de passe Neptune Nantes";
    $message = "Bonjour,\n\nVotre nouveau mot de passe provisoire est : $newPassword\n\nConnectez-vous puis modifiez-le depuis votre espace personnel.\n\nCeci est un message automatique.";
    $headers = "From: mbuyidanie390@gmail.com\r\nReply-To: mbuyidanie390@gmail.com";

    if (mail($to, $subject, $message, $headers)) {
        // On retourne aussi le mot de passe temporaire pour affichage JS
        echo json_encode(["success"=>true, "message"=>"Mail envoyé !", "newPassword"=>$newPassword]);
    } else {
        http_response_code(500);
        echo json_encode(["success"=>false, "message"=>"Erreur lors de l'envoi du mail."]);
    }
} else {
    http_response_code(404);
    echo json_encode(["success"=>false, "message"=>"Email inconnu"]);
}
?>