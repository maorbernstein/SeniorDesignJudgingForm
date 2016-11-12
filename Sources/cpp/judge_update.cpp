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
  in.Parse(getPostedString().c_str());
  out.Parse("{}");
  string judgeId = getAuthString();
  string projectId = in["id"].GetString();
  Value change = in["change"].GetObject();
  if (!judges.find(judgeId, judge)) {
    throwInvalidAuth();
  }
  Projects projects;
  Project project;
  EvaluationStates states;
  if(!projects.find(projectId, project)){
    out.AddMember("status", -2, out.GetAllocator());
    out.AddMember("error", "invalid project id", out.GetAllocator());
    sendResponse(out);
  } else if (project.getRoomId() != judge.getRoomId()){
    out.AddMember("status", -3, out.GetAllocator());
    out.AddMember("error", "mismatched project_id and judge_id", out.GetAllocator());
    sendResponse(out);
  } else {
    EvalState state = states.find(judge, project);
    if(state == EvalState::DONE){
      out.AddMember("status", -4, out.GetAllocator());
      out.AddMember("error", "cannot update submitted evaluation", out.GetAllocator());
      sendResponse(out);
    }
    if(state == EvalState::NOT_STARTED) {
      states.newEvaluation(judge, project);
    }
    Evaluation e(judge, project);
    if(e.updateField(change)){
      sendDefaultResponse();
    } else {
      out.AddMember("status", -4, out.GetAllocator());
      out.AddMember("error", "unsupported change operation", out.GetAllocator());
      sendResponse(out);
    }
  }
}
