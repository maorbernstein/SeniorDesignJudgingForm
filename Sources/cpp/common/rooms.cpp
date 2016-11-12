#include "rooms.hpp"
#include <string>
#include <sstream>
#include <fstream>
#include "filelock.hpp"
#include "utils.hpp"
#include "../rapidjson/document.h"
using namespace std;
using namespace rapidjson;
const char* Rooms::filename = "/home/mbernste/JudgeEval/Config/rooms.txt";
const char* Rooms::lockname = "/home/mbernste/JudgeEval/Config/rooms.lock";

istream& operator>>(istream& i, Room& room){
  string s;
  getline(i, s);
  istringstream ss(s);
  if(!ss) {return i;}
  if(!getline( ss, room.name, ',' )) {return i;}
  if(!ss) {return i;}
  if(!getline( ss, room.abv, ',' )) {return i;}
  if(!ss) {return i;}
  if(!getline( ss, room.id, ',' )) {return i;}
  if(!ss) {return i;}
  return i;
}

ostream& operator<<(ostream& o, const Room& room){
  o << room.name << "," << room.abv << "," << room.id << endl;
  return o;
}

ostream& operator<<(ostream& o, const Rooms& rooms){
  o << "Rooms: " << endl;
  vector<Room>::const_iterator it;
  for(it = rooms.data.cbegin(); it != rooms.data.cend(); it++){
    o << *it << endl;
  }
  return o;
}

void Rooms::store() {
  ofstream outfile;
  outfile.open(filename);
  if(outfile.fail()){
    cout << "Opening rooms file for wt failed.";
    exit(0);
  }
  for(size_t i = 0; i < data.size(); i++){
    outfile << data[i];
  }
}

void Rooms::load() {
  data.clear();
  ifstream infile;
  infile.open(filename);
  if(infile.fail()){
    cout << "Opening rooms file for rd failed.";
    exit(0);
  }
  while(!infile.eof()){
    Room record;
    infile >> record;
    data.push_back(record);
  }
  data.pop_back();
}

Rooms::Rooms(){
  FileReadLock lock(lockname);
  load();
}

bool Rooms::find(const string& id, Room& room){
  vector<Room>::iterator it;
  for(it = data.begin(); it != data.end(); it++){
    if(id == it->id){
      room = *it;
      return true;
    }
  }
  return false;
}

bool Rooms::update(const string& id, const Value& changeObject) {
  FileWriteLock lock(lockname);
  load();
  vector<Room>::iterator it;
  for(it = data.begin(); it != data.end(); it++){
    if(id == it->id){
      if(changeObject.HasMember("name")){
        it->name = changeObject["name"].GetString();
        store();
        return true;
      } else if(changeObject.HasMember("name_abv")){
        it->abv = changeObject["name_abv"].GetString();
        store();
        return true;
      } else {
        return false;
      }
    }
  }
  return false;
}

void Rooms::addRoom(const rapidjson::Value& newRoom) {
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
      Room new_room;
      new_room.id = new_id;
      for(Value::ConstMemberIterator it = newRoom.MemberBegin(); it != newRoom.MemberEnd(); it++){
        string name = it->name.GetString();
        if(name == "name"){
          new_room.name = it->value.GetString();
        } else if (name == "name_abv"){
          new_room.abv = it->value.GetString();
        }
      }
      data.push_back(new_room);
      store();
      return;
    }
  }
}
