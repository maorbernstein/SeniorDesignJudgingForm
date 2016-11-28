function Core() {
    var self = this;
    self.baseURL = 'cgi-bin/'
//    self.baseURL = 'http://students.engr.scu.edu/~mbernste/cgi-bin';
}

Core.prototype.initialize = function() {
    var self = this;
    if(Cookies.get('judge_id') !== undefined) {
        $('#sign-in').remove();
        self.judgeId = Cookies.get('judge_id');
        self.loadInfo();
    } else {
        self.showSignIn();
    }
}

Core.prototype.authorize = function(judgeID) {
    judgeID = judgeID.toUpperCase();
    var self = this;

    var data = {
        id: judgeID
    };
    var dataPayload = JSON.stringify(data);
    var fullURL = self.baseURL + '/judge_auth.cgi';

    $.ajax({
      url: fullURL,
      type: 'POST',
      dataType: 'json',
      data: dataPayload
    }).done((data, status) => {
        if (status == 'success') {
            var response = data;
            if (response && response.status == 0) {
                Cookies.set('judge_id', judgeID);
                $('#sign-in').remove();
                self.judgeId = judgeID;
                self.loadInfo();
                return;
            }
        }
        alert('An error occurred. Please make sure you entered correct judge id.');
    }).fail((resp) => {
        alert('An error occurred.');
    });
}

Core.prototype.loadInfo = function() {
    var self = this;

    self._submitRequest('/judge_info.cgi', (error, data) => {
        if (!error && data.name != undefined) {
            $('#judge-name').html(data.name);
            $('#judge-subtitle').html(data.subtitle);
            $('#table-title-room').html(data.room_abv);

            self.teams = data.projects;
            self.sections = [{
            	"name": "DESIGN PROJECT",
            	"type": 0,
            	"items": [{
            		"id": 1,
            		"title": "Technical Accuracy",
            		"tag": "tech"
            	}, {
            		"id": 2,
            		"title": "Creativity and Innovation",
            		"tag": "creativity"
            	}, {
            		"id": 3,
            		"title": "Supporting Analytical Work",
            		"tag": "analytical_work"
            	}, {
            		"id": 4,
            		"title": "Methodical Design Process Demonstrated",
            		"tag": "design_process"
            	}, {
            		"id": 5,
            		"title": "Addresses Project Complexity Appropriately",
            		"tag": "complexity"
            	}, {
            		"id": 6,
            		"title": "Expectation of Completion",
            		"tag": "completion"
            	}, {
            		"id": 7,
            		"title": "Design & Analysis of tests",
            		"tag": "tests"
            	}, {
            		"id": 8,
            		"title": "Quality of Response during Q&A",
            		"tag": "response_qa"
            	}]
            }, {
            	"name": "PRESENTATION",
            	"type": 0,
            	"items": [{
            		"id": 9,
            		"title": "Organization",
            		"tag": "organization"
            	}, {
            		"id": 10,
            		"title": "Use of Allotted Time",
            		"tag": "time"
            	}, {
            		"id": 11,
            		"title": "Visual Aids",
            		"tag": "visual_aids"
            	}, {
            		"id": 12,
            		"title": "Confidence and Poise",
            		"tag": "poise"
            	}]
            }, {
            	"name": "CONSIDERATION",
            	"type": 1,
            	"items": [{
            		"id": 13,
            		"title": "Economic",
            		"tag": "economic"
            	}, {
            		"id": 14,
            		"title": "Environmental",
            		"tag": "environmental"
            	}, {
            		"id": 15,
            		"title": "Sustainability",
            		"tag": "sustainability"
            	}, {
            		"id": 16,
            		"title": "Manufacturability",
            		"tag": "manufacturability"
            	}, {
            		"id": 17,
            		"title": "Ethical",
            		"tag": "ethical"
            	}, {
            		"id": 18,
            		"title": "Health & Safety",
            		"tag": "health"
            	}, {
            		"id": 19,
            		"title": "Social",
            		"tag": "social"
            	}, {
            		"id": 20,
            		"title": "Political",
            		"tag": "political"
            	}]
            }];

            for(var index in self.teams) {
                var team = self.teams[index];

                var projectTime = moment.unix(team.time);
                team.time = projectTime.format('h:mma');

                var cellId = 'navi-cell-' + index;
                var cellContent = self.generateCell(cellId, team.name, team.members, team.description, team.time);
                $('#team-table-view').append(cellContent);
                $('#' + cellId).click(function() {
                    var teamId = $(this).closest('div').attr('id').substring(10);
                    var selectedTeam = self.teams[teamId];
                    self.didSelectTeam(selectedTeam);

                    var id = $(this).closest('div').attr('id');
                    $(".table-cell").each(function() {
                        $(this).css({'background-color':'white'});
                    });
                    $(this).closest('div').css({'background-color':'#cacaca'});
                });
                if (!self.currentTeam) {
                    self.currentTeam = team;
                    self.didSelectTeam(team);

                    $(".table-cell").each(function() {
                        $(this).css({'background-color':'white'});
                    });
                    $('#'+cellId).css({'background-color':'#cacaca'});
                }
            }
        } else {
	        alert('An error occurred when loading project information. Please try again later.');
            self.signOut();
        }
    });
}

Core.prototype.updateEval = function(key, value, callback) {
    var self = this;

    var updatedEval = {};
    updatedEval[key] = value;

    if (self.currentTeam) {
        if (self.currentTeam.evaluation) {
            self.currentTeam.evaluation[key] = value;
        } else {
            self.currentTeam.evaluation = updatedEval;
        }
    }

    var evaluations = {
        id: self.currentTeam.id,
        change: updatedEval
    };

    self._submitRequest('/judge_update.cgi', evaluations, (error, data) => {
        callback(error);
    });
}

Core.prototype.submitEval = function() {
    var self = this;

    var evaluations = {
        id: self.currentTeam.id,
    };

    self._submitRequest('/judge_submit.cgi', evaluations, (error, data) => {
        if(!error) {
            self.currentTeam.submitted = true;
            $('#section-5').remove();
            $('input[type=radio]').prop('disabled', true);
            $('input[type=checkbox]').prop('disabled', true);
            $('textarea#comment').prop('disabled', true);
            $('#eval-submit').prop('disabled', true);
            $('#eval-submit').prop('value', 'This evaluation is already submitted.');
        } else {
            alert(error);
        }
    });
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
            AUTHENTICATION: self.judgeId
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

Core.prototype.showSignIn = function() {
    var content = '<div id="sign-in" class="overlay" style="left: 0px; right: 0px; top: 0px; bottom: 0px;background-color:#457cac;">' +
        '<div class="modal-popup" style="margin-top: -54px; margin-left: -145px; left: 50%; width: 290px; top: 50%; height: 108px;">' +
            '<div class="modal-popup-title">' +
                'Enter Your Judge ID' +
            '</div>' +
            '<div class="stack-view">' +
                '<div id="sign-in-judgeid" class="modal-popup-input-item">' +
                    '<input id="judge_id" type="text" class="judge-signin-input" placeholder="Judge ID" maxlength="6">' +
                '</div>' +
            '</div>' +
        '</div>' +
    '</div>';


    $('body').append(content);
}

Core.prototype.generateCell = function(cellId, teamName, members, shortDesc, time) {
    var cellContent = '<div id="' + cellId + '" class="table-cell"><div id="cell-title" class="table-cell-title" style="padding-right: 68px;">' + teamName + '</div><div id="cell-subtitle" class="table-cell-subtitle">' + members + '</div><div id="cell-desc" class="table-cell-desc">' + shortDesc + '</div><div id="cell-time" class="table-cell-time" style="right: 8px; top: 8px;">' + time + '</div></div>'
    return cellContent;
}

Core.prototype.generateRadioSection = function(sectionId, data) {
    var sectionContent = '<div id="section-'+sectionId+'" class="lt-view" style="top: '+sectionId*20+'px;"><div class="lt-view" style="left: 10px">'+data.name+'</div><div id="sep-1" class="separator lt-view" style="left: 0px; right: 0px; height: 1px;"></div><div class="lt-view" style="margin-left: 35px;">';

    for(var index in data.items) {
        var item = data.items[index];
        sectionContent += '<div style="padding: 16px 0px; overflow:hidden;line-height: 40px;"><div style="float:left;">'+item.title+'</div><div class="radio" style="float:right; position: relative;width: auto;right: 40px;">' +
        '<label class="radio inline">' +
            '<input type="radio" name="'+item.tag+'-rating" value="-1">' +
            '<span> N/A </span>' +
        '</label>' +
        '<label class="radio inline">' +
            '<input type="radio" name="'+item.tag+'-rating" value="1">' +
            '<span> 1 </span>' +
        '</label>' +
        '<label class="radio inline">' +
            '<input type="radio" name="'+item.tag+'-rating" value="2">' +
            '<span> 2 </span>' +
        '</label>' +
        '<label class="radio inline">' +
            '<input type="radio" name="'+item.tag+'-rating" value="3">' +
            '<span> 3 </span>' +
        '</label>' +
        '<label class="radio inline">' +
            '<input type="radio" name="'+item.tag+'-rating" value="4">' +
            '<span> 4 </span>' +
        '</label>' +
        '<label class="radio inline">' +
            '<input type="radio" name="'+item.tag+'-rating" value="5">' +
            '<span> 5 </span>' +
        '</label>' +
        '</div></div>';
        if(index != data.items.length - 1) {
            sectionContent += '<div id="sep-1" class="separator lt-view" style="left: 0px; right: 0px; height: 1px;"></div>';
        }
    }

    sectionContent += '</div><div id="sep-1" class="separator lt-view" style="left: 0px; right: 0px; height: 1px;"></div></div>';

    return sectionContent;
}

Core.prototype.generateCheckboxSection = function(sectionId, data) {
    var sectionContent = '<div id="section-'+sectionId+'" class="lt-view" style="top: '+sectionId*20+'px;"><div class="lt-view" style="left: 10px">'+data.name+'</div><div id="sep-1" class="separator lt-view" style="left: 0px; right: 0px; height: 1px;"></div><div class="lt-view" style="padding: 8px 0px; left: 35px; right:0px;"><span>Please select each of the following considerations that were addressed by the presentation.</span><div class="checkbox"><table style="width:100%">';

    for(var index in data.items) {
	    if(index % 4 == 0) {
		    sectionContent += '<tr>';
	    }
        var item = data.items[index];
        sectionContent += '<td style="height: 60px;"><label class="check inline"><input type="checkbox" name="'+ item.tag +'" id="'+item.tag+'" value="'+item.id+'"><span>'+item.title+'</span></label></td>';

        if(index % 4 == 3) {
		    sectionContent += '</tr>';
	    }
    }

    sectionContent += '</table></div></div><div id="sep-1" class="separator lt-view" style="left: 0px; right: 0px; height: 1px;"></div></div>';

    return sectionContent;
}

Core.prototype.generateCommentSection = function(sectionId) {
    var self = this;

    var sectionContent = '<div id="section-'+sectionId+'" class="lt-view" style="top: '+ 20*sectionId +'px;"><div class="lt-view" style="left: 10px">COMMENT</div><div id="sep-1" class="separator lt-view" style="left: 0px; right: 0px; height: 1px;"></div><div class="lt-view" style="margin-left: 10px; margin-right: 10px;"><textarea id="comment" name="comment" class="comment-textarea" placeholder="Your comment (Optional)"></textarea></div><div id="sep-1" class="separator lt-view" style="left: 0px; right: 0px; height: 1px;"></div></div>';

    return sectionContent;
}

Core.prototype.generateSaveButton = function(sectionId) {
    var sectionContent = '<div id="section-'+sectionId+'" class="lt-view" style="top: '+ 20*sectionId +'px; padding-bottom: 8px;"><input id="eval-save" type="submit" value="Save Evaluation" style="margin-left: 10px;"></div>';

    return sectionContent;
}

Core.prototype.generateSubmitButton = function(sectionId) {
    var sectionContent = '<div id="section-'+sectionId+'" class="lt-view" style="top: '+ 20*sectionId +'px; padding-bottom: 40px;"><input id="eval-submit" type="submit" value="Submit Evaluation" style="margin-left: 10px;"></div>';

    return sectionContent;
}

Core.prototype.updateEvaluatedItems = function() {
    var self = this;

    if (self.currentTeam && self.currentTeam.submitted) {
        $('#section-5').remove();
        $('input[type=radio]').prop('disabled', true);
        $('input[type=checkbox]').prop('disabled', true);
        $('textarea#comment').prop('disabled', true);
        $('#eval-submit').prop('disabled', true);
        $('#eval-submit').prop('value', 'This evaluation is already submitted.');
    }

    if (self.currentTeam && self.currentTeam.evaluation) {
        var evals = self.currentTeam.evaluation;
        for (var key in evals) {
            var value = evals[key];

            if (key == 'comment') {
                $('textarea#comment').val(value);
            } else if ($('input:radio[name='+key+'-rating]').length > 0) {
                $('input:radio[name='+key+'-rating]').val([value + '']);
            } else if ($('input:checkbox[name='+key+']').length > 0) {
                $('input:checkbox[name='+key+']').prop( "checked", value );
            }
        }
    }

    $('#eval-save').prop('value', 'Saved');
    $('#eval-save').prop('disabled', true);
}

Core.prototype.updateEvalSection = function() {
    var self = this;

    var htmlBody = '';
    htmlBody += self.generateRadioSection(1, self.sections[0]);
    htmlBody += self.generateRadioSection(2, self.sections[1]);
    htmlBody += self.generateCheckboxSection(3, self.sections[2]);
    htmlBody += self.generateCommentSection(4);
    htmlBody += self.generateSaveButton(5);
    htmlBody += self.generateSubmitButton(6);

    $('#eval-table').html(htmlBody);
    self.updateEvaluatedItems();

    $('#eval-submit').click(function() {
        var r = confirm("Do you want to submit this evaluation? Once submitted, you will no longer be able to modify it.");
        if (r) {
            self.submitEval();
        }
    });

    $('#eval-save').click(function() {
        var key = 'comment';
        var value = $('textarea#comment').val();

        self.updateEval(key, value, (error) => {
            $('#eval-save').prop('value', 'Saved');
            $('#eval-save').prop('disabled', true);
        });
    })

    $('input[type=radio]').change(function() {
        var key = this.name.replace('-rating','');
        var value = parseInt(this.value);

        self.updateEval(key, value, (error) => {

        });
    });

    $('input[type=checkbox]').change(function() {
        var key = this.name;
        var value = this.checked;

        self.updateEval(key, value, (error) => {

        });
    });

    $('textarea#comment').keyup(function(){
        $('#eval-save').prop('value', 'Save Evaluation');
        $('#eval-save').prop('disabled', false);
    });
}

Core.prototype.didSelectTeam = function(team) {
    var self = this;

    self.currentTeam = team;
    $('#team-info-name').html(team.name);
    $('#team-info-members').html(team.members);
    $('#team-info-desc').html(team.description);

    self.updateEvalSection();
}

Core.prototype.signOut = function() {
    Cookies.remove('judge_id');
    location.reload();
}
