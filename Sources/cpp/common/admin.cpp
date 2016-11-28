#include "admin.hpp"
#include <fstream>
#include <sstream>
#include "filelock.hpp"
#include "utils.hpp"
using namespace std;
const char* Admin::filename = "Config/admin.txt";
const char* Admin::lockname = "Config/admin.lock";

void Admin::store() {
  ofstream file(filename);
  file << username << ',' << password << ',' << auth_token << ',' << email_address;
  if(reset_token_valid){
    file << ',' << reset_token;
  }
  file << endl;
}

void Admin::load() {
  ifstream file(filename);
  string s;
  getline(file, s);
  istringstream ss(s);
  getline(ss, username, ',');
  getline(ss, password, ',');
  getline(ss, auth_token, ',');
  getline(ss, email_address, ',');
  if(ss){
    getline(ss, reset_token, ',');
    reset_token_valid = true;
  }
}

Admin::Admin(){
  FileReadLock lock(lockname);
  load();
}

bool Admin::checkCredentials(const string& user, const string& pass, string& token){
  if( (username == user) && (password == pass) ) {
    FileWriteLock lock(lockname);
    load();
    token = auth_token = generateRandomID();
    store();
    return true;
  }
  return false;
}

bool Admin::checkCredentials(const string& auth){
  return (auth_token == auth);
}

string Admin::requestPasswordReset(){
  string tok;
  FileWriteLock lock(lockname);
  load();
  reset_token_valid = true;
  tok = reset_token = generateLongRandomID();
  store();
  return tok;
}

bool Admin::resetPassword(const string& reset_tok, const string& new_password) {
  FileWriteLock lock(lockname);
  load();
  if(!reset_token_valid){
    return false;
  }
  if(reset_token != reset_tok){
    return false;
  }
  reset_token_valid = false;
  password = new_password;
  store();
  return true;
}
