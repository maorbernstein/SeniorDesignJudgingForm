#include <iostream>
#include <string>
#include <unistd.h>
#include "common/admin.hpp"
#include "common/http.hpp"
#include "common/rooms.hpp"
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
  Room room;
  in.Parse(getPostedString().c_str());
  out.Parse("{}");
  string roomId = in["id"].GetString();
  Value change = in["change"].GetObject();
  if(!rooms.find(roomId, room)){
    out.AddMember("status", -1, out.GetAllocator());
    out.AddMember("error", "invalid project id", out.GetAllocator());
    sendResponse(out);
  }
  if(!rooms.update(roomId, change)){
    out.AddMember("status", -2, out.GetAllocator());
    out.AddMember("error", "invalid change request.", out.GetAllocator());
    sendResponse(out);
  }
  sendDefaultResponse();
}
