#include "errors.hpp"
#include <iostream>
#include <string>
#include "../rapidjson/document.h"
#include "../rapidjson/writer.h"
#include "../rapidjson/stringbuffer.h"

using namespace std;
using namespace rapidjson;

const char* boilerPlate = "Content-Type: application/json;charset=us-ascii\n\n";

void sendResponse(Document& out){
  StringBuffer buffer;
  Writer<StringBuffer> writer(buffer);
  out.Accept(writer);
  cout << boilerPlate << buffer.GetString() << endl;
  exit(0);
}

void sendDefaultResponse() {
  Document out;
  out.Parse("{}");
  out.AddMember("status", 0, out.GetAllocator());
  out.AddMember("error", "none", out.GetAllocator());
  sendResponse(out);
}

void throwInvalidAuth() {
  Document out;
  out.Parse("{}");
  out.AddMember("status", -1, out.GetAllocator());
  out.AddMember("error","auth_failed", out.GetAllocator());
  sendResponse(out);
}
