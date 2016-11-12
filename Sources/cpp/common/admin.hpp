#ifndef admin_hpp
#define admin_hpp

#include <string>

class Admin {
  static const char* filename;
  static const char* lockname;
  std::string username;
  std::string password;
  std::string auth_token;
public:
  Admin();
  std::string getToken() const {return auth_token;}
  bool checkCredentials(const std::string& user, const std::string& pass);
  bool checkCredentials(const std::string& auth);
};


#endif
