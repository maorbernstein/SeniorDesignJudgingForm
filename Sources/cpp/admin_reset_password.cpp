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
  string new_password = in["password"].GetString();
  string reset_token = in["reset_token"].GetString();
  if(admin.resetPassword(reset_token, new_password)){
    out.AddMember("status", 0, out.GetAllocator());
    out.AddMember("error", "none", out.GetAllocator());
  } else {
    out.AddMember("status", -1, out.GetAllocator());
    out.AddMember("error", "Invalid reset token.", out.GetAllocator());
  }
  sendResponse(out);
}
