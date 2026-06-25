<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// === CAU HINH ZALO APP (luu thang trong file nay - khong can truyen token qua URL) ===
$ZALO_APP_ID     = '3872938296996027660';
$ZALO_SECRET_KEY = 'v65u7m88vP35YcJ88P38';
$ZALO_REFRESH_TOKEN = 'KdHv3vO7CHbTT7aAbmm-7rPwUGoL5LWU5XDiIgOcK0uyFNL2Z4bA2X9HRLsrOaK8C1OCJhOXFWyYDWmPcI0xJ1y5VJYeCLXH30TXBiyFOanlA5y8xYfgUbWEI3tx2MbMUNzN9RjG44W-UILPgtOBIo84I2UW6d9Z925L9wOrQ6OyDrLxgKDf2M9aJKtpV5a5C51vQVDGFIqsHNbxy3T55aWzVXwFI5rZEqKUTRrgDmStHmnbzLCu2rac1NRBNYSX2IrlOyiYB7DQ6H5bvIXDCr8DTsNj8589RXiQ7iqLFGrjE09vsIfACqzTN73uRKGNRs02LgXHHXukM0Hnx2eU9cPSF7BaBtyvNLb2A_rlTMCw5b0Nh0OGGX0_DIxM2YXcK188S9CrDpS15p1-tnaBQtmxBYDByq5n9PKREn8';

// File luu token de khoi goi refresh moi lan
$TOKEN_FILE = __DIR__ . '/zalo_token_cache.json';

// === LAY ACCESS TOKEN ===
function getAccessToken($app_id, $secret_key, $refresh_token, $token_file) {
    // Doc token tu cache
    if (file_exists($token_file)) {
        $cached = json_decode(file_get_contents($token_file), true);
        if ($cached && isset($cached['access_token']) && isset($cached['expires_at'])) {
            // Con han hon 1 tieng thi dung lai
            if ($cached['expires_at'] > (time() + 3600)) {
                return $cached['access_token'];
            }
        }
    }
    
    // Lay token moi qua refresh token
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://oauth.zaloapp.com/v4/oa/access_token');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/x-www-form-urlencoded',
        'secret_key: ' . $secret_key
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'app_id'        => $app_id,
        'refresh_token' => $refresh_token,
        'grant_type'    => 'refresh_token'
    ]));
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    $data = json_decode($response, true);
    
    if (isset($data['access_token'])) {
        // Luu vao cache
        $cache = [
            'access_token'  => $data['access_token'],
            'refresh_token' => $data['refresh_token'] ?? $refresh_token,
            'expires_at'    => time() + (int)($data['expires_in'] ?? 86400)
        ];
        file_put_contents($token_file, json_encode($cache));
        return $data['access_token'];
    }
    
    return null;
}

// === KIEM TRA THAM SO ===
$user_id = $_GET['user_id'] ?? '';

if (!$user_id) {
    echo json_encode(["error" => -1, "message" => "Missing user_id parameter"]);
    exit;
}

// === LAY TOKEN ===
$access_token = getAccessToken($ZALO_APP_ID, $ZALO_SECRET_KEY, $ZALO_REFRESH_TOKEN, $TOKEN_FILE);

if (!$access_token) {
    echo json_encode(["error" => -1, "message" => "Cannot get Zalo access token"]);
    exit;
}

// === GOI ZALO V3 API ===
$data_param = urlencode(json_encode(["user_id" => $user_id]));
$url = 'https://openapi.zalo.me/v3.0/oa/user/detail?data=' . $data_param;

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'access_token: ' . $access_token
]);

$response = curl_exec($ch);
$curl_error = curl_error($ch);
curl_close($ch);

if ($curl_error) {
    echo json_encode(["error" => -1, "message" => "cURL error: " . $curl_error]);
    exit;
}

echo $response;
?>
