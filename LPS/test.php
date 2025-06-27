<!DOCTYPE html> 
<html lang="en"> 
<head> 
<meta charset="UTF-8"> 
<meta name="viewport" content="width=device-width, initial-scale=1.0"> 
<title>Document</title> 
</head> 
<body> 
<?php 
$destination = "mbuyidanie390@gmail.com"; 
$sujet = "test de mail"; 
$message = "Un contenu de mail"; 
$headers = "From:mbuyidanie390@gmail.com";
if (mail($destination, $sujet, $message, $headers)) {
    echo "Mail envoyé avec succès !";
} else {
    echo "Échec de l'envoi du mail.";
}
?> 
</body> 
</html>