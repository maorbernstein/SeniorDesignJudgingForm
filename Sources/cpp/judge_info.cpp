#include <iostream>
#include <string>
#include "common/judges.hpp"
#include "common/rooms.hpp"
#include "common/projects.hpp"
#include "common/evalstates.hpp"
#include "common/evaluation.hpp"
#include "common/http.hpp"
#include "common/errors.hpp"
using namespace std;
using namespace rapidjson;

int main(){
  Document out;
  Judges judges;
  Judge judge;
  out.Parse("{}");
  string judgeId = getAuthString();
  if (!judges.find(judgeId, judge)) {
    throwInvalidAuth();
  }
  Rooms rooms;
  Room room;
  if(!rooms.find(judge.getRoomId(), room)){
    out.AddMember("status", -2, out.GetAllocator());
    out.AddMember("error", "invalid room", out.GetAllocator());
    sendResponse(out);
  } else {
    out.AddMember("name", StringRef(judge.getFullName().c_str()), out.GetAllocator());
    out.AddMember("room", StringRef(room.getName().c_str()), out.GetAllocator());
    Projects projects;
    EvaluationStates states;
    vector<Project> room_projects = projects.find(room);
    Value json_projects(kArrayType);
    for(size_t i = 0; i < room_projects.size(); i++){
      Value project = room_projects[i].json(out);
      EvalState state = states.find(judge,room_projects[i]);
      if(state != EvalState::NOT_STARTED){
        Evaluation eval(judge, room_projects[i]);
        project.AddMember("evaluation", eval.json(out), out.GetAllocator());
      }
      json_projects.PushBack(project, out.GetAllocator());
    }
    out.AddMember("projects", json_projects, out.GetAllocator());
    sendResponse(out);
  }
}
