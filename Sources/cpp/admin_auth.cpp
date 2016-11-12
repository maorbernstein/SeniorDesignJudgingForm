#include <iostream>
#include <string>
#include <unistd.h>
#include "common/admin.hpp"
#include "common/http.hpp"
#include "common/errors.hpp"
using namespace std;
using namespace rapidjson;

int main(){
  Document in, out;
  Admin admin;
  in.Parse(getPostedString().c_str());
  out.Parse("{}");
  string username = in["username"].GetString();
  string password = in["password"].GetString();
  if(admin.checkCredentials(username, password)){
    out.AddMember("status", 0, out.GetAllocator());
    out.AddMember("error", "none", out.GetAllocator());
    out.AddMember("token", StringRef(admin.getToken().c_str()), out.GetAllocator());
  } else {
    throwInvalidAuth();
  }
  sendResponse(out);
}
