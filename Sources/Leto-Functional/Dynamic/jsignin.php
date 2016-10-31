<?php
    require_once('config.php');
    
    function sendResponse($response) {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: AUTHORIZATION');
        echo json_encode($response);
    }
        
    $post = file_get_contents('php://input');
    $deserializedData = json_decode($post, true);
    
    $judgeID = $deserializedData['id'];
    $resp = array();
    
    $db = mysqli_connect('localhost', $db_user, $db_password, $db_database);
    if (mysqli_connect_errno($db)) {
        $resp['status'] = 1;
        $resp['error'] = mysqli_connect_error();
        sendResponse($resp);
        return;
    }
    
    $judgeInfoQuery = $db -> prepare("SELECT id FROM Judges WHERE `judge_id` = ?;");
    $judgeInfoQuery -> bind_param('s', $judgeID);
    
    if (!$judgeInfoQuery -> execute()) {
        $resp['status'] = 2;
        $resp['error'] = mysqli_error($db);
        sendResponse($resp);
        return;
    }
        
    if ($row = $judgeInfoQuery -> get_result() -> fetch_assoc()) {
        $resp['status'] = 0;
    } else {
        $resp['status'] = 2;
        $resp['error'] = mysqli_error($db);
        sendResponse($resp);
        return;
    }
    
    sendResponse($resp);
?>