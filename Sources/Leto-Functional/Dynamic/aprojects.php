<?php
    require_once('config.php');
    require_once('a_as.php');
    
    function sendResponse($response) {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: AUTHORIZATION');
        echo json_encode($response);
    }
    
    if (!isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $response = array();
        $response['status'] = 1;
        $response['error'] = "Invalid Request";
        
        sendResponse($response);
        exit;
    }
                
    $db = mysqli_connect('localhost', $db_user, $db_password, $db_database);
    if (mysqli_connect_errno($db)) {
        $resp['status'] = 1;
        $resp['error'] = mysqli_connect_error();
        sendResponse($resp);
        return;
    }
    
    $token = $_SERVER['HTTP_AUTHORIZATION'];
    $resp = array();
    
    if (!userWithAccessToken($db, $token)) {
        $response = array();
        $response['status'] = 1;
        $response['error'] = "Invalid Token";
        
        sendResponse($response);
        exit;
    }
        
    $projectQuery = $db -> prepare('SELECT id, name FROM Projects;');
    $projectQuery -> execute();
    $projectResult = $projectQuery -> get_result();
    
    $projects = array();
    
    while ($p_row = $projectResult -> fetch_assoc()) {
        $projects[] = $p_row;
    }
    
    $resp['status'] = 0;
    $resp['projects'] = $projects;
        
    sendResponse($resp);
    exit;
?>