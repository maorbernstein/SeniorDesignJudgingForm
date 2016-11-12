#include "utils.hpp"
#include <string>
#include <cstdlib>
#include <sys/time.h>
using namespace std;

const string VALID_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

#define NUM_VALID_CHARS VALID_CHARS.length()

#define SHORT_LENGTH 6
#define LONG_LENGTH 12

class Generator {
public:
  Generator();
  string getId(unsigned int);
};

Generator generator;

Generator::Generator() {
  struct timeval currTime;
  gettimeofday(&currTime, NULL);
  srand(currTime.tv_sec*1000000 + currTime.tv_usec);
}

string Generator::getId(unsigned int length){
  string id;
  for(unsigned int i = 0; i < length; i++){
    int index = rand() % NUM_VALID_CHARS;
    id += VALID_CHARS[index];
  }
  return id;
}

string generateRandomID() {
  return generator.getId(SHORT_LENGTH);
}

string generateLongRandomID() {
  return generator.getId(LONG_LENGTH);
}
