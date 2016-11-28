#/bin/bash
function compile(){
  COMMON_LIBS="cpp/common/admin.cpp cpp/common/errors.cpp cpp/common/evalstates.cpp cpp/common/evaluation.cpp cpp/common/filelock.cpp cpp/common/http.cpp cpp/common/judges.cpp cpp/common/projects.cpp cpp/common/rooms.cpp cpp/common/utils.cpp"
  g++ -std=c++0x -Wall -g -I ./ -o cgi-bin/admin_auth.cgi cpp/admin_auth.cpp $COMMON_LIBS
  g++ -std=c++0x -Wall -g -I ./ -o cgi-bin/admin_reset_password.cgi cpp/admin_reset_password.cpp $COMMON_LIBS
  g++ -std=c++0x -Wall -g -I ./ -o cgi-bin/admin_forgot_password.cgi cpp/admin_forgot_password.cpp $COMMON_LIBS
  g++ -std=c++0x -Wall -g -I ./ -o cgi-bin/admin_create.cgi cpp/admin_create.cpp $COMMON_LIBS
  g++ -std=c++0x -Wall -g -I ./ -o cgi-bin/admin_judges_info.cgi cpp/admin_judges_info.cpp $COMMON_LIBS
  g++ -std=c++0x -Wall -g -I ./ -o cgi-bin/admin_judges_update.cgi cpp/admin_judges_update.cpp $COMMON_LIBS
  g++ -std=c++0x -Wall -g -I ./ -o cgi-bin/admin_overview.cgi cpp/admin_overview.cpp $COMMON_LIBS
  g++ -std=c++0x -Wall -g -I ./ -o cgi-bin/admin_projects_info.cgi cpp/admin_projects_info.cpp $COMMON_LIBS
  g++ -std=c++0x -Wall -g -I ./ -o cgi-bin/admin_projects_update.cgi cpp/admin_projects_update.cpp $COMMON_LIBS
  g++ -std=c++0x -Wall -g -I ./ -o cgi-bin/admin_projects_update.cgi cpp/admin_projects_update.cpp $COMMON_LIBS
  g++ -std=c++0x -Wall -g -I ./ -o cgi-bin/admin_rooms_update.cgi cpp/admin_rooms_update.cpp $COMMON_LIBS
  g++ -std=c++0x -Wall -g -I ./ -o cgi-bin/admin_rooms_info.cgi cpp/admin_rooms_info.cpp $COMMON_LIBS
  g++ -std=c++0x -Wall -g -I ./ -o cgi-bin/judge_auth.cgi cpp/judge_auth.cpp $COMMON_LIBS
  g++ -std=c++0x -Wall -g -I ./ -o cgi-bin/judge_update.cgi cpp/judge_update.cpp $COMMON_LIBS
  g++ -std=c++0x -Wall -g -I ./ -o cgi-bin/judge_info.cgi cpp/judge_info.cpp $COMMON_LIBS
  g++ -std=c++0x -Wall -g -I ./ -o cgi-bin/judge_submit.cgi cpp/judge_submit.cpp $COMMON_LIBS
  g++ -std=c++0x -Wall -g -I ./ -o cgi-bin/admin_remove_judge.cgi cpp/admin_remove_judge.cpp $COMMON_LIBS
  g++ -std=c++0x -Wall -g -I ./ -o cgi-bin/admin_remove_project.cgi cpp/admin_remove_project.cpp $COMMON_LIBS
  g++ -std=c++0x -Wall -g -I ./ -o cgi-bin/admin_remove_room.cgi cpp/admin_remove_room.cpp $COMMON_LIBS
}

function setupAdmin(){
  echo "Setup Admin"
  read -p "Admin username (default: admin):" username
  if [ "$username" = "" ]; then
    username="admin"
  fi

  read -p "Admin password (default: password):" password
  if [ "$password" = "" ]; then
    password="password"
  fi

  read -p "Admin email (default: nmatsunaga@scu.edu):" email
  if [ "$email" = "" ]; then
    email="nmatsunaga@scu.edu"
  fi

  token=$(hexdump -n 3 -v -e '/1 "%02X"' /dev/urandom)
  reset_token=$(hexdump -n 6 -v -e '/1 "%02X"' /dev/urandom)

  cat > cgi-bin/Config/admin.txt <<-EOF
$username,$password,$token,$email,$reset_token
EOF
}

echo "Untarring the Tarball"
tarname=judgeEval.tar.gz
tar -xzvf $tarname
rm $tarname
echo "Creating cgi-bin directory"
mkdir cgi-bin
mv Sources/cpp cpp
echo "Begun compilation - this may takes a while..."
compile
rm -r cpp
echo "Compilation complete, creating schema directories"
mv Config cgi-bin/Config
mkdir cgi-bin/Eval
mv Sources/static/* ./
setupAdmin
echo "Configuring permissions"
chmod 600 cgi-bin/Config/*
chmod 700 cgi-bin/*.cgi
chmod 755 cgi-bin
chmod 666 *.svg
chmod 666 *.html
chmod 666 *.js
chmod 666 *.css
rm -r Sources
echo "Complete"
