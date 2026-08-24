<?php
declare(strict_types=1);

// Ziel-Adresse fürs Kontaktformular
$empfaenger = 'info@kinesiologie-laraschmid.ch';

// reCAPTCHA Secret Key: liegt bewusst NICHT in dieser Datei (die landet auf
// GitHub in einem öffentlichen Repo), sondern in config.local.php, die nur
// per FTP/SFTP direkt auf den Server hochgeladen wird und nie committet wird.
$recaptchaSecret = '';
$configPfad = __DIR__ . '/config.local.php';
if (is_file($configPfad)) {
    require $configPfad;
}

header('Content-Type: text/plain; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo 'Method not allowed';
    exit;
}

function feld(string $key): string {
    return trim((string)($_POST[$key] ?? ''));
}

// Honeypot: Bots füllen dieses unsichtbare Feld aus, Menschen nicht.
// Ist es ausgefüllt, tun wir so, als wäre alles ok, senden aber nichts.
if (feld('_hp') !== '') {
    echo 'OK';
    exit;
}

// reCAPTCHA serverseitig bei Google prüfen – die Checkbox im Formular
// allein reicht nicht, ein Bot könnte den Wert auch einfach fälschen.
$recaptchaResponse = feld('g-recaptcha-response');
if ($recaptchaSecret !== '' ) {
    if ($recaptchaResponse === '') {
        http_response_code(400);
        echo 'Bitte reCAPTCHA-Häkchen setzen.';
        exit;
    }
    $verify = file_get_contents('https://www.google.com/recaptcha/api/siteverify?' . http_build_query([
        'secret'   => $recaptchaSecret,
        'response' => $recaptchaResponse,
        'remoteip' => $_SERVER['REMOTE_ADDR'] ?? '',
    ]));
    $verifyData = json_decode((string)$verify, true);
    if (empty($verifyData['success'])) {
        http_response_code(400);
        echo 'reCAPTCHA-Prüfung fehlgeschlagen. Bitte nochmals versuchen.';
        exit;
    }
}

$name      = feld('name');
$email     = feld('email');
$thema     = feld('thema');
$nachricht = feld('nachricht');
$sprache   = feld('_language') === 'en' ? 'en' : 'de';

if ($name === '' || $email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo 'Bitte Name und eine gültige E-Mail-Adresse angeben.';
    exit;
}

// Header-Injection verhindern: Zeilenumbrüche aus Werten entfernen,
// die in E-Mail-Headern (From/Reply-To) landen.
function headerSicher(string $wert): string {
    return str_replace(["\r", "\n"], '', $wert);
}

$betreff = 'Neue Anfrage über die Website – ' . headerSicher($name);

$body  = "Neue Anfrage über das Kontaktformular auf imfluss-laraschmid.ch\n\n";
$body .= "Name: {$name}\n";
$body .= "E-Mail: {$email}\n";
$body .= "Thema: " . ($thema !== '' ? $thema : '–') . "\n\n";
$body .= "Nachricht:\n" . ($nachricht !== '' ? $nachricht : '(keine)') . "\n";

$headers = [
    'From: ImFluss Website <noreply@kinesiologie-laraschmid.ch>',
    'Reply-To: ' . headerSicher($name) . ' <' . headerSicher($email) . '>',
    'Content-Type: text/plain; charset=utf-8',
];

$erfolg = mail($empfaenger, $betreff, $body, implode("\r\n", $headers));

if ($erfolg) {
    echo 'OK';
} else {
    http_response_code(500);
    echo 'Mail konnte nicht gesendet werden.';
}
