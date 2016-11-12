#include "filelock.hpp"
#include <sys/types.h>
#include <sys/stat.h>
#include <sys/file.h>
#include <iostream>
#include <fcntl.h>
#include <unistd.h>
using namespace std;
FileReadLock::FileReadLock(const char* lockname){
  fd = open(lockname, O_RDWR);
  flock(fd, LOCK_SH);
}

FileReadLock::~FileReadLock(){
  flock(fd, LOCK_UN);
  close(fd);
}

FileWriteLock::FileWriteLock(const char* lockname){
  fd = open(lockname, O_CREAT|O_WRONLY|O_TRUNC);
  flock(fd, LOCK_EX);
}

FileWriteLock::~FileWriteLock(){
  flock(fd, LOCK_UN);
  close(fd);
}
