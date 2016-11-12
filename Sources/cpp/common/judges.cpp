#include "judges.hpp"
#include <fstream>
#include <iostream>
#include <sstream>
#include <unistd.h>
#include "filelock.hpp"
#include "rooms.hpp"
#include "utils.hpp"
#include "../rapidjson/document.h"
using namespace std;
using namespace rapidjson;
const char* Judges::filename = "/home/mbernste/JudgeEval/Config/judges.txt";
const char* Judges::lockname = "/home/mbernste/JudgeEval/Config/judges.lock";

istream& operator>>(istream& i, Judge& judge){
  string s;
  getline(i, s);
  istringstream ss(s);
  if(!ss) {return i;}
  if(!getline( ss, judge.name, ',' )) {return i;}
  if(!ss) {return i;}
  if(!getline( ss, judge.id, ',' )) {return i;}
  if(!ss) {return i;}
  if(!getline( ss, judge.room_id, ',' )) {return i;}
  return i;
}

ostream& operator<<(ostream& o, const Judge& judge){
  o << judge.name << "," << judge.id << "," << judge.room_id << endl;
  return o;
}

ostream& operator<<(ostream& o, const Judges& judges){
  o << "Judges: " << endl;
  vector<Judge>::const_iterator it;
  for(it = judges.data.cbegin(); it != judges.data.cend(); it++){
    o << *it << endl;
  }
  return o;
}

void Judges::load() {
  data.clear();
  ifstream infile;
  infile.open(filename);
  if(infile.fail()){
    cout << "Opening judges file failed.";
    exit(0);
  }
  while(!infile.eof()){
    Judge record;
    infile >> record;
    data.push_back(record);
  }
  data.pop_back();
}

void Judges::store(){
  ofstream outfile;
  outfile.open(filename);
  if(outfile.fail()){
    cerr << "Opening projects for wt failed.";
    exit(0);
  }
  for(size_t i = 0; i < data.size(); i++){
    outfile << data[i];
  }
}

Judges::Judges(){
  FileReadLock lock(lockname);
  load();
}

vector<Judge> Judges::find(const Room& room) {
  vector<Judge> assignedJudges;
  for(vector<Judge>::iterator it = data.begin(); it != data.end(); it++){
    if(it->room_id == room.getId()){
      assignedJudges.push_back(*it);
    }
  }
  return assignedJudges;
}

bool Judges::find(const string& id, Judge& judge){
  vector<Judge>::iterator it;
  for(it = data.begin(); it != data.end(); it++){
    if(id == it->id){
      judge = *it;
      return true;
    }
  }
  return false;
}

bool Judges::update(const string& id, const Value &changeObject) {
  FileWriteLock lock(lockname);
  load();
  for(vector<Judge>::iterator it = data.begin(); it != data.end(); it++){
    if(id == it->id){
      if(changeObject.HasMember("name")) {
        it->name = changeObject["name"].GetString();
        store();
        return true;
      } else if(changeObject.HasMember("room_id")) {
        it->room_id = changeObject["room_id"].GetString();
        store();
        return true;
      } else {
        return false;
      }
    }
  }
  return false;
}

void Judges::addJudge(const rapidjson::Value& newJudge) {
  FileWriteLock lock(lockname);
  load();
  while(true){
    string new_id = generateRandomID();
    bool new_id_present = false;
    for(size_t i = 0; i < data.size(); i++){
      if(data[i].getId() == new_id){
        new_id_present = true;
        break;
      }
    }
    if(!new_id_present){
      Judge new_judge;
      new_judge.id = new_id;
      for(Value::ConstMemberIterator it = newJudge.MemberBegin(); it != newJudge.MemberEnd(); it++){
        string name = it->name.GetString();
        if(name == "name"){
          new_judge.name = it->value.GetString();
        } else if (name == "room_id"){
          new_judge.room_id = it->value.GetString();
        }
      }
      data.push_back(new_judge);
      store();
      return;
    }
  }
}
