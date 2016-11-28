function Core() {
    var self = this;
    self.baseURL = 'cgi-bin'
}

Core.prototype.initialize = function() {
    var self = this;
    if(Cookies.get('token') !== undefined) {
        $('#sign-in').remove();
        self.token = Cookies.get('token');
        self.loadInfo();
    } else {
        self.showSignIn();
    }

    $('#import-data').click(function(){
        self.importData();
    });

    $('#sign-out').click(function(){
        self.signOut();
    });
}

Core.prototype.authorize = function(username, password) {
    username = username.toLowerCase();
    var self = this;

    var data = {
        username: username,
        password: password
    };
    var dataPayload = JSON.stringify(data);
    var fullURL = self.baseURL + '/admin_auth.cgi';

    $.ajax({
      url: fullURL,
      type: 'POST',
      dataType: 'json',
      data: dataPayload
    }).done((data, status) => {
        if (status == 'success') {
            var response = data;
            if (response && response.status == 0) {
                Cookies.set('token', response.token);
                $('#sign-in').remove();
                self.token = response.token;
                self.loadInfo();
                return;
            }
        }
        alert('An error occurred. Please make sure you entered correct username and password.');
    }).fail((resp) => {
        alert('An error occurred.');
    });
}

Core.prototype._loadJudges = function(initial, callback) {
	var self = this;
    self._submitRequest('/admin_judges_info.cgi', (error, data) => {
        if (!error && data.judges != undefined) {
            self.judges = data.judges.sort((a, b) => {
                var keyA = a.name,
                    keyB = b.name;

                if (keyA < keyB) return -1;
                if (keyA > keyB) return 1;
                return 0;
            });

            self.judges_map = {};
            for (var index in self.judges) {
                var judge = self.judges[index];
                self.judges_map[judge.id] = judge;
            }

            if (initial) {
	            self.updateUI();
            }

            if (callback) {
	            callback();
            }
        } else {
            self.signOut();
        }
    });
}

Core.prototype._addUnassignedRoom = function() {
	var self = this;

	var room = {
		name: '###Core Unassigned Room',
		name_abv: '###CUR'
	}

	self.addItems(undefined, [room], undefined, () => {
		self._loadRooms(false);
	});
}

Core.prototype._loadRooms = function(initial, callback) {
	var self = this;

	self._submitRequest('/admin_rooms_info.cgi', (error, data) => {
        if (!error && data.rooms != undefined) {
            self.rooms = data.rooms.sort((a, b) => {
                var keyA = a.name,
                    keyB = b.name;

                if (keyA < keyB) return -1;
                if (keyA > keyB) return 1;
                return 0;
            });

            var unassignedRoomIndex = undefined;

            self.rooms_map = {};
            for (var index in self.rooms) {
                var room = self.rooms[index];

                if (room.name == '###Core Unassigned Room') {
	                unassignedRoomIndex = index;
	                self.unassignedRoomId = room.room_id;

	                continue;
                }

                self.rooms_map[room.room_id] = room;
            }

            self.rooms.splice(unassignedRoomIndex, 1);

            if (initial) {
	            self.updateUI();
            }

            if (callback) {
	            callback();
            }
        } else {
            self.signOut();
        }
    });
}

Core.prototype._loadProjects = function(initial, callback) {
	var self = this;

	self._submitRequest('/admin_projects_info.cgi', (error, data) => {
        if (!error && data.projects != undefined) {
            self.projects = data.projects.sort((a, b) => {
                var keyA = a.name,
                    keyB = b.name;

                if (keyA < keyB) return -1;
                if (keyA > keyB) return 1;
                return 0;
            });

            self.projects_map = {};
            for (var index in self.projects) {
                var project = self.projects[index];
                self.projects_map[project.id] = project;

                var evals = {};
                for (var e_index in project.evaluations) {
                    var evaluation = project.evaluations[e_index];
                    evals[evaluation.judge_id] = evaluation;
                }

                project.evaluations = evals;
                var projectTime = moment.unix(project.time);
                project.time = projectTime.format('h:mma');
                project.moment = projectTime;
            }

            if (initial) {
	            self.updateUI();
            }

            if (callback) {
	            callback();
            }
        } else {
            self.signOut();
        }
    });
}

Core.prototype._loadOverview = function(initial, callback) {
	var self = this;

    self._submitRequest('/admin_overview.cgi', (error, data) => {
        if (!error && data.rooms != undefined) {
            self.overview = data.rooms.sort((a, b) => {
                var keyA = a.name,
                    keyB = b.name;

                if (keyA < keyB) return -1;
                if (keyA > keyB) return 1;
                return 0;
            });

            var unassignedRoomIndex = undefined;

            for (var index in self.overview) {
                var room = self.overview[index];

                if (room.name == '###Core Unassigned Room') {
	                unassignedRoomIndex = index;
	                break;
                }
                self.rooms_map[room.room_id] = room;
            }

            self.overview.splice(unassignedRoomIndex, 1);

            if (initial) {
	            self.updateUI();
            }

            if (callback) {
	            callback();
            }
        } else {
            self.signOut();
        }
    });
}

Core.prototype.loadInfo = function() {
    var self = this;

    self._loadOverview(true);
    self._loadProjects(true);
    self._loadRooms(true);
    self._loadJudges(true);
}

Core.prototype.addItems = function(projects, rooms, judges, callback) {
	var self = this;

	if (!projects) {
		projects = [];
	}

	if (!rooms) {
		rooms = [];
	}

	if (!judges) {
		judges = [];
	}

	var request = {
		projects: projects,
		judges: judges,
		rooms: rooms
	};

	self._submitRequest('/admin_create.cgi', request, (error, data) => {
        if (callback) {
	        if (error) {
		        callback(error);
	        } else {
		        callback(undefined, data);
	        }
        }
    });
}

Core.prototype.requestServerProjectUpdate = function(id, key, value, callback) {
	var self = this;

	var changes = {};
	changes[key] = value;

	var request = {
		id: id,
		change: changes
	};

	self._submitRequest('/admin_projects_update.cgi', request, (error, data) => {
        if (callback) {
	        if (error) {
		        callback(error);
	        } else {
		        callback(undefined, data);
	        }
        }
    });
}

Core.prototype.requestServerJudgeDeletion = function(id, callback) {
	var self = this;

	var request = {
		id: id
	};

	self._submitRequest('/admin_remove_judge.cgi', request, (error, data) => {
        if (callback) {
	        if (error) {
		        callback(error);
	        } else {
		        callback(undefined, data);
	        }
        }
    });
}

Core.prototype.requestServerResetPassword = function(callback) {
	var self = this;

	self._submitRequest('/admin_forgot_password.cgi', (error, data) => {
        if (callback) {
	        if (error) {
		        callback(error);
	        } else {
		        callback(undefined, data);
	        }
        }
    });
}

Core.prototype.requestServerUpdatePassword = function(token, password, callback) {
	var self = this;
	
	var request = {
		reset_token: token,
		password: password
	};
	
	self._submitRequest('/admin_reset_password.cgi', request, (error, data) => {
        if (callback) {
	        if (error) {
		        callback(error);
	        } else {
		        callback(undefined, data);
	        }
        }
    });
}

Core.prototype.requestServerProjectDeletion = function(id, callback) {
	var self = this;
	
	var request = {
		id: id
	};
	
	self._submitRequest('/admin_remove_project.cgi', request, (error, data) => {
        if (callback) {
	        if (error) {
		        callback(error);
	        } else {
		        callback(undefined, data);
	        }
        }
    });
}

Core.prototype.requestServerRoomDeletion = function(id, callback) {
	var self = this;
	
	var request = {
		id: id
	};
	
	self._submitRequest('/admin_remove_room.cgi', request, (error, data) => {
        if (callback) {
	        if (error) {
		        callback(error);
	        } else {
		        callback(undefined, data);
	        }
        }
    });
}

Core.prototype.requestServerJudgeUpdate = function(id, key, value, callback) {
	var self = this;
	
	var changes = {};
	changes[key] = value;
	
	var request = {
		id: id,
		change: changes
	};
	
	self._submitRequest('/admin_judges_update.cgi', request, (error, data) => {
        if (callback) {
	        if (error) {
		        callback(error);
	        } else {
		        callback(undefined, data);
	        }
        }
    });
}

Core.prototype.updateUI = function() {
    var self = this;
    
    if (!self.overview || !self.projects || !self.rooms || !self.judges) {
        return;
    }
    
    if (!self.unassignedRoomId) {
	    self._addUnassignedRoom();
    }
    
    self.displayOverview();
}

Core.prototype._generateRoomCell = function(cellId, name, subtitle) {
    var cellContent = '<div id="'+cellId+'" class="sec-table-cell">' +
        '<div class="sec-table-cell-main-text">' +
            '<span>'+name+'</span>' +
        '</div>' +
        '<div class="sec-table-cell-sec-text">' +
            '<span>'+subtitle+'</span>' +
        '</div>' +
    '</div>';
    return cellContent;
}

Core.prototype._basicRoomsContent = function() {
    var viewContent = '<div id="sec-nav" class="left-column" style="left: 230px; width: 320px; top: 0px; bottom: 0px; overflow: hidden;">' +
            '<div class="section header">' +
                '<label>Rooms</label>' +
            '</div>' +
            '<div id="room-add-button" class="icon add-icon" style="position: absolute; top: 12px; right: 20px;">' +
            '</div>' +
            '<div id="section-table" class="section table-view" style="left: 0px; top:55px; bottom: 0px; right: 0px; overflow-y: auto;">' +
            '</div>' +
        '</div>' +
        '<div id="content" class="content-container" style="left: 550px; right: 0px; top: 0px; bottom: 0px; overflow: hidden;">' +
            '<div id="room-delete-button" class="content button" style="position: absolute; top: 3px; left: 20px;">' +
                'Delete' +
            '</div>' +
            '<div class="section content-view" style="left: 1px; top:55px; bottom: 0px; right: 0px; overflow-y: auto;">' +
                '<div id="main-title" class="content title">' +
                    '<span></span>' +
                '</div>' +
                '<div id="main-subtitle" class="content subtitle">' +
                    '<span></span>' +
                '</div>' +
                '<div class="content table-view" style="left: 36px; top: 86px;">' +
                    '<div class="header">' +
                        '<header>PROJECTS</header>' +
                    '</div>' +
                    '<div class="cc-tv-separator"></div>' +
                    '<div id="content-projects">' +
                    '</div>' +
                '</div>' +
                '<div class="content table-view" style="left: 36px; top: 120px;">' +
                    '<div class="header">' +
                        '<header>JUDGES</header>' +
                        '<div style="position: absolute; right: 60px; top: -4px;float: right;">' +
                            '<button id="add-judge">Add Judge</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="cc-tv-separator"></div>' +
                    '<div id="content-judges">' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    
    return viewContent;
}

Core.prototype.displayAddRoomView = function() {
	var self = this;
	
	var content = '<div id="add-room-overlay" class="overlay" style="left: 0px; right: 0px; top: 0px; bottom: 0px;">' +
        '<div class="modal-popup" style="margin-top: -116px; margin-left: -200px; left: 50%; width: 400px; top: 50%; height: 233px;">' +
            '<div class="modal-popup-title">' +
                'New Room' +
            '</div>' +
            '<div class="stack-view">' +
                '<div id="new-room-name" class="modal-popup-input-item non-last">' +
                    '<input id="input-room-name" type="text" class="text-input" placeholder="Room Name">' +
                '</div>' +
                '<div id="room-abv-cell" class="modal-popup-input-item non-last">' +
                    '<input id="input-room-abv" type="text" class="text-input" placeholder="Room Abv">' +
                '</div>' +
                '<div style="position:absolute;left: 0px;right: 0px;height: 52px;bottom: 0px;">' +
	                '<div id="confirm-cancel-button" class="content button" style="position: absolute;left: 8px;bottom: 12px;display: flex;justify-content: center;align-items: center;width: 75px;height: 30px;font-size: 20px;">' +
                    	'Cancel' +
                    '</div>' +
                    '<div id="confirm-add-button" class="content button" style="position: absolute;right: 4px;bottom: 12px;display: flex;justify-content: center;align-items: center;width: 75px;height: 30px;font-size: 20px;font-weight:500;">' +
                    	'Add' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>' +
    '</div>';
    
    $('body').append(content);
    $('#confirm-cancel-button').click(function(){
	    $('#add-room-overlay').remove();
    });
    $('#confirm-add-button').click(function(){
	    var roomName = $('#input-room-name').val();
        var roomAbv = $('#input-room-abv').val();
        
        if (!roomName) {
	        alert('Room name needed.');
            return;
        }
        
        if (!roomAbv) {
	        alert('Room abbreviation needed.');
            return;
        }
        
        var newRoom = {
	        name: roomName,
	        name_abv: roomAbv
        };
        
        self.addItems(undefined, [newRoom], undefined, (error, data) => {
	        if (!error && data.status === 0) {
		        self._loadRooms(false, () => {
	    	        $('#add-room-overlay').remove();
	    	        self.displayRooms();
		        });
	        }
        });
    });
}

Core.prototype.displayRooms = function() {
    var self = this;
    
    $('#sidebar-overview').removeClass('highlighted');
    $('#sidebar-projects').removeClass('highlighted');
    $('#sidebar-rooms').addClass('highlighted');
    $('#sidebar-judges').removeClass('highlighted');
    
    $('#primary-content').html(self._basicRoomsContent());
    
    $('#room-add-button').click(function() {
	    self.displayAddRoomView();
    });
    
    $('#add-judge').click(function() {
	    var roomId = self.selectedRoom.room_id;
	    self.displayAddJudgeView(roomId, () => {
		    self._loadProjects(false);
		    self._loadOverview(false);
		    self._loadJudges(false);
		    self._loadRooms(false, () => {
			    self.displayRooms();
		    });
	    });
    })
    
    $('#room-delete-button').click(function() {
	    if (self.selectedRoom) {
		    self.requestServerRoomDeletion(self.selectedRoom.room_id, (error, data) => {
			    if (!error && data.status == 0) {
				    self.selectedRoom = undefined;
				    
				    self._loadOverview(false);
				    self._loadJudges(false);
				    self._loadProjects(false);
				    self._loadRooms(false, () => {
					    self.displayRooms();
				    });
			    } else {
				    if (data.status == -2) {
					    alert('Cannot remove room that associated with projects or judges.')
				    } else {
    				    alert(data.error);
				    }
			    }
		    });
	    }
    });
    
    if (self.selectedRoom) {
	    self.lastSelectedRoomId = self.selectedRoom.room_id;
	    if (!self.rooms_map[self.lastSelectedRoomId]) {
		    self.lastSelectedRoomId = undefined;
	    }
    }
    
    self.selectedRoom = undefined;
    
    for(var index in self.rooms) {
        var room = self.rooms[index];
        var cellId = 'room-' + index;
        
        var roomSubtitle = room.projects.length + ' Projects, ' + room.judges.length + ' Judges';
        
        var cellContent = self._generateRoomCell(cellId, room.name, roomSubtitle);
        $('#section-table').append(cellContent);
        
        $('#' + cellId).click(function() {
            var roomIndex = $(this).closest('div').attr('id').substring(5);
            var selectedRoom = self.rooms[roomIndex];
            self.didSelectRoom(selectedRoom);
            
            $(".sec-table-cell").each(function() {
                $(this).removeClass('highlighted');
            });
            $(this).closest('div').addClass('highlighted');
        });
        
        if (!self.selectedRoom) {
	        if (self.lastSelectedRoomId && room.room_id != self.lastSelectedRoomId) {
		        continue;
	        }
	        
            self.didSelectRoom(room);
            
            $(".sec-table-cell").each(function() {
                $(this).removeClass('highlighted');
            });
            $('#'+cellId).addClass('highlighted');
        }
    }
}

Core.prototype._generateRoomProjectCell = function(teamName, teamMembers, teamTime) {
    var cellContent = '<div id="cell" class="cc-table-cell">' +
            '<div class="cc-table-cell-main-text">' +
                '<span>' + teamName + '</span>' +
            '</div>' +
            '<div class="cc-table-cell-sec-text">' +
                '<span>' + teamMembers + '</span>' +
            '</div>' +
            '<div class="cc-table-cell-sec-text">' +
                '<span>' + teamTime + '</span>' +
            '</div>' +
        '</div>';
    return cellContent;
}

Core.prototype._updateRoomProjects = function() {
    var self = this;
    $('#content-projects').html('');
    
    for(var index in self.selectedRoom.projects) {
        var projectId = self.selectedRoom.projects[index];
        var project = self.projects_map[projectId];
        if (!project) {
            continue;
        }
        
        var cellContent = self._generateRoomProjectCell(project.name, project.members, project.time);
        $('#content-projects').append(cellContent);
    }
}

Core.prototype._generateRoomJudgeCell = function(judgeName, judgeStatus) {
    var cellContent = '<div id="cell" class="cc-table-cell">' +
            '<div class="cc-table-cell-main-text">' +
                '<span>' + judgeName + '</span>' +
            '</div>' +
            '<div class="cc-table-cell-sec-text">' +
                '<span>' + judgeStatus + '</span>' +
            '</div>' +
        '</div>';
    return cellContent;
}

Core.prototype._updateRoomJudges = function() {
    var self = this;
    $('#content-judges').html('');
    
    for(var index in self.selectedRoom.judges) {
        var judgeId = self.selectedRoom.judges[index];
        var judge = self.judges_map[judgeId];
        if (!judge) {
            continue;
        }
        
        var cellContent = self._generateRoomJudgeCell(judge.name, 'Judge');
        $('#content-judges').append(cellContent);
    }
}

Core.prototype.didSelectRoom = function(room) {
    var self = this;
    if (!room) {
        return;
    }
    
    self.selectedRoom = room;
    $('#main-title span').html(room.name);
    $('#main-subtitle span').html(room.name_abv);
    
    self._updateRoomProjects();
    self._updateRoomJudges();
}

Core.prototype._basicJudgesContent = function() {
    var viewContent = '<div id="sec-nav" class="left-column" style="left: 230px; width: 320px; top: 0px; bottom: 0px; overflow: hidden;">' +
            '<div class="section header">' +
                '<label>Judges</label>' +
            '</div>' +
            '<div id="judge-add-button" class="icon add-icon" style="position: absolute; top: 12px; right: 20px;">' +
            '</div>' +
            '<div id="section-table" class="section table-view" style="left: 0px; top:55px; bottom: 0px; right: 0px; overflow-y: auto;">' +
            '</div>' +
        '</div>' +
        '<div id="content" class="content-container" style="left: 550px; right: 0px; top: 0px; bottom: 0px; overflow: hidden;">' +
            '<div id="judge-delete-button" class="content button" style="position: absolute; top: 3px; left: 20px;">' +
                'Delete' +
            '</div>' +
            '<div id="judge-generate-infocards" class="content button" style="position: absolute; top: 3px; right: 20px;">' +
                'Generate Information Cards' +
            '</div>' +
            '<div class="section content-view" style="left: 1px; top:55px; bottom: 0px; right: 0px; overflow-y: auto;">' +
                '<div id="main-title" class="content title">' +
                    '<span></span>' +
                '</div>' +
                '<div id="main-subtitle" class="content subtitle">' +
                    '<span></span>' +
                '</div>' +
                '<div class="content table-view" style="left: 36px; top: 86px;">' +
                    '<div class="header">' +
                        '<header>ROOM</header>' +
                    '</div>' +
                    '<div class="cc-tv-separator"></div>' +
                    '<div id="content-room">' +
                    '</div>' +
                    '<div class="cc-tv-separator" style="position: relative; top: -3px;"></div>' +
                '</div>' +
                '<div class="content table-view" style="left: 36px; top: 120px;">' +
                    '<div class="header">' +
                        '<header>EVALUATIONS</header>' +
                    '</div>' +
                    '<div class="cc-tv-separator"></div>' +
                    '<div id="content-evaluations">' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    
    return viewContent;
}

Core.prototype._generateJudgeCell = function(cellId, judgeName, subtitle) {
    var cellContent = '<div id="'+cellId+'" class="sec-table-cell">' +
        '<div class="sec-table-cell-main-text">' +
            '<span>'+judgeName+'</span>' +
        '</div>' +
        '<div class="sec-table-cell-sec-text">' +
            '<span>'+subtitle+'</span>' +
        '</div>' +
    '</div>';
    return cellContent;
}

Core.prototype.displayAddJudgeView = function(room_id, callback) {
	var self = this;
	
	if (!self.unassignedRoomId) {
		self._addUnassignedRoom();
	}
	
	var content = '<div id="add-judge-overlay" class="overlay" style="left: 0px; right: 0px; top: 0px; bottom: 0px;">' +
        '<div class="modal-popup" style="margin-top: -116px; margin-left: -200px; left: 50%; width: 400px; top: 50%; height: 233px;">' +
            '<div class="modal-popup-title">' +
                'New Judge' +
            '</div>' +
            '<div class="stack-view">' +
                '<div id="new-judge-name" class="modal-popup-input-item non-last">' +
                    '<input id="input-judge-name" type="text" class="text-input" placeholder="Judge Name">' +
                '</div>' +
                '<div id="judge-title-cell" class="modal-popup-input-item non-last">' +
                    '<input id="input-judge-title" type="text" class="text-input" placeholder="Judge Title">' +
                '</div>' +
                '<div style="position:absolute;left: 0px;right: 0px;height: 52px;bottom: 0px;">' +
	                '<div id="confirm-cancel-button" class="content button" style="position: absolute;left: 8px;bottom: 12px;display: flex;justify-content: center;align-items: center;width: 75px;height: 30px;font-size: 20px;">' +
                    	'Cancel' +
                    '</div>' +
                    '<div id="confirm-add-button" class="content button" style="position: absolute;right: 4px;bottom: 12px;display: flex;justify-content: center;align-items: center;width: 75px;height: 30px;font-size: 20px;font-weight:500;">' +
                    	'Add' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>' +
    '</div>';
    
    $('body').append(content);
    $('#confirm-cancel-button').click(function(){
	    $('#add-judge-overlay').remove();
    });
    $('#confirm-add-button').click(function(){
	    if (!self.unassignedRoomId) {
		    alert('An error occurred. Cannot add judge right now. Please try again later.');
		    $('#add-judge-overlay').remove();
		    return;
	    }
	    
	    var judgeName = $('#input-judge-name').val();
        var judgeTitle = $('#input-judge-title').val();
        
        if (!judgeName) {
	        alert('Judge name needed.');
            return;
        }
        
        if (!judgeTitle) {
	        alert('Judge title needed.');
            return;
        }
        
        var targetRoomId = self.unassignedRoomId;
        
        if (room_id) {
	        targetRoomId = room_id;
        }
        
        var newJudge = {
	        name: judgeName,
	        subtitle: judgeTitle,
	        room_id: targetRoomId
        };
        
        self.addItems(undefined, undefined, [newJudge], (error, data) => {
	        if (!error && data.status === 0) {
		        self._loadJudges(false, () => {
			        if (callback) {
				    	$('#add-judge-overlay').remove();
				    	callback();
			        } else {
				        $('#add-judge-overlay').remove();
		    	        self.displayJudges();
			        }
		        });
	        }
        });
    });
}

Core.prototype.displayJudges = function() {
    var self = this;
    
    $('#sidebar-overview').removeClass('highlighted');
    $('#sidebar-projects').removeClass('highlighted');
    $('#sidebar-rooms').removeClass('highlighted');
    $('#sidebar-judges').addClass('highlighted');
    
    $('#primary-content').html(self._basicJudgesContent());
    
    if (self.selectedJudge) {
	    self.lastSelectedJudgeId = self.selectedJudge.id;
	    if (!self.judges_map[self.lastSelectedJudgeId]) {
		    self.lastSelectedJudgeId = undefined;
	    }
    }
    
    self.selectedJudge = undefined;
    
    $('#judge-add-button').click(function() {
	    self.displayAddJudgeView();
    });
    
    $('#judge-delete-button').click(function() {
	    if (self.selectedJudge) {
		    self.requestServerJudgeDeletion(self.selectedJudge.id, (error, data) => {
			    if (!error && data.status == 0) {
				    self.selectedJudge = undefined;
				    
				    self._loadOverview(false);
				    self._loadProjects(false);
				    self._loadRooms(false);
				    self._loadJudges(false, () => {
					    self.displayJudges();
				    });
			    }
		    });
	    }
    });
    
    $('#judge-generate-infocards').click(function() {
	    var judgesInfo = 'name,title,judge_id,room\n';
	    
	    for (var index in self.judges) {
		    var judge = self.judges[index];
		    judgesInfo += judge.name + ',' + judge.subtitle + ',' + judge.id + ',';
		    var room = self.rooms_map[judge.room_id];
		    if (room) {
			    judgesInfo += room.name + '\n';
		    } else {
			    judgesInfo += 'Unassigned' + '\n';
		    }
	    }
	    
	    var filename = 'judges_info.csv';
	    var blob = new Blob([judgesInfo], {type: "text/plain;charset=utf-8"});
	    saveAs(blob, filename);
    });
        
    for(var index in self.judges) {
        var judge = self.judges[index];
        var cellId = 'judge-' + index;
        
        var roomTitle = "Unassigned";
        if (self.rooms_map[judge.room_id]) {
	        roomTitle = self.rooms_map[judge.room_id].name_abv;
        }
        
        var cellContent = self._generateJudgeCell(cellId, judge.name, roomTitle);
        $('#section-table').append(cellContent);
        
        $('#' + cellId).click(function() {
            var judgeIndex = $(this).closest('div').attr('id').substring(6);
            var selectedJudge = self.judges[judgeIndex];
            self.didSelectJudge(selectedJudge);
            
            $(".sec-table-cell").each(function() {
                $(this).removeClass('highlighted');
            });
            $(this).closest('div').addClass('highlighted');
        });
        
        if (!self.selectedJudge) {
	        if (self.lastSelectedJudgeId && judge.id != self.lastSelectedJudgeId) {
		        continue;
	        }
	        
            self.didSelectJudge(judge);
            
            $(".sec-table-cell").each(function() {
                $(this).removeClass('highlighted');
            });
            $('#'+cellId).addClass('highlighted');
        }
    }
}

Core.prototype.didSelectJudge = function(judge) {
    var self = this;
    if (!judge) {
        return;
    }
    
    self.selectedJudge = judge;
    $('#main-title span').html(judge.name);
    $('#main-subtitle span').html(judge.subtitle + ' | ' + judge.id);
    
    self._updateJudgeRoom();
    self._updateJudgeEvaluations();
}

Core.prototype._generateJudgeRoomCell = function(roomName, roomSessions) {
    var cellContent = '<div id="cell" class="cc-table-cell">' +
            '<div class="cc-table-cell-main-text">' +
                '<span>' + roomName + '</span>' +
            '</div>' +
            '<div class="cc-table-cell-sec-text">' +
                '<span>' + roomSessions + ' Sessions</span>' +
            '</div>' +
            '<div style="position: absolute; right: 60px; top: 45px;float: right;">' +
                '<button id="update-room">Modify</button>' +
            '</div>' +
        '</div>';
    return cellContent;
}

Core.prototype.displayJudgeUpdateRoomView = function() {
	var self = this;
	
	var content = '<div id="update-judge-room-overlay" class="overlay" style="left: 0px; right: 0px; top: 0px; bottom: 0px;">' +
        '<div class="modal-popup" style="margin-top: -81px; margin-left: -145px; left: 50%; width: 290px; top: 50%; height: 162px;">' +
            '<div class="modal-popup-title">' +
                'Update Room' +
            '</div>' +
            '<div class="stack-view">' +
                '<div id="room-selection" class="modal-popup-selector non-last">' +
                    '<select id="judge-update-room-select">';
                    	for (var index in self.rooms) {
	                    	var room = self.rooms[index];
	                    	content += '<option value="'+room.room_id+'">'+ room.name +'</option>';
                    	}
        content += '</select>' +
                '</div>' +
                '<div style="position:absolute;left: 0px;right: 0px;height: 52px;bottom: 0px;">' +
	                '<div id="confirm-cancel-button" class="content button" style="position: absolute;left: 8px;bottom: 12px;display: flex;justify-content: center;align-items: center;width: 75px;height: 30px;font-size: 20px;">' +
                    	'Cancel' +
                    '</div>' +
                    '<div id="confirm-update-button" class="content button" style="position: absolute;right: 8px;bottom: 12px;display: flex;justify-content: center;align-items: center;width: 75px;height: 30px;font-size: 20px;font-weight:500;">' +
                    	'Update' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>' +
    '</div>';
    
    $('body').append(content);
    
    $('#judge-update-room-select').val(self.selectedJudge.room_id);
    
    $('#confirm-cancel-button').click(function(){
	    $('#update-judge-room-overlay').remove();
    });
    
    $('#confirm-update-button').click(function(){
	    var selectedRoomId = $('#judge-update-room-select').val();
	    
	    if (!selectedRoomId || selectedRoomId == self.unassignedRoomId) {
		    alert('You need to select a room for the judge.');
		    return;
	    }
	    
	    self.requestServerJudgeUpdate(self.selectedJudge.id, 'room_id', selectedRoomId, (error,data) => {
		    if (!error && data.status == 0) {
			    self._loadRooms(false);
			    self._loadProjects(false);
			    self._loadOverview(false);
			    self._loadJudges(false, () => {
				    self.displayJudges();
    			    $('#update-judge-room-overlay').remove();
			    });
		    }
	    });
    })
}

Core.prototype._updateJudgeRoom = function() {
    var self = this;
    $('#content-room').html('');
    
    var room = self.rooms_map[self.selectedJudge.room_id];
    if (room) {
	    var title = room.name;
	    var subtitle = room.projects.length;
    } else {
	    var title = 'Unassigned';
	    var subtitle = '0';
    }
    
    var cellContent = self._generateJudgeRoomCell(title, subtitle);
    $('#content-room').append(cellContent);
    
    $('#update-room').click(function() {
	    self.displayJudgeUpdateRoomView();
    });
}

Core.prototype._generateJudgeEvalCell = function(title, subtitle, time, evaluation) {
    var cellContent = '<div id="cell" class="cc-table-cell">' +
            '<div class="cc-table-cell-main-text">' +
                '<span>' + title + '</span>' +
            '</div>' +
            '<div class="cc-table-cell-sec-text">' +
                '<span>' + subtitle + ' Sessions</span>' +
            '</div>' +
            '<div class="cc-table-cell-sec-text">' +
                '<span>' + time + '</span>' +
            '</div>' +
            '<div class="cc-table-cell-score" style="position: relative; width: 120px; right: 30px; top: -45px;float: right;display: flex;justify-content: center;align-items: center;">' +
                '<div>' +
                '<span style="display: table;margin: 0 auto;">Score</span>';
    if (evaluation) {
        if (evaluation.status == 'done') {
            cellContent += '<span style="display: table;margin: 0 auto;">'+evaluation.score+'/60</span>';
        } else if (evaluation.status == 'not started') {
            cellContent += '<span style="display: table;margin: 0 auto;"><font color="#F3B821">Unranked</font></span>'
        } else {
            cellContent += '<span style="display: table;margin: 0 auto;"><font color="#F3B821">'+evaluation.score+'</font>/60</span>'
        }
    } else {
        cellContent += '<span>Unknown</span>';
    }
    cellContent +=  '</div>' +
            '</div>' +
        '</div>';
    return cellContent;
}

Core.prototype._updateJudgeEvaluations = function() {
    var self = this;
    $('#content-evaluations').html('');
    
    if (self.selectedJudge.room_id == self.unassignedRoomId) {
	    return;
    }
    
    for(var index in self.selectedJudge.projects) {
        var projectId = self.selectedJudge.projects[index];
        var project = self.projects_map[projectId];
        if (!project) {
            continue;
        }
        
        var cellContent = self._generateJudgeEvalCell(project.name, project.members, project.time, project.evaluations[self.selectedJudge.id]);
        $('#content-evaluations').append(cellContent);
    }
}

Core.prototype._basicProjectContent = function() {
    var viewContent = '<div id="sec-nav" class="left-column" style="left: 230px; width: 320px; top: 0px; bottom: 0px; overflow: hidden;">' +
            '<div class="section header">' +
                '<label>Projects</label>' +
            '</div>' +
            '<div id="project-add-button" class="icon add-icon" style="position: absolute; top: 12px; right: 20px;">' +
            '</div>' +
            '<div id="section-table" class="section table-view" style="left: 0px; top:55px; bottom: 0px; right: 0px; overflow-y: auto;">' +
            '</div>' +
        '</div>' +
        '<div id="content" class="content-container" style="left: 550px; right: 0px; top: 0px; bottom: 0px; overflow: hidden;">' +
            '<div id="project-delete-button" class="content button" style="position: absolute; top: 3px; left: 20px;">' +
                'Delete' +
            '</div>' +
            '<div id="project-generate-report" class="content button" style="position: absolute; top: 3px; right: 20px;">' +
                'Generate Report' +
            '</div>' +
            '<div class="section content-view" style="left: 1px; top:55px; bottom: 0px; right: 0px; overflow-y: auto;">' +
                '<div id="main-title" class="content title">' +
                    '<span></span>' +
                '</div>' +
                '<div id="main-subtitle" class="content subtitle">' +
                    '<span></span>' +
                '</div>' +
                '<div class="content table-view" style="left: 36px; top: 86px;">' +
                    '<div class="header">' +
                        '<header>DESCRIPTION</header>' +
                    '</div>' +
                    '<div class="cc-tv-separator"></div>' +
                    '<div id="content-desc">' +
                    '</div>' +
                    '<div class="cc-tv-separator" style="position: relative; top: -3px;"></div>' +
                '</div>' +
                '<div class="content table-view" style="left: 36px; top: 120px;">' +
                    '<div class="header">' +
                        '<header>ROOM & TIME</header>' +
                    '</div>' +
                    '<div class="cc-tv-separator"></div>' +
                    '<div id="content-room">' +
                    '</div>' +
                    '<div class="cc-tv-separator" style="position: relative; top: -3px;"></div>' +
                '</div>' +
                '<div class="content table-view" style="left: 36px; top: 160px;">' +
                    '<div class="header">' +
                        '<header>EVALUATIONS</header>' +
                    '</div>' +
                    '<div class="cc-tv-separator"></div>' +
                    '<div id="content-evaluations">' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    
    return viewContent;
}

Core.prototype._generateProjectCell = function(cellId, projectName, subtitle, extra) {
    var cellContent = '<div id="'+cellId+'" class="sec-table-cell">' +
        '<div class="sec-table-cell-main-text">' +
            '<span>'+projectName+'</span>' +
        '</div>' +
        '<div class="sec-table-cell-sec-text">' +
            '<span>'+subtitle+'</span>' +
        '</div>' +
        '<div class="sec-table-cell-sec-text">' +
            '<span>'+extra+'</span>' +
        '</div>' +
    '</div>';
    return cellContent;
}

Core.prototype._generateDetailReportContent = function(data) {
    var self = this;
    
    var content = '<h1>Detail Report</h1>';
    
    content += '<h2>'+data.name+'</h2>'
    
    for(var index in data.evaluations) {
        var evaluation = data.evaluations[index];
        var judge = self.judges_map[evaluation.judge_id];

        content += '<br><div id="sep-1" class="separator lt-view" style="left: 0px; right: 0px; height: 1px;"></div><h4>'+judge.name+'</h4><div style="width: 75%"><table><tr><th>Item</th><th>Score</th></tr>';
        
        var resolutions = [];
        var comment = undefined;
        
        var numKeys = {
            'tech': 'Technical Accuracy',
            'creativity': 'Creativity and Innovation',
            'analytical_work': 'Supporting Analytical Work',
            'design_process': 'Methodical Design Process Demonstrated',
            'complexity': 'Addresses Project Complexity Appropriately',
            'completion': 'Expectation of Completion',
            'tests': 'Design & Analysis of tests',
            'response_qa': 'Quality of Response during Q&A',
            'organization': 'Organization',
            'time': 'Use of Allotted Time',
            'visual_aids': 'Visual Aids',
            'poise': 'Confidence and Poise'
        };
        
        var resKeys = {
            'economic': 'Economic',
            'environmental': 'Environmental',
            'sustainability': 'Sustainability',
            'manufacturability': 'Manufacturability',
            'ethical': 'Ethical',
            'health': 'Health & Safety',
            'social': 'Social',
            'political': 'Political'
        };
        
        for (var key in evaluation.evaluation) {
            if (key == 'comment') {
                comment = evaluation.evaluation[key];
            } else if (numKeys[key]) {
                var title = numKeys[key];
                var value = evaluation.evaluation[key];
                if (value == -1) {
                    value = 'N/A';
                }
                
                content += '<tr><th>'+title+'</th><th>'+value+'</th></tr>'
            } else if (resKeys[key]) {
                var title = resKeys[key];
                var value = evaluation.evaluation[key];
                if (value) {
                    resolutions.push(title);
                }
            }
        }
                
        content += '</table>';
        
        if (resolutions.length > 0) {
            content += '<h4>Considerations:</h4><span>'+resolutions.join(', ')+'</span>';
        }
        
        if (comment) {
            content += '<h4>Comment:</h4><span>'+comment+'</span>';
        }
        content += '</div>';
    }
    
    content += '<div style="height: 40px;"></div>'
    
    return content;
}

Core.prototype.generateDetailReport = function() {
    var self = this;
    
    var allSubmitted = true;
    
    var project = self.selectedProject;
    if (!project) {
        return;
    }
    
    for (var key in project) {
        var evaluation = project[key];
        if (evaluation.status != 'done') {
            allSubmitted = false;
            break;
        }
    }
    
    if (!allSubmitted) {
        $('body').append(self._generateReportPartialContent());
    
        $('#generate-confirm').click(function() {
            $('#report-type-overlay').remove();
            var w = window.open("");
            $(w.document.head).append(self._generateReportStyle());
            $(w.document.body).html(self._generateDetailReportContent(project));
        });
        
        $('#generate-deny').click(function() {
            $('#report-type-overlay').remove();
        });
        
        $('#report-type-overlay').click(function() {
            $('#report-type-overlay').remove();
        })
    } else {
        var w = window.open("");
        $(w.document.head).append(self._generateReportStyle());
        $(w.document.body).html(self._generateDetailReportContent());
    }
}

Core.prototype.displayProjectUpdateRoomView = function() {
	var self = this;
	var updating = false;
	
	var content = '<div id="update-project-room-overlay" class="overlay" style="left: 0px; right: 0px; top: 0px; bottom: 0px;">' +
        '<div class="modal-popup" style="margin-top: -116px; margin-left: -200px; left: 50%; width: 400px; top: 50%; height: 233px;">' +
            '<div class="modal-popup-title">' +
                'Update Room' +
            '</div>' +
            '<div class="stack-view">' +
                '<div id="room-selection" class="modal-popup-selector non-last">' +
                    '<select id="project-update-room-select">';
                    	for (var index in self.rooms) {
	                    	var room = self.rooms[index];
	                    	content += '<option value="'+room.room_id+'">'+ room.name +'</option>';
                    	}
        content += '</select>' +
                '</div>' +
                '<div id="room-time" class="modal-popup-input-item non-click non-last">' +
                    '<input id="project-update-time" type="text" class="textfield" placeholder="05/12/16 14:00">' +
                '</div>' +
                '<div style="position:absolute;left: 0px;right: 0px;height: 52px;bottom: 0px;">' +
	                '<div id="confirm-cancel-button" class="content button" style="position: absolute;left: 8px;bottom: 12px;display: flex;justify-content: center;align-items: center;width: 75px;height: 30px;font-size: 20px;">' +
                    	'Cancel' +
                    '</div>' +
                    '<div id="confirm-update-button" class="content button" style="position: absolute;right: 8px;bottom: 12px;display: flex;justify-content: center;align-items: center;width: 75px;height: 30px;font-size: 20px;font-weight:500;">' +
                    	'Update' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>' +
    '</div>';
    
    $('body').append(content);    
    $('#project-update-room-select').val(self.selectedProject.room_id);
    $('#project-update-time').val(self.selectedProject.moment.format('MM/DD/YY HH:mm'));
    
    $('#confirm-cancel-button').click(function(){
	    $('#update-project-room-overlay').remove();
    });
    
    $('#confirm-update-button').click(function(){
	    if (updating) {
		    return;
	    }
	    
	    updating = true;
	    
	    var selectedRoomId = $('#project-update-room-select').val();
	    
	    if (!selectedRoomId || selectedRoomId == self.unassignedRoomId) {
		    alert('You need to select a room for the project.');
		    return;
	    }
	    
	    var enteredTime = $('#project-update-time').val();
	    if (!enteredTime) {
		    alert('You need to enter a time');
		    return;
	    }
	    
	    var parsedTime = moment(enteredTime, 'MM/DD/YY HH:mm');
	    if (!parsedTime) {
		    alert('Failed to parse the time. Please make sure you entered correct time.');
		    return;
	    }
	    
	    $('#confirm-update-button').addClass('disabled');
	    
	    self.requestServerProjectUpdate(self.selectedProject.id, 'room_id', selectedRoomId, (error,data) => {
		    if (!error && data.status == 0) {
			    self.requestServerProjectUpdate(self.selectedProject.id, 'time', parsedTime.unix(), (error, data) => {
				    if (!error && data.status == 0) {
					    self._loadRooms(false);
					    self._loadOverview(false);
					    self._loadJudges(false);
					    self._loadProjects(false, () => {
						    self.displayProjects();
		    			    $('#update-project-room-overlay').remove();
					    });
				    }
			    });
		    }
	    });
    })
}

Core.prototype.displayImportProjectsView = function() {
	var self = this;
	
	if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
		alert('Import projects is not supported in this browser.');
		return;
    }
	
	if (!self.unassignedRoomId) {
		self._addUnassignedRoom();
	}
	
	var content = '<div id="import-projects-overlay" class="overlay" style="left: 0px; right: 0px; top: 0px; bottom: 0px;">' +
        '<div class="modal-popup" style="margin-top: -81px; margin-left: -145px; left: 50%; width: 290px; top: 50%; height: 162px;">' +
            '<div class="modal-popup-title">' +
                'Import Projects' +
            '</div>' +
            '<div class="stack-view">' +
                '<div id="project-file-container" class="modal-popup-file non-last">' +
                	'<label id="import-project-file-label" for="import-project-file" style="text-overflow: ellipsis;height: 100%;width: 100%;overflow: hidden;display: inline-block;">Select File</label>' +
                    '<input id="import-project-file" type="file" name="import-project-file" accept=".csv"/>' +
                '</div>' +
                '<div style="position:absolute;left: 0px;right: 0px;height: 52px;bottom: 0px;">' +
	                '<div id="confirm-cancel-button" class="content button" style="position: absolute;left: 8px;bottom: 12px;display: flex;justify-content: center;align-items: center;width: 75px;height: 30px;font-size: 20px;">' +
                    	'Cancel' +
                    '</div>' +
                    '<div id="confirm-add-button" class="content button disabled" style="position: absolute;right: 4px;bottom: 12px;display: flex;justify-content: center;align-items: center;width: 75px;height: 30px;font-size: 20px;font-weight:500;">' +
                    	'Import' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>' +
    '</div>';
    
    $('body').append(content);
    
    $('#import-project-file').change(function(){
	    $('#confirm-add-button').removeClass('disabled');
	    $('#import-project-file-label').html($('input#import-project-file')[0].files[0].name);
    });
    
    $('#confirm-cancel-button').click(function(){
	    $('#import-projects-overlay').remove();
    });
    $('#confirm-add-button').click(function(){
	    if (!self.unassignedRoomId) {
		    alert('An error occurred. Cannot import projects right now. Please try again later.');
		    $('#import-projects-overlay').remove();
		    return;
	    }
	    
	    var projectFile = $('input#import-project-file')[0].files[0];
        
        if (!projectFile) {
	        alert('Project file needed.');
            return;
        }
        
        var projects = [];
        
        var fr = new FileReader();
		fr.onload = function() {
			var data = fr.result;
			var processedResults = CSVToArray(data);
			for (var index in processedResults) {
				var result = processedResults[index];
				if (result.length < 4) {
					continue;
				}
				
				var project = {};
				project['name'] = result[0];
				project['members'] = result[1];
				project['description'] = result[2];
				project['time'] = moment(result[3], 'MM/DD/YY HH:mm').unix();
				project['room_id'] = self.unassignedRoomId;
				
				projects.push(project);
			}
			
			self.addItems(projects, undefined, undefined, (error, data) => {
		        if (!error && data.status === 0) {
			        self._loadOverview(false);
			        self._loadProjects(false, () => {
				    	$('#import-projects-overlay').remove();
				    	self.displayProjects();
			        });
		        }
	        });
		};
		fr.readAsText(projectFile);
    });
}

Core.prototype.displayProjects = function() {
    var self = this;
    
    $('#sidebar-overview').removeClass('highlighted');
    $('#sidebar-projects').addClass('highlighted');
    $('#sidebar-rooms').removeClass('highlighted');
    $('#sidebar-judges').removeClass('highlighted');
    
    if (self.selectedProject) {
	    self.lastSelectedProjectId = self.selectedProject.id;
	    if (!self.projects_map[self.lastSelectedProjectId]) {
		    self.lastSelectedProjectId = undefined;
	    }
    }
    
    self.selectedProject = undefined;
    
    $('#primary-content').html(self._basicProjectContent());
    
    $('#project-add-button').click(function() {
	    self.displayImportProjectsView();
    });
    
    $('#project-delete-button').click(function() {
	    if (self.selectedProject) {
		    self.requestServerProjectDeletion(self.selectedProject.id, (error, data) => {
			    if (!error && data.status == 0) {
				    self.selectedProject = undefined;
				    
				    self._loadOverview(false);
				    self._loadJudges(false);
				    self._loadRooms(false);
				    self._loadProjects(false, () => {
					    self.displayProjects();
				    });
			    }
		    });
	    }
    });
    
    $('#project-generate-report').click(function() {
        self.generateDetailReport();
    });
    
    for(var index in self.projects) {
        var project = self.projects[index];
        var cellId = 'project-' + index;
        
        var room = self.rooms_map[project.room_id];
        
        var projectSub = 'Unassigned | ' + project.time;
        var projectExtra = '0 Judges';
        
        if (room) {
	        projectSub = room.name_abv + ' | ' + project.time;
	        projectExtra = Object.keys(project.evaluations).length + ' Judges';
        }
        
        var cellContent = self._generateProjectCell(cellId, project.name, projectSub, projectExtra);
        $('#section-table').append(cellContent);
        
        $('#' + cellId).click(function() {
            var projectIndex = $(this).closest('div').attr('id').substring(8);
            var selectedProject = self.projects[projectIndex];
            self.didSelectProject(selectedProject);
            
            $(".sec-table-cell").each(function() {
                $(this).removeClass('highlighted');
            });
            $(this).closest('div').addClass('highlighted');
        });
        
        if (!self.selectedProject) {
	        if (self.lastSelectedProjectId && project.id != self.lastSelectedProjectId) {
		        continue;
	        }
            self.didSelectProject(project);
            
            $(".sec-table-cell").each(function() {
                $(this).removeClass('highlighted');
            });
            $('#'+cellId).addClass('highlighted');
        }
    }
}

Core.prototype._generateProjectDescCell = function(projectDesc) {
    var cellContent = '<div id="cell" class="cc-table-cell" style="margin-right: 40px;">' +
            '<span>'+ projectDesc +'</span>' +
        '</div>';
    return cellContent;
}

Core.prototype._updateProjectDescription = function() {
    var self = this;
    $('#content-desc').html('');
    
    var projectDesc = self.selectedProject.description;
    
    var cellContent = self._generateProjectDescCell(projectDesc);
    $('#content-desc').append(cellContent);
}

Core.prototype._generateProjectRoomCell = function(roomName, time) {
    var cellContent = '<div id="cell" class="cc-table-cell">' +
            '<div class="cc-table-cell-main-text">' +
                '<span>' + roomName + '</span>' +
            '</div>' +
            '<div class="cc-table-cell-sec-text">' +
                '<span>' + time + '</span>' +
            '</div>' +
            '<div style="position: absolute; right: 60px; top: 45px;float: right;">' +
                '<button id="update-room">Modify</button>' +
            '</div>' +
        '</div>';
    return cellContent;
}

Core.prototype._updateProjectRoom = function() {
    var self = this;
    $('#content-room').html('');
    
    var room = self.rooms_map[self.selectedProject.room_id];
    
    var title = 'Unassigned';
    if (room) {
	    title = room.name;
    }
    
    var time = self.selectedProject.time;
    
    var cellContent = self._generateProjectRoomCell(title, time);
    $('#content-room').append(cellContent);
    
    $('#update-room').click(function() {
	    self.displayProjectUpdateRoomView();
    });
}

Core.prototype._generateProjectEvalCell = function(title, subtitle, evaluation) {
    var cellContent = '<div id="cell" class="cc-table-cell">' +
            '<div class="cc-table-cell-main-text">' +
                '<span>' + title + '</span>' +
            '</div>' +
            '<div class="cc-table-cell-sec-text">' +
                '<span>' + subtitle + '</span>' +
            '</div>' +
            '<div class="cc-table-cell-score" style="position: relative; width: 120px; right: 30px; top: -35px;float: right;display: flex;justify-content: center;align-items: center;">' +
                '<div>' +
                '<span style="display: table;margin: 0 auto;">Score</span>';
    if (evaluation) {
        if (evaluation.status == 'done') {
            cellContent += '<span style="display: table;margin: 0 auto;">'+evaluation.score+'/60</span>';
        } else if (evaluation.status == 'not started') {
            cellContent += '<span style="display: table;margin: 0 auto;"><font color="#F3B821">Unranked</font></span>'
        } else {
            cellContent += '<span style="display: table;margin: 0 auto;"><font color="#F3B821">'+evaluation.score+'</font>/60</span>'
        }
    } else {
        cellContent += '<span>Unknown</span>';
    }
    cellContent +=  '</div>' +
            '</div>' +
        '</div>';
    return cellContent;
}

Core.prototype._updateProjectEvals = function() {
    var self = this;
    $('#content-evaluations').html('');
    
    for(var key in self.selectedProject.evaluations) {
        var judge = self.judges_map[key];
        var evaluation = self.selectedProject.evaluations[key];
        
        if (!evaluation || !judge) {
            continue;
        }
        
        var cellContent = self._generateProjectEvalCell(judge.name, judge.subtitle, evaluation);
        $('#content-evaluations').append(cellContent);
    }
}

Core.prototype.didSelectProject = function(project) {
    var self = this;
    if (!project) {
        return;
    }
    
    self.selectedProject = project;
    $('#main-title span').html(project.name);
    $('#main-subtitle span').html(project.members);
    
    self._updateProjectDescription();
    self._updateProjectRoom();
    self._updateProjectEvals();
}

Core.prototype._basicOverviewContent = function() {
    var viewContent = 
        '<div id="content" class="content-container" style="left: 230px; right: 0px; top: 0px; bottom: 0px; overflow: hidden;">' +
            '<div class="content header">' +
            '</div>' +
            '<div class="section content-view" style="left: 1px; top:55px; bottom: 0px; right: 0px; overflow-y: auto;">' +
                '<div id="main-title" class="content title">' +
                    '<span>Overview</span>' +
                '</div>' +
                '<div id="generate-report" class="rounded-button" style="position: relative; right: 40px; top: 0px; float: right; display: flex; justify-content: center; align-items: center;">' +
                    '<span>Generate Report</span>' +
                '</div>' +
                '<div class="content table-view" style="left: 36px; top: 86px;">' +
                    '<div class="header">' +
                        '<header>ROOMS</header>' +
                    '</div>' +
                    '<div class="cc-tv-separator"></div>' +
                    '<div id="content-overview">' +
                    '</div>' +
                    '<div class="cc-tv-separator" style="position: relative; top: -3px;"></div>' +
                '</div>' +
            '</div>' +
        '</div>';
    
    return viewContent;
}

Core.prototype._generateOverviewCell = function(cellId, title, projects) {
    var cellContent = '<div id="'+cellId+'" class="cc-table-cell">' +
            '<div class="cc-table-cell-main-text">' +
                '<span>' + title + '</span>' +
            '</div>' +
            '<div class="cc-table-cell-sec-text">' +
                '<span>' + projects.length + ' Sessions</span>' +
            '</div>' +
            '<div class="cc-table-cell-score" style="position: relative; width: 120px; right: 30px; top: -36px;float: right; display: flex; justify-content: center; align-items: center;">' +
                '<div>' +
                '<span style="display: table;margin: 0 auto;">Status</span>';
    if (projects) {
        var count = 0;
        for (var index in projects) {
            var project = projects[index];
            if (project.status == 'done') {
                count += 1;
            }
        }
        if (count == projects.length) {
            cellContent += '<span style="display: table;margin: 0 auto;"><font color="#9EE242">Done</font></span>';
        } else {
            cellContent += '<span style="display: table;margin: 0 auto;"><font color="#F3B821">'+count+'</font>/'+ projects.length +'</span>'
        }
    } else {
        cellContent += '<span>Unknown</span>';
    }
    cellContent +=  '</div>' +
            '</div>' +
        '</div>';
    return cellContent;
}

Core.prototype.displayOverview = function() {
    var self = this;
    
    $('#sidebar-overview').addClass('highlighted');
    $('#sidebar-projects').removeClass('highlighted');
    $('#sidebar-rooms').removeClass('highlighted');
    $('#sidebar-judges').removeClass('highlighted');
    
    $('#primary-content').html(self._basicOverviewContent());
    
    $('#generate-report').click(function(){
        self.didPressGenerateReportButton();
    });
    
    for(var index in self.overview) {
        var room = self.overview[index];
        var cellId = 'overview-' + index;
                
        var cellContent = self._generateOverviewCell(cellId, room.name, room.projects);
        $('#content-overview').append(cellContent);
        
        $('#' + cellId).click(function() {
            $(".sec-table-cell").each(function() {
                $(this).removeClass('highlighted');
            });
            $(this).closest('div').addClass('highlighted');
        });
    }
}

Core.prototype._generateReportPartialContent = function() {
    var content = '<div id="report-type-overlay" class="overlay" style="left: 0px; right: 0px; top: 0px; bottom: 0px;">' +
        '<div class="modal-popup" style="margin-top: -89px; margin-left: -145px; left: 50%; width: 290px; top: 50%; height: 178px;">' +
            '<div class="modal-popup-title">' +
                'Generate partial report?' +
            '</div>' +
            '<div class="stack-view">' +
                '<div id="generate-confirm" class="modal-popup-item non-last">' +
                    'Yes' +
                '</div>' +
                '<div id="generate-deny" class="modal-popup-item">' +
                    'No' +
                '</div>' +
            '</div>' +
        '</div>' +
    '</div>';
    
    return content;
}

Core.prototype._generateReportContentType = function() {
    var content = '<div id="report-type-overlay" class="overlay" style="left: 0px; right: 0px; top: 0px; bottom: 0px;">' +
        '<div class="modal-popup" style="margin-top: -89px; margin-left: -145px; left: 50%; width: 290px; top: 50%; height: 178px;">' +
            '<div class="modal-popup-title">' +
                'Report Type?' +
            '</div>' +
            '<div class="stack-view">' +
                '<div id="generate-html" class="modal-popup-item non-last">' +
                    'HTML' +
                '</div>' +
                '<div id="generate-csv" class="modal-popup-item">' +
                    'CSV' +
                '</div>' +
            '</div>' +
        '</div>' +
    '</div>';
    
    return content;
}

Core.prototype._generateReportStyle = function() {
    var content = 
    '<style>' +
        'body {' +
            'font-family: arial, sans-serif;' +
        '}' +
        'table {'+
            'font-family: arial, sans-serif;' +
            'border-collapse: collapse;' +
            'width: 100%;' +
        '}' +
        'td, th {' +
            'border: 1px solid #dddddd;' +
            'text-align: left;' +
            'padding: 8px;' +
        '}' +
        'tr:nth-child(even) {' +
            'background-color: #dddddd;' +
        '}' +
        '.separator {' +
            'background-color: #DBDBDB;' +
            'position: absolute;' +
        '}' +
    '</style>';
    
    return content;
}

Core.prototype._generateSummaryReport = function() {
    var self = this;
    
    var content = 
    '<h1>Summary Report</h1>';
    
    for(var index in self.overview) {
        var room = self.overview[index];
        
        var winner = 'Unknown';
        var projects = room.projects.sort((a, b) => {
            var fullProjectA = self.projects_map[a.id];
            var totalScoreA = 0;
            
            for(var e_idx in fullProjectA.evaluations) {
                var evaluation = fullProjectA.evaluations[e_idx];
                totalScoreA += evaluation.score;
            }
            
            var fullProjectB = self.projects_map[b.id];
            var totalScoreB = 0;
            
            for(var e_idx in fullProjectB.evaluations) {
                var evaluation = fullProjectB.evaluations[e_idx];
                totalScoreB += evaluation.score;
            }
            
            var keyA = totalScoreA,
                keyB = totalScoreB;
            
            if (keyA < keyB) return 1;
            if (keyA > keyB) return -1;
            return 0;
        });
        
        if (projects.length > 0) {
            winner = projects[0].name;
        }
        
        content += '<br><div id="sep-1" class="separator lt-view" style="left: 0px; right: 0px; height: 1px;"></div><h2>'+room.name+'</h2><h4>Winner: '+winner+'</h4><div style="width: 75%;"><table><tr><th>Team</th><th>Score (Avg)</th><th>Score (Total)</th></tr>';
        
        for(var p_idx in projects) {
            var project = projects[p_idx];
            var fullProject = self.projects_map[project.id];
            var totalScore = 0;
            
            for(var e_idx in fullProject.evaluations) {
                var evaluation = fullProject.evaluations[e_idx];
                totalScore += evaluation.score;
            }
            
            content += '<tr><th>'+project.name+'</th><th>'+project.score+'</th><th>'+totalScore+'</th></tr>'
        }
          
        content += '</table></div>';
    }
    
    return content;
}

Core.prototype.generateCSVFinalReport = function() {
	var self = this;
	
	var finalReport = '';
	    
    for (var index in self.overview) {
	    var room = self.overview[index];
	    
	    finalReport += room.name + '\n';
	    
	    for (var p_idx in room.projects) {
		    var projectId = room.projects[p_idx].id;
		    var project = self.projects_map[projectId];
		    
		    var projectTotal = 0;
		    
		    finalReport += project.name + '\n,Technical Accuracy,Creativity and Innovation,Supporting Analytical Work,Methodical Design Process Demonstrated,Addresses Project Complexity Appropriately,Expectation of Completion,Design & Analysis of tests,Quality of Response during Q&A,,Organization,Use of Allotted Time,Visual Aids,Confidence and Poise,,Total\n';
		    
		    for (var j_idx in project.evaluations) {
			    var evalCtx = project.evaluations[j_idx];
			    var evaluation = evalCtx.evaluation;
			    var judge = self.judges_map[evalCtx.judge_id];
			    
			    finalReport += judge.name + ',';
			    
			    if (evaluation['tech']) {
				    finalReport += evaluation['tech'];
			    }
			    
			    finalReport += ',';
			    
			    if (evaluation['creativity']) {
				    finalReport += evaluation['creativity'];
			    }
			    
			    finalReport += ',';
			    
			    if (evaluation['analytical_work']) {
				    finalReport += evaluation['analytical_work'];
			    }
			    
			    finalReport += ',';
			    
			    if (evaluation['design_process']) {
				    finalReport += evaluation['design_process'];
			    }
			    
			    finalReport += ',';
			    
			    if (evaluation['complexity']) {
				    finalReport += evaluation['complexity'];
			    }
			    
			    finalReport += ',';
			    
			    if (evaluation['completion']) {
				    finalReport += evaluation['completion'];
			    }
			    
			    finalReport += ',';
			    
			    if (evaluation['tests']) {
				    finalReport += evaluation['tests'];
			    }
			    
			    finalReport += ',';
			    
			    if (evaluation['response_qa']) {
				    finalReport += evaluation['response_qa'];
			    }
			    
			    finalReport += ',,';
			    
			    if (evaluation['organization']) {
				    finalReport += evaluation['organization'];
			    }
			    
			    finalReport += ',';
			    
			    if (evaluation['time']) {
				    finalReport += evaluation['time'];
			    }
			    
			    finalReport += ',';
			    
			    if (evaluation['visual_aids']) {
				    finalReport += evaluation['visual_aids'];
			    }
			    
			    finalReport += ',';
			    
			    if (evaluation['poise']) {
				    finalReport += evaluation['poise'];
			    }
			    
			    finalReport += ',,';
			    
			    finalReport += evalCtx.score + '\n';
			    
			    projectTotal += evalCtx.score;
		    }
		    
		    finalReport += '\nProject Total, ' + projectTotal + '\n\n';
	    }
    }
    
    var filename = 'final_report.csv';
    var blob = new Blob([finalReport], {type: "text/plain;charset=utf-8"});
    saveAs(blob, filename);
}

Core.prototype.didPressGenerateReportButton = function() {
    var self = this;
    
    var allSubmitted = true;
    
    for (var r_index in self.overview) {
        var room = self.overview[r_index];
        for (var p_index in room.projects) {
            var project = room.projects[p_index];
            if (project.status != 'done') {
                allSubmitted = false;
                break;
            }
        }
        
        if (!allSubmitted) {
            break;
        }
    }
    
    if (!allSubmitted) {
        $('body').append(self._generateReportPartialContent());
    
        $('#generate-confirm').click(function() {
            $('#report-type-overlay').remove();
            
            $('body').append(self._generateReportContentType());
            
            $('#generate-html').click(function() {
			    $('#report-type-overlay').remove();
			    var w = window.open("");
		        $(w.document.head).append(self._generateReportStyle());
		        $(w.document.body).html(self._generateSummaryReport());
		    });
		    
		    $('#generate-csv').click(function() {
			    $('#report-type-overlay').remove();
			    self.generateCSVFinalReport();
		    });
        });
        
        $('#generate-deny').click(function() {
            $('#report-type-overlay').remove();
        });
        
        $('#report-type-overlay').click(function() {
            $('#report-type-overlay').remove();
        })
    } else {
	    $('body').append(self._generateReportContentType());
	    
	    $('#generate-html').click(function() {
		    $('#report-type-overlay').remove();
		    var w = window.open("");
	        $(w.document.head).append(self._generateReportStyle());
	        $(w.document.body).html(self._generateSummaryReport());
	    });
	    
	    $('#generate-csv').click(function() {
		    $('#report-type-overlay').remove();
		    self.generateCSVFinalReport();
	    });
    }
}

Core.prototype._submitRequest = function(endpoint, data, callback) {
    var self = this;
    
    if (!callback) {
        callback = data;
        data = undefined;
    }
    
    var fullURL = self.baseURL + endpoint;
    
    var request = {
        url: fullURL,
        headers: {
            AUTHENTICATION: self.token
        }
    }
    
    if (data) {
        request.type = 'POST';
        request.data = JSON.stringify(data);
    } else {
        request.type = 'GET';
    }
    
    request.dataType = 'json';
    
    $.ajax(request).done((data, status) => {
        callback(undefined, data);
    }).fail((resp) => {
        callback(resp);
    });
}

Core.prototype.resetPassword = function() {
	var self = this;
	
	$('#sign-in-popup').remove();
	
	var content = '<div id="sign-in-popup" class="modal-popup" style="margin-top: -124px; margin-left: -145px; left: 50%; width: 290px; top: 50%; height: 248px;">' +
            '<div class="modal-popup-title">' +
                'Reset Password' +
            '</div>' +
            '<div class="stack-view">' +
            	'<div id="request-token-button" class="modal-popup-item non-last">' +
                    'Request Token' +
                '</div>' +
                '<div id="reset-token" class="modal-popup-input-item non-click non-last">' +
                    '<input id="token" type="text" class="judge-reset-token" placeholder="Token">' +
                '</div>' +
                '<div id="reset-new-password" class="modal-popup-input-item non-click">' +
                    '<input id="password" type="password" class="judge-reset-input" placeholder="Password">' +
                '</div>' +
            '</div>' +
        '</div>';
    
    $('#sign-in').append(content);
    
    $('#request-token-button').click(function() {
	    self.requestServerResetPassword((error, data) => {
		    if (!error && data.status == 0) {
    		    alert('Please check your email for reset token');
		    } else {
			    alert('An unknown error occurred');
		    }
	    });
    });
    
    $('#password').keypress(function (e) {
      if (e.which == 13) {
        var token = $('#token').val();
        var password = $('#password').val();
        
        if (!token) {
            alert('token needed.');
            return;
        }
        
        if (!password) {
            alert('password needed.');
            return;
        }
        
        self.requestServerUpdatePassword(token, password, (error, data) => {
	        if (!error && data.status == 0) {
		        alert('Password updated. Please sign in with new password.');
		        $('#sign-in-popup').remove();
		        var content = '<div id="sign-in-popup" class="modal-popup" style="margin-top: -89px; margin-left: -145px; left: 50%; width: 290px; top: 50%; height: 178px;">' +
		            '<div class="modal-popup-title">' +
		                'Sign In' +
		            '</div>' +
		            '<div class="stack-view">' +
		                '<div id="sign-in-username" class="modal-popup-input-item non-click non-last">' +
		                    '<input id="username" type="text" class="judge-signin-input" placeholder="Username">' +
		                '</div>' +
		                '<div id="sign-in-password" class="modal-popup-input-item non-click">' +
		                    '<input id="password" type="password" class="judge-signin-input" placeholder="Password">' +
		                '</div>' +
		            '</div>' +
		        '</div>';
			    
			    $('#sign-in').append(content);
	        } else {
		        alert('An error occurred when updating password. Please try again later.');
	        }
        });
        
        return false;
      }
    });
}

Core.prototype.showSignIn = function() {
	var self = this;
	
    var content = '<div id="sign-in" class="overlay" style="left: 0px; right: 0px; top: 0px; bottom: 0px;background-color:#457cac;">' +
        '<div id="forgot-password" style="position:absolute; bottom: 8px; right: 8px; color: white; cursor: pointer;">' +
            'Forgot Password?' +
        '</div>' +
        '<div id="sign-in-popup" class="modal-popup" style="margin-top: -89px; margin-left: -145px; left: 50%; width: 290px; top: 50%; height: 178px;">' +
            '<div class="modal-popup-title">' +
                'Sign In' +
            '</div>' +
            '<div class="stack-view">' +
                '<div id="sign-in-username" class="modal-popup-input-item non-click non-last">' +
                    '<input id="username" type="text" class="judge-signin-input" placeholder="Username">' +
                '</div>' +
                '<div id="sign-in-password" class="modal-popup-input-item non-click">' +
                    '<input id="password" type="password" class="judge-signin-input" placeholder="Password">' +
                '</div>' +
            '</div>' +
        '</div>' +
    '</div>';

    $('body').append(content);
    
    $('#forgot-password').click(function() {
	    self.resetPassword();
    });
    
    $('#password').keypress(function (e) {
      if (e.which == 13) {
        var username = $('#username').val();
        var password = $('#password').val();
        
        if (!username) {
            alert('username needed.');
            return;
        }
        
        if (!password) {
            alert('password needed.');
            return;
        }
        
        self.authorize(username, password);
        return false;
      }
    });
}

Core.prototype.signOut = function() {
    Cookies.remove('token');
    location.reload();
}

// From Ben Nadel
// https://www.bennadel.com/blog/1504-ask-ben-parsing-csv-strings-with-javascript-exec-regular-expression-command.htm

function CSVToArray( strData, strDelimiter ){
	// Check to see if the delimiter is defined. If not,
	// then default to comma.
	strDelimiter = (strDelimiter || ",");

	// Create a regular expression to parse the CSV values.
	var objPattern = new RegExp(
		(
			// Delimiters.
			"(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

			// Quoted fields.
			"(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

			// Standard fields.
			"([^\"\\" + strDelimiter + "\\r\\n]*))"
		),
		"gi"
		);


	// Create an array to hold our data. Give the array
	// a default empty first row.
	var arrData = [[]];

	// Create an array to hold our individual pattern
	// matching groups.
	var arrMatches = null;


	// Keep looping over the regular expression matches
	// until we can no longer find a match.
	while (arrMatches = objPattern.exec( strData )){

		// Get the delimiter that was found.
		var strMatchedDelimiter = arrMatches[ 1 ];

		// Check to see if the given delimiter has a length
		// (is not the start of string) and if it matches
		// field delimiter. If id does not, then we know
		// that this delimiter is a row delimiter.
		if (
			strMatchedDelimiter.length &&
			(strMatchedDelimiter != strDelimiter)
			){

			// Since we have reached a new row of data,
			// add an empty row to our data array.
			arrData.push( [] );

		}


		// Now that we have our delimiter out of the way,
		// let's check to see which kind of value we
		// captured (quoted or unquoted).
		if (arrMatches[ 2 ]){

			// We found a quoted value. When we capture
			// this value, unescape any double quotes.
			var strMatchedValue = arrMatches[ 2 ].replace(
				new RegExp( "\"\"", "g" ),
				"\""
				);

		} else {

			// We found a non-quoted value.
			var strMatchedValue = arrMatches[ 3 ];

		}


		// Now that we have our value string, let's add
		// it to the data array.
		arrData[ arrData.length - 1 ].push( strMatchedValue );
	}

	// Return the parsed data.
	return( arrData );
}