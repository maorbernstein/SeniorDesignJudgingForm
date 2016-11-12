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
  Projects projects;
  EvaluationStates evalstates;
  Judges judges;
  Rooms rooms;
  Value projects_json(kArrayType);
  for(Projects::iterator project = projects.begin(); project != projects.end(); project++) {
    Room room;
    if(!rooms.find(project->getRoomId(), room)){
      out.AddMember("status", -2, out.GetAllocator());
      out.AddMember("error", "could not find valid room", out.GetAllocator());
      sendResponse(out);
    }
    Value project_json = project->json(out);
    Value roomid_json(project->getRoomId().c_str(), out.GetAllocator());
    project_json.AddMember("room", roomid_json, out.GetAllocator());
    Value evaluations_json(kArrayType);
    vector<Judge> project_judges = judges.find(room);
    for(vector<Judge>::iterator judge = project_judges.begin(); judge != project_judges.end(); judge++){
      Value evaluation_json(kObjectType);
      Value judgeId_json(judge->getId().c_str(), out.GetAllocator());
      evaluation_json.AddMember("judge_id", judgeId_json, out.GetAllocator());
      EvalState state = evalstates.find(*judge, *project);
      if(state == EvalState::NOT_STARTED){
        evaluation_json.AddMember("status", "not started", out.GetAllocator());
      } else if (state == EvalState::STARTED){
        evaluation_json.AddMember("status", "incomplete",out.GetAllocator());
      } else {
        evaluation_json.AddMember("status", "done",out.GetAllocator());
      }
      Evaluation e(*judge, *project);
      evaluation_json.AddMember("score", e.computeScore(), out.GetAllocator());
      evaluation_json.AddMember("evaluation", e.json(out), out.GetAllocator());
      evaluations_json.PushBack(evaluation_json, out.GetAllocator());
    }
    project_json.AddMember("evaluations", evaluations_json, out.GetAllocator());
    projects_json.PushBack(project_json, out.GetAllocator());
  }
  out.AddMember("projects", projects_json, out.GetAllocator());
  sendResponse(out);
}
