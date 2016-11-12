#ifndef file_lock_hpp
#define file_lock_hpp

class FileReadLock {
  int fd;
public:
  FileReadLock(const char* lockname);
  ~FileReadLock();
  FileReadLock(const FileReadLock&) = delete;
  FileReadLock& operator=(const FileReadLock&) = delete;
};

class FileWriteLock {
  int fd;
public:
  FileWriteLock(const char* lockname);
  ~FileWriteLock();
  FileWriteLock(const FileWriteLock&) = delete;
  FileWriteLock& operator=(const FileWriteLock&) = delete;
};

#endif
