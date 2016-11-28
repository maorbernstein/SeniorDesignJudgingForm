#include <iostream>
#include <string>
#include <unistd.h>
#include "common/admin.hpp"
#include "common/http.hpp"
#include "common/rooms.hpp"
#include "common/projects.hpp"
#include "common/judges.hpp"
#include "common/errors.hpp"
#include "rapidjson/document.h"
using namespace std;
using namespace rapidjson;

int main(){
  Document in, out;
  Admin admin;
  string token = getAuthString();
  if(!admin.checkCredentials(token)){
    throwInvalidAuth();
  }
  Rooms rooms;
  Judges judges;
  Projects projects;
  Room room;
  in.Parse(getPostedString().c_str());
  out.Parse("{}");
  string roomId = in["id"].GetString();
  if(!rooms.find(roomId, room)){
    out.AddMember("status", -1, out.GetAllocator());
    out.AddMember("error", "invalid room id", out.GetAllocator());
    sendResponse(out);
  }
  vector<Judge> room_judges = judges.find(room);
  if(!room_judges.empty()){
    out.AddMember("status", -2, out.GetAllocator());
    out.AddMember("error", "judge associated with room", out.GetAllocator());
    sendResponse(out);
  }
  vector<Project> room_projects = projects.find(room);
  if(!room_projects.empty()){
    out.AddMember("status", -3, out.GetAllocator());
    out.AddMember("error", "project associated with room", out.GetAllocator());
    sendResponse(out);
  }
  rooms.remove(roomId);
  sendDefaultResponse();
}
