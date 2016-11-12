#include <iostream>
#include <string>
#include <unistd.h>
#include "common/admin.hpp"
#include "common/http.hpp"
#include "common/rooms.hpp"
#include "common/projects.hpp"
#include "common/errors.hpp"
#include "common/judges.hpp"
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
  Value rooms_json(kArrayType);
  for(Rooms::iterator room = rooms.begin(); room != rooms.end(); room++) {
    Value room_json(kObjectType);
    room_json.AddMember("name", Value(room->getName().c_str(), out.GetAllocator()), out.GetAllocator());
    room_json.AddMember("name_abv", Value(room->getAbv().c_str(), out.GetAllocator()), out.GetAllocator());
    room_json.AddMember("room_id", Value(room->getId().c_str(), out.GetAllocator()), out.GetAllocator());
    Value judge_ids(kArrayType);
    vector<Judge> room_judges = judges.find(*room);
    for(size_t i = 0; i < room_judges.size(); i++){
      judge_ids.PushBack(Value(room_judges[i].getId().c_str(), out.GetAllocator()), out.GetAllocator());
    }
    Value project_ids(kArrayType);
    vector<Project> room_projects = projects.find(*room);
    for(size_t i = 0; i < room_projects.size(); i++){
      project_ids.PushBack(Value(room_projects[i].getId().c_str(), out.GetAllocator()), out.GetAllocator());
    }
    room_json.AddMember("judges", judge_ids, out.GetAllocator());
    room_json.AddMember("projects", project_ids, out.GetAllocator());
    rooms_json.PushBack(room_json, out.GetAllocator());
  }
  out.AddMember("rooms", rooms_json, out.GetAllocator());
  sendResponse(out);
}
