#include "projects.hpp"
#include <sstream>
#include <fstream>
#include "../rapidjson/document.h"
#include "filelock.hpp"
#include "rooms.hpp"
#include "utils.hpp"
using namespace std;
using namespace rapidjson;

const char* Projects::filename = "/home/mbernste/JudgeEval/Config/projects.txt";
const char* Projects::lockname = "/home/mbernste/JudgeEval/Config/projects.lock";

Value Project::json(Document& doc) const {
  Value project(kObjectType);
  Value id_json(id.c_str(), doc.GetAllocator());
  project.AddMember("id", id_json, doc.GetAllocator());
  Value name_json(name.c_str(), doc.GetAllocator());
  project.AddMember("name", name_json, doc.GetAllocator());
  Value members_json(members.c_str(), doc.GetAllocator());
  project.AddMember("members", members_json, doc.GetAllocator());
  Value description_json(description.c_str(), doc.GetAllocator());
  project.AddMember("description", description_json, doc.GetAllocator());
  project.AddMember("time", this->time, doc.GetAllocator());
  return project;
}

istream& operator>>(istream& i, Project& proj){
  string s;
  getline(i, s);
  istringstream ss(s);
  if(!ss) {return i;}
  if(!getline( ss, proj.id, ',' )) {return i;}
  if(!ss) {return i;}
  if(!getline( ss, proj.name, ',' )) {return i;}
  if(!ss) {return i;}
  if(!getline( ss, proj.description, ',' )) {return i;}
  if(!ss) {return i;}
  if(!getline( ss, proj.room_id, ',' )) {return i;}
  if(!ss) {return i;}
  ss >> proj.time;
  ss.get();
  if(!ss) {return i;}
  if(!getline(ss, proj.members, '\n')) {return i;}
  return i;
}

ostream& operator<<(ostream& o, const Project& proj){
  o << proj.id << "," << proj.name << "," << proj.description << ",";
  o << proj.room_id << "," << proj.time << "," << proj.members << endl;
  return o;
}

ostream& operator<<(ostream& o, const Projects& projects){
  o << "Projects: " << endl;
  vector<Project>::const_iterator it;
  for(it = projects.data.cbegin(); it != projects.data.cend(); it++){
    o << "-------------------------------------" << endl;
    o << *it << endl;
  }
  return o;
}

void Projects::store(){
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

void Projects::load(){
  data.clear();
  ifstream infile;
  infile.open(filename);
  if(infile.fail()){
    cerr << "Opening projects for rd failed.";
    exit(0);
  }
  while(!infile.eof()){
    Project record;
    infile >> record;
    data.push_back(record);
  }
  data.pop_back();
}

Projects::Projects(){
  FileReadLock lock(lockname);
  load();
}

bool Projects::find(std::string projectId, Project& project) {
  for(size_t i = 0; i < data.size(); i++){
    if(data[i].getId() == projectId) {
      project = data[i];
      return true;
    }
  }
  return false;
}

vector<Project> Projects::find(const Room& room){
  vector<Project> v;
  for(size_t i = 0; i < data.size(); i++){
    if(data[i].getRoomId() == room.getId()){
      v.push_back(data[i]);
    }
  }
  return v;
}

bool Projects::update(std::string projectId, const rapidjson::Value& changeObject){
  FileWriteLock lock(lockname);
  load();
  for(size_t i = 0; i < data.size(); i++){
    if(data[i].getId() == projectId){
      if(changeObject.HasMember("name")) {
        data[i].name = changeObject["name"].GetString();
        store();
        return true;
      } else if(changeObject.HasMember("members")) {
        data[i].members = changeObject["members"].GetString();
        store();
        return true;
      } else if(changeObject.HasMember("description")) {
        data[i].description = changeObject["description"].GetString();
        store();
        return true;
      } else if(changeObject.HasMember("room_id")) {
        data[i].room_id = changeObject["room_id"].GetString();
        store();
        return true;
      } else if(changeObject.HasMember("time")){
        data[i].time = changeObject["time"].GetInt();
        store();
        return true;
      } else {
        return false;
      }
    }
  }
  return false;
}

void Projects::addProject(const rapidjson::Value& newProject) {
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
      Project new_project;
      new_project.id = new_id;
      for(Value::ConstMemberIterator it = newProject.MemberBegin(); it != newProject.MemberEnd(); it++){
        string name = it->name.GetString();
        if(name == "name"){
          new_project.name = it->value.GetString();
        } else if (name == "members"){
          new_project.members = it->value.GetString();
        } else if (name == "description"){
          new_project.description = it->value.GetString();
        } else if (name == "room_id"){
          new_project.room_id = it->value.GetString();
        } else if (name == "time"){
          new_project.time = it->value.GetInt();
        }
      }
      data.push_back(new_project);
      cout << (*this) << endl;
      store();
      return;
    }
  }
}
