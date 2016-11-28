#include <iostream>
#include <string>
#include <unistd.h>
#include "common/admin.hpp"
#include "common/http.hpp"
#include "common/projects.hpp"
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
  Projects projects;
  Project project;
  in.Parse(getPostedString().c_str());
  out.Parse("{}");
  string projectId = in["id"].GetString();
  if(!projects.remove(projectId)){
    out.AddMember("status", -1, out.GetAllocator());
    out.AddMember("error", "invalid project id", out.GetAllocator());
    sendResponse(out);
  }
  sendDefaultResponse();
}
