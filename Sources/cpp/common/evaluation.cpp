#include "evaluation.hpp"
#include <fstream>
#include <sstream>
#include <iostream>
#include <string>
#include <sys/stat.h>
#include "filelock.hpp"
#include "judges.hpp"
#include "projects.hpp"
using namespace std;
using namespace rapidjson;

const string prefix = "Eval/";
const char separator = ',';

const char* integerFieldNames[NUM_INTEGER_FIELDS] = {
  "tech", "creativity", "analytical_work",
  "design_process", "complexity", "completion", "tests",
  "response_qa", "organization", "time", "visual_aids", "poise"
};

const char* booleanFieldNames[NUM_BOOLEAN_FIELDS] = {
  "economic", "environmental", "sustainability", "manufacturability", "ethical",
  "health", "social", "political"
};

const char* commentFieldName = "comment";

ostream& operator<<(ostream& o, const Evaluation& e) {
  o << "Evaluation: " << endl;
  for(size_t i = 0; i < NUM_INTEGER_FIELDS; i++){
    o << integerFieldNames[i] << ": " << e.integerFields[i] << endl;
  }
  for(size_t i = 0; i < NUM_BOOLEAN_FIELDS; i++){
    o << booleanFieldNames[i] << ": " << e.booleanFields[i] << endl;
  }
  o << commentFieldName << ": " << e.comment << endl;
  return o;
}

bool Evaluation::complete() const {
  for(size_t i = 0; i < NUM_INTEGER_FIELDS; i++){
    if(integerFields[i] == 0){
      return false;
    }
  }
  return true;
}

int Evaluation::computeScore() const {
  int score = 0;
  for(size_t i = 0; i < NUM_INTEGER_FIELDS; i++){
    if(integerFields[i] != -1){ // only throw away N/A terms
      score += integerFields[i];
    }
  }
  return score;
}

void Evaluation::store() {
  string s;
  ofstream file(prefix + filename + ".txt");
  for(size_t i = 0; i < NUM_INTEGER_FIELDS; i++){
    file << integerFieldNames[i] << separator << integerFields[i] << endl;
  }
  for(size_t i = 0; i < NUM_BOOLEAN_FIELDS; i++){
    file << booleanFieldNames[i] << separator;
    if(booleanFields[i]){
      file << "true" << endl;
    } else {
      file << "false" << endl;
    }
  }
  file << commentFieldName << separator << comment << endl;
}

void Evaluation::load() {
  string s;
  string fileFullName = prefix + filename + ".txt";
  fstream file(fileFullName);
  chmod(fileFullName.c_str(), S_IRUSR | S_IWUSR);
  while(file){
    string type, value;
    getline(file, s);
    istringstream ss(s);
    getline(ss, type, separator);
    for(size_t i = 0; i < NUM_INTEGER_FIELDS; i++){
      if(type == integerFieldNames[i]){
        ss >> integerFields[i];
        break;
      }
    }
    for(size_t i = 0; i < NUM_BOOLEAN_FIELDS; i++){
      if(type == booleanFieldNames[i]){
        string tmp;
        ss >> tmp;
        booleanFields[i] = (tmp == "true");
      }
    }
    if (type == commentFieldName) {
      getline(ss, comment);
    }
  }
}

Value Evaluation::json(Document& doc) const {
  Value eval(kObjectType);
  for(size_t i = 0; i < NUM_INTEGER_FIELDS; i++) {
    if(integerFields[i] != 0){
      eval.AddMember(StringRef(integerFieldNames[i]), integerFields[i], doc.GetAllocator());
    }
  }
  for(size_t i = 0; i < NUM_BOOLEAN_FIELDS; i++) {
    eval.AddMember(StringRef(booleanFieldNames[i]), booleanFields[i], doc.GetAllocator());
  }
  Value comment_json(comment.c_str(), doc.GetAllocator());
  eval.AddMember(StringRef(commentFieldName), comment_json, doc.GetAllocator());
  return eval;
}

Evaluation::Evaluation(const Judge& judge, const Project& project) {
  filename = judge.getId() + "_" + project.getId();
  for(size_t i = 0; i < NUM_INTEGER_FIELDS; i++){
    integerFields[i] = 0;
  }
  for(size_t i = 0; i < NUM_BOOLEAN_FIELDS; i++){
    booleanFields[i] = false;
  }
  comment = "";
  FileReadLock((prefix + filename + ".lock").c_str());
  load();
}

bool Evaluation::updateField(rapidjson::Value& changeObject) {
  // integer fields
  for(size_t i = 0; i < NUM_INTEGER_FIELDS; i++) {
    if(changeObject.HasMember(integerFieldNames[i])) {
      FileWriteLock((prefix + filename + ".lock").c_str());
      load();
      integerFields[i] = changeObject[integerFieldNames[i]].GetInt();
      store();
      return true;
    }
  }
  // boolean fields
  for(size_t i = 0; i < NUM_BOOLEAN_FIELDS; i++) {
    if(changeObject.HasMember(booleanFieldNames[i])) {
      FileWriteLock((prefix + filename + ".lock").c_str());
      load();
      booleanFields[i] = changeObject[booleanFieldNames[i]].GetBool();
      store();
      return true;
    }
  }
  // comment field
  if(changeObject.HasMember(commentFieldName)){
    FileWriteLock((prefix + filename + ".lock").c_str());
    load();
    comment = changeObject[commentFieldName].GetString();
    store();
    return true;
  }
  return false;
}
