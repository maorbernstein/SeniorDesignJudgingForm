#ifndef rooms_hpp
#define rooms_hpp

#include <vector>
#include <string>
#include <iostream>
#include "../rapidjson/document.h"
class Rooms;

class Room {
  friend class Rooms;
  std::string name;
  std::string abv;
  std::string id;
public:
  std::string getName() const {return name;}
  std::string getAbv() const {return abv;}
  std::string getId() const {return id;}
  friend std::istream& operator>>(std::istream& i, Room& j);
  friend std::ostream& operator<<(std::ostream& o, const Room& j);
};

class Rooms {
  static const char* filename;
  static const char* lockname;
  std::vector<Room> data;
  void load();
  void store();
public:
  Rooms();
  typedef std::vector<Room>::const_iterator iterator;
  iterator begin() const {return data.cbegin();}
  iterator end() const {return data.cend();}
  bool remove(const std::string& id);
  bool find(const std::string& id, Room& room);
  bool update(const std::string& id, const rapidjson::Value& change);
  void addRoom(const rapidjson::Value& newRoom);
  friend std::ostream& operator<<(std::ostream& o, const Rooms& j);
};

#endif
