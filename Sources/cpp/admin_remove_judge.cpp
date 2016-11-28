#include <iostream>
#include <string>
#include <unistd.h>
#include "common/admin.hpp"
#include "common/http.hpp"
#include "common/errors.hpp"
#include "common/judges.hpp"
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
  Judges judges;
  Judge judge;
  in.Parse(getPostedString().c_str());
  out.Parse("{}");
  string judgeId = in["id"].GetString();
  if(!judges.remove(judgeId)){
    out.AddMember("status", -1, out.GetAllocator());
    out.AddMember("error", "invalid judge id", out.GetAllocator());
    sendResponse(out);
  }
  sendDefaultResponse();
}
