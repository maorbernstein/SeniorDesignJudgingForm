#include "admin.hpp"
#include <fstream>
#include <sstream>
#include "filelock.hpp"
using namespace std;
const char* Admin::filename = "/home/mbernste/JudgeEval/Config/admin.txt";
const char* Admin::lockname = "/home/mbernste/JudgeEval/Config/admin.lock";

Admin::Admin(){
  FileReadLock lock(lockname);
  ifstream file(filename);
  string s;
  getline(file, s);
  istringstream ss(s);
  getline(ss, username, ',');
  getline(ss, password, ',');
  getline(ss, auth_token, ',');
}

bool Admin::checkCredentials(const string& user, const string& pass){
  return ((username == user) && (password == pass));
}

bool Admin::checkCredentials(const string& auth){
  return (auth_token == auth);
}
