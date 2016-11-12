#include <iostream>
#include <fstream>
#include <string>
#include <cstring>
#include "common/errors.hpp"
#include "common/judges.hpp"
#include "common/http.hpp"

using namespace std;
using namespace rapidjson;

int main() {
  Document in;
  Judges judges;
  Judge judge;
  in.Parse(getPostedString().c_str());
  string id = in["id"].GetString();
  if(judges.find(id, judge)){
    sendDefaultResponse();
  } else {
    throwInvalidAuth();
  }
}
