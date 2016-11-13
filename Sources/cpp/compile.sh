#! /bin/bash
COMMON_LIBS="common/admin.cpp common/errors.cpp common/evalstates.cpp common/evaluation.cpp common/filelock.cpp common/http.cpp common/judges.cpp common/projects.cpp common/rooms.cpp common/utils.cpp"
g++ -std=c++0x -g -I ./ -o admin_auth.cgi admin_auth.cpp $COMMON_LIBS
g++ -std=c++0x -g -I ./ -o admin_reset_password.cgi admin_reset_password.cpp $COMMON_LIBS
g++ -std=c++0x -g -I ./ -o admin_forgot_password.cgi admin_forgot_password.cpp $COMMON_LIBS
g++ -std=c++0x -g -I ./ -o admin_create.cgi admin_create.cpp $COMMON_LIBS
g++ -std=c++0x -g -I ./ -o admin_judges_info.cgi admin_judges_info.cpp $COMMON_LIBS
g++ -std=c++0x -g -I ./ -o admin_judges_update.cgi admin_judges_update.cpp $COMMON_LIBS
g++ -std=c++0x -g -I ./ -o admin_overview.cgi admin_overview.cpp $COMMON_LIBS
g++ -std=c++0x -g -I ./ -o admin_projects_info.cgi admin_projects_info.cpp $COMMON_LIBS
g++ -std=c++0x -g -I ./ -o admin_projects_update.cgi admin_projects_update.cpp $COMMON_LIBS
g++ -std=c++0x -g -I ./ -o admin_rooms_info.cgi admin_rooms_info.cpp $COMMON_LIBS
g++ -std=c++0x -g -I ./ -o admin_rooms_update.cgi admin_rooms_update.cpp $COMMON_LIBS
g++ -std=c++0x -g -I ./ -o admin_projects_update.cgi admin_projects_update.cpp $COMMON_LIBS
g++ -std=c++0x -g -I ./ -o judge_auth.cgi judge_auth.cpp $COMMON_LIBS
g++ -std=c++0x -g -I ./ -o judge_info.cgi judge_info.cpp $COMMON_LIBS
g++ -std=c++0x -g -I ./ -o judge_update.cgi judge_update.cpp $COMMON_LIBS
g++ -std=c++0x -g -I ./ -o judge_submit.cgi judge_submit.cpp $COMMON_LIBS
mv *.cgi /webpages/mbernste/cgi-bin/
