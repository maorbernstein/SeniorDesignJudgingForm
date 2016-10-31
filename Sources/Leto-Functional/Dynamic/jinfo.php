<?php
    require_once('config.php');
    
    function sendResponse($response) {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: AUTHORIZATION');
        echo json_encode($response);
    }
    
    /*
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        header('Access-Control-Allow-Origin : *');
        header('Access-Control-Allow-Methods : GET, OPTIONS');
        header('Access-Control-Allow-Headers : AUTHORIZATION');
//         exit;
    }
*/
    
    if (!isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $response = array();
        $response['status'] = 1;
        $response['error'] = "Invalid Request";
        
        sendResponse($response);
        exit;
    }
    
    $resp = array();
    
    $db = mysqli_connect('localhost', $db_user, $db_password, $db_database);
    if (mysqli_connect_errno($db)) {
        $resp['status'] = 1;
        $resp['error'] = mysqli_connect_error();
        sendResponse($resp);
        return;
    }
    
    $judgeID = $_SERVER['HTTP_AUTHORIZATION'];
    $jid = NULL;
    
    $judgeInfoQuery = $db -> prepare("SELECT J.id AS id, J.name AS name, J.subtitle AS subtitle, R.id AS room_id, R.name AS r_name, R.abbreviation AS r_abv FROM Judges J, Rooms R WHERE `judge_id` = ? AND J.room_id = R.id;");
    $judgeInfoQuery -> bind_param('s', $judgeID);
    
    if (!$judgeInfoQuery -> execute()) {
        $resp['status'] = 2;
        $resp['error'] = mysqli_error($db);
        sendResponse($resp);
        return;
    }
    
    $room_no = NULL;
    
    if ($row = $judgeInfoQuery -> get_result() -> fetch_assoc()) {
        $resp['status'] = 0;
        $resp['name'] = $row['name'];
        $resp['subtitle'] = $row['subtitle'];
        $resp['room_abv'] = $row['r_abv'];
        
        $room_no = $row['room_id'];
        $jid = $row['id'];
    } else {
        $resp['status'] = 2;
        $resp['error'] = mysqli_error($db);
        sendResponse($resp);
        return;
    }
    
    if ($room_no) {
        $projectsQuery = $db -> prepare("SELECT * FROM Projects WHERE `room_id` = ?;");
        $projectsQuery -> bind_param('i', $room_no);
        
        if(!$projectsQuery -> execute()) {
            $resp['status'] = 3;
            $resp['error'] = mysqli_error($db);
            sendResponse($resp);
            return;
        }
        
        $db_projects = $projectsQuery -> get_result();
        $projects = array();
        
        while($row = $db_projects -> fetch_assoc()) {
            // Existing Evals
            $evalsQuery = $db -> prepare("SELECT item_id AS id, value FROM Evaluations WHERE `project_id` = ? AND `judge_id` = ?");
            $evalsQuery -> bind_param('ii', $row['id'], $jid);
            $evalsQuery -> execute();
            $evalsResult = $evalsQuery -> get_result();
            
            $evals = array();
            while($ev_row = $evalsResult -> fetch_assoc()) {
                $evals[$ev_row['id']] = $ev_row['value'];
            }
            
            $row['evaluations'] = $evals;
            
            // Existing Comments
            $commentQuery = $db -> prepare("SELECT comment FROM Comments WHERE `project_id` = ? AND `judge_id` = ?");
            $commentQuery -> bind_param('ii', $row['id'], $jid);
            $commentQuery -> execute();
            $commentRes = $commentQuery -> get_result();
            
            if($cm_row = $commentRes -> fetch_assoc()) {
                $row['comment'] = $cm_row['comment'];
            }
                        
            $projects[] = $row;
        }
        
        $resp['projects'] = $projects;
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
        
        $itemsQuery = $db -> prepare("SELECT id, title, tag FROM Items WHERE section = ?;");
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
        
    sendResponse($resp);
?>