#ifndef utils_hpp
#define utils_hpp

#include <string>

std::string generateRandomID();
std::string generateLongRandomID();
bool sendEmail(const std::string& destination, const std::string& subject, const std::string& message);

#endif
