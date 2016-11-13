#ifndef admin_hpp
#define admin_hpp

#include <string>

class Admin {
  static const char* filename;
  static const char* lockname;
  std::string username;
  std::string password;
  std::string auth_token;
  std::string email_address;
  bool reset_token_valid;
  std::string reset_token;
  void load();
  void store();
public:
  Admin();
  std::string getEmail() const {return email_address;}
  std::string getToken() const {return auth_token;}
  bool checkCredentials(const std::string& user, const std::string& pass, std::string& token);
  bool checkCredentials(const std::string& auth);
  std::string requestPasswordReset();
  bool resetPassword(const std::string& reset_token, const std::string& new_password);
};


#endif
