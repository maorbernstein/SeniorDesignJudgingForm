#ifndef evalstates_hpp
#define evalstates_hpp

#include <vector>
#include <string>
#include <iostream>

enum class EvalState {
  NOT_STARTED,
  STARTED,
  DONE
};

class Project;
class Judge;
class EvaluationStates;

class EvaluationState {
  friend class EvaluationStates;
  std::string judge_id;
  std::string project_id;
  EvalState state;
public:
  friend std::istream& operator>>(std::istream& i, EvaluationState& j);
  friend std::ostream& operator<<(std::ostream& o, const EvaluationState& j);
};

class EvaluationStates {
  static const char* filename;
  static const char* lockname;
  std::vector<EvaluationState> data;
  void load();
  void store();
public:
  EvaluationStates();
  void markComplete(const Judge& judge, const Project& project);
  void newEvaluation(const Judge& judge, const Project& project);
  EvalState find(const Judge& judge, const Project& project);
  friend std::ostream& operator<<(std::ostream& o, const EvaluationStates& j);
};

#endif
