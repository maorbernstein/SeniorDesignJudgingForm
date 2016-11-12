#include "http.hpp"
#include <iostream>
#include <cstdlib>

using namespace std;

std::string getPostedString() {
  string json_in;
  while(cin.good()){
    string s;
    getline(cin, s);
    json_in += s;
  }
  return json_in;
}

std::string getAuthString() {
  return getenv("HTTP_AUTHENTICATION");
}
