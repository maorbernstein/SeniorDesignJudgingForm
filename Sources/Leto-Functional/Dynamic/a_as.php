<?php
    function generateTokenForUID($db, $uid, &$access_token) {
        $rawAccessToken = openssl_random_pseudo_bytes(64);
        
        $access_token = base64_encode($rawAccessToken);
        
        $query = $db -> prepare("INSERT INTO `AuthorizedSessions` (uid, token) VALUES (?, ?);");
        $query -> bind_param('is', $uid, $access_token);
        
        if (!$query -> execute()) {
            echo "Error". mysqli_error($db);
            return false;
        }
                
        return true;
    }
    
    function userWithAccessToken($db, $access_token) {
        $query = $db -> prepare("SELECT uid FROM `AuthorizedSessions` WHERE `token` = ?;");
        $query -> bind_param('s', $access_token);
        
        if (!$query -> execute()) {
            return null;
        }
        
        if ($row = $query -> get_result() -> fetch_assoc()) {
            return $row;
        } else {
            return null;
        }
    }
?>