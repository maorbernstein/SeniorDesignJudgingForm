#ifndef errors_hpp
#define errors_hpp

#include "../rapidjson/document.h"

void sendResponse(rapidjson::Document& out);
void sendDefaultResponse();
void throwInvalidAuth();

#endif
