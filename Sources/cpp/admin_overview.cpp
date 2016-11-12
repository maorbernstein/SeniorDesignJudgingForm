#include <iostream>
#include <string>
#include <unistd.h>
#include "common/admin.hpp"
#include "common/http.hpp"
#include "common/rooms.hpp"
#include "common/projects.hpp"
#include "common/errors.hpp"
#include "common/judges.hpp"
#include "common/evalstates.hpp"
#include "common/evaluation.hpp"
#include "rapidjson/document.h"
using namespace std;
using namespace rapidjson;

int main(){
  Document out;
  Admin admin;
  string token = getAuthString();
  if(!admin.checkCredentials(token)){
    throwInvalidAuth();
  }
  out.Parse("{}");
  Judges judges;
  EvaluationStates evalstates;
  Rooms rooms;
  Projects projects;
  Value rooms_json(kArrayType);
  for(Rooms::iterator room = rooms.begin(); room != rooms.end(); room++){
    Value room_json(kObjectType);
    Value room_name_json(room->getName().c_str(), out.GetAllocator());
    room_json.AddMember("name", room_name_json, out.GetAllocator());
    Value room_abv_json(room->getAbv().c_str(), out.GetAllocator());
    room_json.AddMember("abv", room_abv_json, out.GetAllocator());
    Value room_id_json(room->getId().c_str(), out.GetAllocator());
    room_json.AddMember("id", room_id_json, out.GetAllocator());
    vector<Project> room_projects = projects.find(*room);
    Value room_projects_json(kArrayType);
    vector<Judge> assigned_judges = judges.find(*room);
    for(vector<Project>::iterator project = room_projects.begin(); project != room_projects.end(); project++) {
      Value project_json = project->json(out);
      bool all_complete = true;
      bool all_not_started = true;
      int score = 0;
      int started_projects = 0;
      for(vector<Judge>::iterator judge = assigned_judges.begin(); judge != assigned_judges.end(); judge++){
        EvalState state = evalstates.find(*judge, *project);
        if(state != EvalState::NOT_STARTED){
          Evaluation e(*judge, *project);
          all_not_started = false;
          score += e.computeScore();
          started_projects++;
        }
        if(state != EvalState::DONE){
          all_complete = false;
        }
      }
      int average_score;
      if(all_not_started) {
        average_score = 0;
      } else {
        average_score = score / started_projects;
      }
      project_json.AddMember("score", average_score, out.GetAllocator());
      if(all_complete){
        project_json.AddMember("status", "done", out.GetAllocator());
      } else if(all_not_started){
        project_json.AddMember("status", "not started", out.GetAllocator());
      } else {
        project_json.AddMember("status", "in progress", out.GetAllocator());
      }
      room_projects_json.PushBack(project_json, out.GetAllocator());
    }
    room_json.AddMember("projects", room_projects_json, out.GetAllocator());
    rooms_json.PushBack(room_json, out.GetAllocator());
  }
  out.AddMember("rooms", rooms_json, out.GetAllocator());
  sendResponse(out);
}
