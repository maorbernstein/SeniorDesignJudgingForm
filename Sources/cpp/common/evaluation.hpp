#ifndef evaluation_hpp
#define evaluation_hpp

#include <string>
#include <ostream>
#include "../rapidjson/document.h"

#define NUM_INTEGER_FIELDS 12
#define NUM_BOOLEAN_FIELDS 8

class Judge;
class Project;

class Evaluation {
  std::string filename;
  int integerFields[NUM_INTEGER_FIELDS];
  bool booleanFields[NUM_BOOLEAN_FIELDS];
  std::string comment;
  void load();
  void store();
public:
  Evaluation(const Judge& judge, const Project& project);
  bool complete() const;
  int computeScore() const;
  rapidjson::Value json(rapidjson::Document&) const;
  bool updateField(rapidjson::Value& changeObject);
  friend std::ostream& operator<<(std::ostream& o, const Evaluation& e);
};

#endif
