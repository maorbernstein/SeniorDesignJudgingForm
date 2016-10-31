<?php
    require_once('config.php');
    
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
        $resp['status'] = 2;
        $resp['error'] = "User Exist";
        sendResponse($resp);
        return;
    } else {
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        $addUserQuery = $db -> prepare("INSERT INTO `Users` (username, password) VALUES (?,?);");
        $addUserQuery -> bind_param('ss', $username, $hashed_password);
        
        if (!$addUserQuery -> execute()) {
            $resp['status'] = 2;
            $resp['error'] = "Creation Error";
            sendResponse($resp);
            return;
        } else {
            $resp['status'] = 0;
        }
    }
    
    sendResponse($resp);
    exit;
?>