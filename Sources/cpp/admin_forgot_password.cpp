#include <iostream>
#include <string>
#include <unistd.h>
#include "common/admin.hpp"
#include "common/http.hpp"
#include "common/errors.hpp"
#include "common/utils.hpp"
using namespace std;
using namespace rapidjson;

const string DEFAULT_SUBJECT = "JudgeEvaluation Admin Password Reset";
const string BOILER_PLATE_HEADER = "Dear Administrator,\nWe have received your request to reset password. To continue, please visit the password reset page and enter the token:";
const string BOILER_PLATE_TRAILER = "\nThank you very much,\nTian Zhang, Maor Bernstein, and Wilson Burchenal.";

int main(){
  Document out;
  Admin admin;
  out.Parse("{}");
  string reset_token = admin.requestPasswordReset();
  string message = BOILER_PLATE_HEADER + reset_token + BOILER_PLATE_TRAILER;
  if(!sendEmail(admin.getEmail(), DEFAULT_SUBJECT, message)){
    out.AddMember("status", -2, out.GetAllocator());
    out.AddMember("error", "Could not send email.", out.GetAllocator());
  } else {
    out.AddMember("status", 0, out.GetAllocator());
    out.AddMember("error", "none", out.GetAllocator());
  }
  sendResponse(out);
}
