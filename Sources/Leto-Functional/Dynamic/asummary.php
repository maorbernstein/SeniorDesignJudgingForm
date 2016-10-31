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
    
    $sessions = array();
    $roomsQuery = $db -> prepare('SELECT * FROM Rooms;');
    
    if (!$roomsQuery -> execute()) {
        $resp['status'] = 2;
        $resp['error'] = mysqli_error($db);
        sendResponse($resp);
        return;
    }
    
    $roomsResult = $roomsQuery -> get_result();
    while($row = $roomsResult -> fetch_assoc()) {
        $session = array();
        $session['name'] = $row['session_name'];
        
        $projects = array();
        $assoc_projects_query = $db -> prepare('SELECT name, sum(value) AS score FROM Evaluations E, Projects P WHERE E.project_id IN (SELECT id FROM Projects WHERE `room_id` = ?) AND item_id <= 12 AND E.project_id = P.id GROUP BY project_id ORDER BY score DESC;');
        $assoc_projects_query -> bind_param('i', $row['id']);
        $assoc_projects_query -> execute();
        $assoc_projects_result = $assoc_projects_query -> get_result();
        while($p_row = $assoc_projects_result -> fetch_assoc()) {
            $projects[] = $p_row;
        }
        
        $session['projects'] = $projects;
        $sessions[] = $session;
    }
    
    $resp['status'] = 0;
    $resp['sessions'] = $sessions;
        
    sendResponse($resp);
    exit;
?>