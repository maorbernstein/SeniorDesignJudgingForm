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
  Judges judges;
  Rooms rooms;
  Value judges_json(kArrayType);
  for(Judges::iterator judge = judges.begin(); judge != judges.end(); judge++) {
    Value judge_json = judge->json(out);
    Room room;
    if(!rooms.find(judge->getRoomId(), room)){
      out.AddMember("status", -2, out.GetAllocator());
      out.AddMember("error", "could not find valid room", out.GetAllocator());
      sendResponse(out);
    }
    Value project_ids(kArrayType);
    vector<Project> judges_projects = projects.find(room);
    for(size_t i = 0; i < judges_projects.size(); i++){
      project_ids.PushBack(Value(judges_projects[i].getId().c_str(), out.GetAllocator()), out.GetAllocator());
    }
    judge_json.AddMember("projects", project_ids, out.GetAllocator());
    judges_json.PushBack(judge_json, out.GetAllocator());
  }
  out.AddMember("judges", judges_json, out.GetAllocator());
  sendResponse(out);
}
