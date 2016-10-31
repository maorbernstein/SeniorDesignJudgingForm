<?php
    require_once('config.php');
    require_once('a_as.php');
    
    function sendResponse($response) {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: AUTHORIZATION');
        echo json_encode($response);
    }
        
    $post = file_get_contents('php://input');
    $deserializedData = json_decode($post, true);
    
    if (!$deserializedData) {
        $response = array();
        $response['status'] = 1;
        $response['error'] = "Invalid Request";
        
        header('Content-type: application/json');
        print json_encode($response);
        exit;
    }
    
    if (!isset($deserializedData['username'])) {
        $response = array();
        $response['status'] = 1;
        $response['error'] = "Missing username";
        
        header('Content-type: application/json');
        print json_encode($response);
        exit;
    }

    if (!isset($deserializedData['password'])) {
        $response = array();
        $response['status'] = 1;
        $response['error'] = "Missing Password";
        
        header('Content-type: application/json');
        print json_encode($response);
        exit;
    }
    
    $username = strtolower($deserializedData['username']);
    $password = $deserializedData['password'];
    
    $resp = array();
    
    $db = mysqli_connect('localhost', $db_user, $db_password, $db_database);
    if (mysqli_connect_errno($db)) {
        $resp['status'] = 1;
        $resp['error'] = mysqli_connect_error();
        sendResponse($resp);
        return;
    }
    
    $userQuery = $db -> prepare("SELECT * FROM Users WHERE `username` = ?;");
    $userQuery -> bind_param('s', $username);
    
    if (!$userQuery -> execute()) {
        $resp['status'] = 2;
        $resp['error'] = mysqli_error($db);
        sendResponse($resp);
        return;
    }
        
    if ($row = $userQuery -> get_result() -> fetch_assoc()) {
        $hashed_password = $row['password'];
        if (!password_verify($password, $hashed_password)) {
            $resp['status'] = 3;
            $resp['error'] = "Can't find user with given username and password.";
            sendResponse($resp);
            exit;
        } else {
            $uid = $row['id'];
            $token = NULL;
            generateTokenForUID($db, $uid, $token);
            $resp['status'] = 0;
            $resp['token'] = $token;
        }
    } else {
        $resp['status'] = 2;
        $resp['error'] = mysqli_error($db);
        sendResponse($resp);
        return;
    }
    
    sendResponse($resp);
    exit;
?>