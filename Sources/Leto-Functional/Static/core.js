function Core() {
    var self = this;
    
    self.baseURL = 'https://api.oltica.org/leto';
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
    var fullURL = self.baseURL + '/judge/signin';
    
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
    
    self._submitRequest('/judge/info', (error, data) => {
        if (!error && data.status == 0) {
            $('#judge-name').html(data.name);
            $('#judge-subtitle').html(data.subtitle);
            $('#table-title-room').html(data.room_abv);
            
            self.teams = data.projects;
            self.sections = data.sections;
            for(var index in self.teams) {
                var team = self.teams[index];
                var cellId = 'navi-cell-' + index;
                var cellContent = self.generateCell(cellId, team.name, team.subtitle, team.short_desc, team.start_time);
                $('#team-table-view').append(cellContent);
                $('#' + cellId).click(function() {
                    var teamId = $(this).closest('div').attr('id').substring(10);
                    var selectedTeam = self.teams[teamId];
                    self.didSelectTeam(selectedTeam);
                });
                if (!self.currentTeam) {
                    self.currentTeam = team;
                    self.didSelectTeam(team);
                }
            }
        } else {
            // TODO: Error Handling;
        }
    });
}

Core.prototype.submitEval = function() {
    var self = this;
    
    var evals = [];
    
    // TODO: Gather changes
    for(var index in self.sections) {
        var section = self.sections[index];
        for(var i_index in section.items) {
            var item = section.items[i_index];
            if(section.type == 0) {
                var value = $('input[name='+item.tag+'-rating]:checked').val();
                if(value) {
                    evals.push({
                        id: item.id,
                        value: parseInt(value)
                    });
                }
            } else if (section.type == 1) {
                var checked = $('#'+item.tag).is(':checked');
                evals.push({
                    id: item.id,
                    value: checked
                });
            }
        }
    }
    
    var evaluations = {
        id: self.currentTeam.id,
        evaluations: evals,
        comment: $('textarea#comment').val()
    };
    
    self._submitRequest('/judge/update', evaluations, (error, data) => {
        if(!error) {
            alert('Success.');
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
            AUTHORIZATION: self.judgeId
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
    var content = '<div id="sign-in" class="overlay" style="display: flex;justify-content: center;align-items: center;"><div><input id="judge_id" type="text" class="judge-signin-input" placeholder="Judge ID" maxlength="6"><input id="sign-in-btn" style="display: table;margin: 12px auto;" type="submit" value="Start Evaluation"></div></div>';
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
        sectionContent += '<div style="padding: 16px 0px; overflow:hidden;"><div style="float:left;">'+item.title+'</div><div class="radio" style="float: right; margin-right: 80px;"><input type="radio" name="'+item.tag+'-rating" value="1"><label for="1">1</label><input type="radio" name="'+item.tag+'-rating" value="2"><label for="2">2</label><input type="radio" name="'+item.tag+'-rating" value="3"><label for="3">3</label><input type="radio" name="'+item.tag+'-rating" value="4"><label for="4">4</label><input type="radio" name="'+item.tag+'-rating" value="5"><label for="5">5</label></div></div>';
        if(index != data.items.length - 1) {
            sectionContent += '<div id="sep-1" class="separator lt-view" style="left: 0px; right: 0px; height: 1px;"></div>';
        }
    }
    
    sectionContent += '</div><div id="sep-1" class="separator lt-view" style="left: 0px; right: 0px; height: 1px;"></div></div>';
    
    return sectionContent;
}

Core.prototype.generateCheckboxSection = function(sectionId, data) {
    var sectionContent = '<div id="section-'+sectionId+'" class="lt-view" style="top: '+sectionId*20+'px;"><div class="lt-view" style="left: 10px">'+data.name+'</div><div id="sep-1" class="separator lt-view" style="left: 0px; right: 0px; height: 1px;"></div><div class="lt-view" style="padding: 8px 0px; left: 35px; right:0px;"><span>Please select each of the following considerations that were addressed by the presentation.</span><div class="checkbox">';
                
    for(var index in data.items) {
        var item = data.items[index];
        sectionContent += '<input type="checkbox" id="'+item.tag+'" value="'+item.id+'"><label for="'+item.id+'">'+item.title+'</label>';
    }
    
    sectionContent += '</div></div><div id="sep-1" class="separator lt-view" style="left: 0px; right: 0px; height: 1px;"></div></div>';
    
    return sectionContent;
}

Core.prototype.generateCommentSection = function(sectionId, data) {
    var self = this;
    
    if(self.currentTeam.comment) {
        var sectionContent = '<div id="section-'+sectionId+'" class="lt-view" style="top: '+ 20*sectionId +'px;"><div class="lt-view" style="left: 10px">COMMENT</div><div id="sep-1" class="separator lt-view" style="left: 0px; right: 0px; height: 1px;"></div><div class="lt-view" style="margin-left: 10px; margin-right: 10px;"><textarea id="comment" name="comment" class="comment-textarea" placeholder="Your comment (Optional)">'+self.currentTeam.comment+'</textarea></div><div id="sep-1" class="separator lt-view" style="left: 0px; right: 0px; height: 1px;"></div></div>';
    } else {
        var sectionContent = '<div id="section-'+sectionId+'" class="lt-view" style="top: '+ 20*sectionId +'px;"><div class="lt-view" style="left: 10px">COMMENT</div><div id="sep-1" class="separator lt-view" style="left: 0px; right: 0px; height: 1px;"></div><div class="lt-view" style="margin-left: 10px; margin-right: 10px;"><textarea id="comment" name="comment" class="comment-textarea" placeholder="Your comment (Optional)"></textarea></div><div id="sep-1" class="separator lt-view" style="left: 0px; right: 0px; height: 1px;"></div></div>';
    }
    
    return sectionContent;
}

Core.prototype.generateSubmitButton = function(sectionId) {
    var sectionContent = '<div id="section-'+sectionId+'" class="lt-view" style="top: '+ 20*sectionId +'px; padding-bottom: 40px;"><input id="eval-submit" type="submit" value="Submit Evaluation" style="margin-left: 10px;"></div>';
    
    return sectionContent;
}

Core.prototype.updateEvalSection = function() {
    var self = this;
    
    var htmlBody = '';
    htmlBody += self.generateRadioSection(1, self.sections[0]);
    htmlBody += self.generateRadioSection(2, self.sections[1]);
    htmlBody += self.generateCheckboxSection(3, self.sections[2]);
    htmlBody += self.generateCommentSection(4);
    htmlBody += self.generateSubmitButton(5);
    
    $('#eval-table').html(htmlBody);
    $('#eval-submit').click(function() {
        self.submitEval();
    });
}

Core.prototype.didSelectTeam = function(team) {
    var self = this;
    
    self.currentTeam = team;
    $('#team-info-name').html(team.name);
    $('#team-info-members').html(team.subtitle);
    $('#team-info-desc').html(team.desc);
    
    self.updateEvalSection();
}

Core.prototype.signOut = function() {
    Cookies.remove('judge_id');
    location.reload();
}