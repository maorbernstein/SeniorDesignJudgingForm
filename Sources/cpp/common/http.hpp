#ifndef html_hpp
#define html_hpp

#include <string>

#define toJSON(str) StringRef(str.c_str())

std::string getPostedString();

std::string getAuthString();

#endif
