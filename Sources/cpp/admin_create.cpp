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
  Document in, out;
  Admin admin;
  string token = getAuthString();
  if(!admin.checkCredentials(token)){
    throwInvalidAuth();
  }
  Projects projects;
  Judges judges;
  Rooms rooms;
  in.Parse(getPostedString().c_str());
  out.Parse("{}");
  Value projectsJson = in["projects"].GetArray();
  for(SizeType i = 0; i < projectsJson.Size(); i++){
    projects.addProject(projectsJson[i]);
  }
  Value roomsJson = in["rooms"].GetArray();
  for(SizeType i = 0; i < roomsJson.Size(); i++){
    rooms.addRoom(roomsJson[i]);
  }
  Value judgesJson = in["judges"].GetArray();
  for(SizeType i = 0; i < judgesJson.Size(); i++){
    judges.addJudge(judgesJson[i]);
  }
  sendDefaultResponse();
}
