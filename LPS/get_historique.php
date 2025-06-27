<?php
// Ce script retourne l'historique des positions, filtré optionnellement par tag et date
header('Content-Type: application/json');
$conn = new mysqli("localhost", "root", "", "données d'identification");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([]);
    exit;
}

$tag = isset($_GET['tag']) ? $_GET['tag'] : null;
$date = isset($_GET['date']) ? $_GET['date'] : null;

$query = "SELECT p.created_at, t.nom AS tag_name, p.x, p.y, p.z
          FROM positions p
          JOIN tags t ON p.tag = t.nom
          WHERE 1";
$params = [];
$types = "";

if ($tag) {
    $query .= " AND p.tag = ?";
    $types .= "s";
    $params[] = $tag;
}
if ($date) {
    $query .= " AND DATE(p.created_at) = ?";
    $types .= "s";
    $params[] = $date;
}
$query .= " ORDER BY p.created_at DESC LIMIT 500";

$stmt = $conn->prepare($query);
if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$result = $stmt->get_result();
$rows = [];
while ($row = $result->fetch_assoc()) {
    // Renomme le champ pour correspondre à l'appel JS
    $row['date_time'] = $row['created_at'];
    unset($row['created_at']);
    $rows[] = $row;
}
echo json_encode($rows);
?>