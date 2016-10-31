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
    
    parse_str($_SERVER['QUERY_STRING']);
    
    $projectQuery = $db -> prepare('SELECT name FROM Projects WHERE id = ?;');
    $projectQuery -> bind_param('i', $pid);
    $projectQuery -> execute();
    if ($p_row = $projectQuery -> get_result() -> fetch_assoc()) {
        $resp['name'] = $p_row['name'];
    }
    
    $judgesQuery = $db -> prepare('SELECT * FROM Judges WHERE room_id = (SELECT room_id FROM Projects WHERE id = ?);');
    $judgesQuery -> bind_param('i', $pid);
    
    if (!$judgesQuery -> execute()) {
        $resp['status'] = 2;
        $resp['error'] = mysqli_error($db);
        sendResponse($resp);
        return;
    }
    
    $judges = array();
    $judgesResult = $judgesQuery -> get_result();
    while($row = $judgesResult -> fetch_assoc()) {
        $judge = array();
        $judge['name'] = $row['name'];
        
        $evalQuery = $db -> prepare('SELECT item_id, value FROM Evaluations WHERE judge_id = ? AND project_id = ?;');
        $evalQuery -> bind_param('ii', $row['id'], $pid);
        $evalQuery -> execute();
        
        $evalResults = $evalQuery -> get_result();
        $evals = array();
        while($e_row = $evalResults -> fetch_assoc()) {
            $evals[] = $e_row;
        }
        
        $judge['evals'] = $evals;
        
        $commentQuery = $db -> prepare('SELECT comment FROM Comments WHERE judge_id = ? AND project_id = ?;');
        $commentQuery -> bind_param('ii', $row['id'], $pid);
        $commentQuery -> execute();
        
        if($c_row = $commentQuery -> get_result() -> fetch_assoc()) {
            $judge['comment'] = $c_row['comment'];
        }
        
        $judges[] = $judge;
    }
    
    $sectionsQuery = $db -> prepare("SELECT * FROM Sections;");
    if(!$sectionsQuery -> execute()) {
        $resp['status'] = 3;
        $resp['error'] = mysqli_error($db);
        sendResponse($resp);
        return;
    }
    
    $db_sections = $sectionsQuery -> get_result();
    $sections = array();
    
    while($section_row = $db_sections -> fetch_assoc()) {
        $sectionInfo = array();
        $sectionInfo['name'] = $section_row['name'];
        $sectionInfo['type'] = $section_row['item_type'];
        
        $itemsQuery = $db -> prepare("SELECT id, title FROM Items WHERE section = ?;");
        $itemsQuery -> bind_param('i', $section_row['id']);
        if(!$itemsQuery -> execute()) {
            $resp['status'] = 3;
            $resp['error'] = mysqli_error($db);
            sendResponse($resp);
            return;
        }
        
        $db_items = $itemsQuery -> get_result();
        $items = array();
        
        while($row = $db_items -> fetch_assoc()) {
            $items[] = $row;
        }
        $sectionInfo['items'] = $items;
        $sections[] = $sectionInfo;
    }
    
    $resp['sections'] = $sections;
    
    $resp['status'] = 0;
    $resp['judges'] = $judges;
        
    sendResponse($resp);
    exit;
?>