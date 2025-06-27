<?php
// Ce script retourne la liste des tags au format JSON
header('Content-Type: application/json');
$conn = new mysqli("localhost", "root", "", "données d'identification");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([]);
    exit;
}
// On suppose une table 'tags' avec id et nom
$result = $conn->query("SELECT id, nom FROM tags ORDER BY nom");
$tags = [];
while ($row = $result->fetch_assoc()) {
    $tags[] = $row;
}
echo json_encode($tags);
?>