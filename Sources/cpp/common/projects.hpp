#ifndef projects_hpp
#define projects_hpp

#include <vector>
#include <string>
#include <iostream>
#include "../rapidjson/document.h"

class Room;
class Projects;

class Project {
  friend class Projects;
  std::string id;
  std::string name;
  std::string members;
  std::string description;
  std::string room_id;
  u_int32_t time;
public:
  rapidjson::Value json(rapidjson::Document&) const;
  std::string getId() const {return id;}
  std::string getName() const {return name;}
  std::string getRoomId() const {return room_id;}
  friend std::istream& operator>>(std::istream& i, Project& j);
  friend std::ostream& operator<<(std::ostream& o, const Project& j);
};

class Projects {
  static const char* filename;
  static const char* lockname;
  std::vector<Project> data;
  void load();
  void store();
public:
  typedef std::vector<Project>::const_iterator iterator;
  Projects();
  iterator begin() const {return data.cbegin();}
  iterator end() const {return data.cend();}
  bool find(std::string projectId, Project& project);
  bool update(std::string projectId, const rapidjson::Value& change);
  void addProject(const rapidjson::Value& newProject);
  std::vector<Project> find(const Room& room);
  friend std::ostream& operator<<(std::ostream& o, const Projects& j);
};

#endif
