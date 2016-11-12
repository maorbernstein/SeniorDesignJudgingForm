#include <iostream>
#include <string>
#include <unistd.h>
#include "common/judges.hpp"
#include "common/rooms.hpp"
#include "common/projects.hpp"
#include "common/evalstates.hpp"
#include "common/evaluation.hpp"
#include "common/http.hpp"
#include "common/errors.hpp"
using namespace std;
using namespace rapidjson;

int main(){
  Document in, out;
  Judges judges;
  Judge judge;
  Projects projects;
  Project project;
  in.Parse(getPostedString().c_str());
  out.Parse("{}");
  string judgeId = getAuthString();
  string projectId = in["id"].GetString();
  if (!judges.find(judgeId, judge)) {
    throwInvalidAuth();
  } else if (!projects.find(projectId, project)) {
    out.AddMember("status", -2, out.GetAllocator());
    out.AddMember("error", "invalid project id", out.GetAllocator());
    sendResponse(out);
  } else if (project.getRoomId() != judge.getRoomId() ) {
    out.AddMember("status", -3, out.GetAllocator());
    out.AddMember("error", "mismatched project_id and judge_id", out.GetAllocator());
    sendResponse(out);
  } else {
    EvaluationStates states;
    EvalState state = states.find(judge, project);
    if(state == EvalState::NOT_STARTED) {
      out.AddMember("status", -4, out.GetAllocator());
      out.AddMember("error","not started", out.GetAllocator());
      sendResponse(out);
    } else if (state == EvalState::DONE) {
      out.AddMember("status", -5, out.GetAllocator());
      out.AddMember("error","already submitted", out.GetAllocator());
      sendResponse(out);
    }
    Evaluation e(judge, project);
    if(!e.complete()){
      out.AddMember("status", -6, out.GetAllocator());
      out.AddMember("error","incomplete", out.GetAllocator());
      sendResponse(out);
    } else {
      states.markComplete(judge, project);
      sendDefaultResponse();
    }
  }
}
