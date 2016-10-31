<?php
    require_once('config.php');
    
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
    
    $post = file_get_contents('php://input');
    $deserializedData = json_decode($post, true);
    
    $resp = array();
    
    $db = mysqli_connect('localhost', $db_user, $db_password, $db_database);
    if (mysqli_connect_errno($db)) {
        $resp['status'] = 1;
        $resp['error'] = mysqli_connect_error();
        sendResponse($resp);
        return;
    }
    
    $judgeID = $_SERVER['HTTP_AUTHORIZATION'];
    
    $judgeInfoQuery = $db -> prepare("SELECT id FROM Judges WHERE `judge_id` = ?;");
    $judgeInfoQuery -> bind_param('s', $judgeID);
    
    if (!$judgeInfoQuery -> execute()) {
        $resp['status'] = 2;
        $resp['error'] = mysqli_error($db);
        sendResponse($resp);
        return;
    }
    
    $jid = NULL;
    
    if ($row = $judgeInfoQuery -> get_result() -> fetch_assoc()) {
        $resp['status'] = 0;
        $jid = $row['id'];
    } else {
        $resp['status'] = 2;
        $resp['error'] = mysqli_error($db);
        sendResponse($resp);
        return;
    }
    
    if ($jid) {
        $team_id = $deserializedData['id'];
        $evals = $deserializedData['evaluations'];
        foreach($evals as $eval) {
            $item_id = $eval['id'];
            $item_value = $eval['value'];
            
            if ($item_value === NULL) {
                continue;
            }
            
            $query = $db -> prepare("INSERT INTO `Evaluations` (judge_id, project_id, item_id, value) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE value = ?");
            $query -> bind_param(
                'iiiii',
                $jid,
                $team_id,
                $item_id,
                $item_value,
                $item_value
            );
            if (!$query -> execute()) {
                $resp['status'] = 2;
                $resp['error'] = mysqli_error($db);
                sendResponse($resp);
                return;
            }
        }
    }
    
    if ($deserializedData['comment']) {
        $comment = $deserializedData['comment'];
        $query = $db -> prepare("INSERT INTO `Comments` (judge_id, project_id, comment) VALUES (?,?,?) ON DUPLICATE KEY UPDATE comment = ?");
        $query -> bind_param(
            'iiss',
            $jid,
            $team_id,
            $comment,
            $comment
        );
        if (!$query -> execute()) {
            $resp['status'] = 2;
            $resp['error'] = mysqli_error($db);
            sendResponse($resp);
            return;
        }
    }
    
    sendResponse($resp);
?>