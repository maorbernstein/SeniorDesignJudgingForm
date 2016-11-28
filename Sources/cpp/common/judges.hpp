#ifndef judges_hpp
#define judges_hpp

#include <vector>
#include <string>
#include <iostream>
#include "../rapidjson/document.h"
class Room;

class Judge {
  friend class Judges;
  std::string name;
  std::string id;
  std::string room_id;
  std::string subtitle;
public:
  rapidjson::Value json(rapidjson::Document&) const;
  std::string getFullName() const {return name;}
  std::string getSubtitle() const {return subtitle;}
  std::string getId() const {return id;}
  std::string getRoomId() const {return room_id;}
  friend std::istream& operator>>(std::istream& i, Judge& j);
  friend std::ostream& operator<<(std::ostream& o, const Judge& j);
};

class Judges {
  static const char* filename;
  static const char* lockname;
  std::vector<Judge> data;
  void load();
  void store();
public:
  Judges();
  typedef std::vector<Judge>::const_iterator iterator;
  iterator begin() const {return data.cbegin();}
  iterator end() const {return data.cend();}
  std::vector<Judge> find(const Room& room);
  bool remove(const std::string& id);
  bool find(const std::string& id, Judge& judge);
  bool update(const std::string& id, const rapidjson::Value& changeObject);
  void addJudge(const rapidjson::Value& newJudge);
  friend std::ostream& operator<<(std::ostream& o, const Judges& j);
};

#endif
