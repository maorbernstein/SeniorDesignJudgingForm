#include "evalstates.hpp"
#include <fstream>
#include <iostream>
#include <sstream>
#include <unistd.h>
#include "filelock.hpp"
#include "judges.hpp"
#include "projects.hpp"
using namespace std;

const char* EvaluationStates::filename = "/home/mbernste/JudgeEval/Config/evalstates.txt";
const char* EvaluationStates::lockname = "/home/mbernste/JudgeEval/Config/evalstates.lock";
const char separator = ',';

istream& operator>>(istream& i, EvaluationState& evalstate){
  string s, tmp;
  getline(i, s);
  istringstream ss(s);
  if(!ss) {return i;}
  if(!getline( ss, evalstate.judge_id, separator )) {return i;}
  if(!ss) {return i;}
  if(!getline( ss, evalstate.project_id, separator )) {return i;}
  if(!ss) {return i;}
  ss >> tmp;
  if(tmp == "completed"){
    evalstate.state = EvalState::DONE;
  } else {
    evalstate.state = EvalState::STARTED;
  }
  return i;
}

ostream& operator<<(ostream& o, const EvaluationState& evalstate){
  o << "Evaluation w/ Judge " << evalstate.judge_id;
  o << ", w/ Project " << evalstate.project_id << " is in state: ";
  if(evalstate.state == EvalState::DONE){
    o << "completed." << endl;
  } else {
    o << "begun." << endl;
  }
  return o;
}

std::ostream& operator<<(std::ostream& o, const EvaluationStates& states) {
  o << "Evaluations: " << endl;
  for(vector<EvaluationState>::const_iterator it = states.data.cbegin(); it != states.data.cend(); it++){
    o << *it << endl;
  }
  return o;
}

void EvaluationStates::load(){
  data.clear();
  ifstream infile;
  infile.open(filename);
  if(infile.fail()){
    cout << "Opening file failed.";
    exit(0);
  }
  while(!infile.eof()){
    EvaluationState record;
    infile >> record;
    data.push_back(record);
  }
  data.pop_back();
}

void EvaluationStates::store(){
  ofstream file(filename);
  if(file.fail()){
    cout << "Opening evalstates file failed.";
    exit(0);
  }
  for(size_t i = 0; i < data.size(); i++){
    file << data[i].judge_id << separator << data[i].project_id << separator;
    if(data[i].state == EvalState::DONE){
      file << "completed" << endl;
    } else {
      file << "incomplete" << endl;
    }
  }
}

EvaluationStates::EvaluationStates() {
  FileReadLock lock(lockname);
  load();
}

void EvaluationStates::markComplete(const Judge& judge, const Project& project){
  FileWriteLock lock(lockname);
  load();
  for(size_t i = 0; i < data.size(); i++){
    if( (data[i].project_id == project.getId()) && (data[i].judge_id == judge.getId()) ){
      data[i].state = EvalState::DONE;
      break;
    }
  }
  store();
}

void EvaluationStates::newEvaluation(const Judge& judge, const Project& project){
  FileWriteLock lock(lockname);
  load();
  EvaluationState e;
  e.project_id = project.getId();
  e.judge_id = judge.getId();
  e.state = EvalState::STARTED;
  data.push_back(e);
  store();
}

EvalState EvaluationStates::find(const Judge& judge, const Project& project) {
  for(size_t i = 0; i < data.size(); i++){
    if( (data[i].project_id == project.getId()) && (data[i].judge_id == judge.getId()) ){
      return data[i].state;
    }
  }
  return EvalState::NOT_STARTED;
}
