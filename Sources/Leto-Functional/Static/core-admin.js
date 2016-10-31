function getParameterByName(name, url) {
    if (!url) {
      url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function Core() {
    var self = this;
    
    self.baseURL = 'https://api.oltica.org/leto';
}

Core.prototype.initialize = function() {
    var self = this;
    if(Cookies.get('token') !== undefined) {
        $('#sign-in').remove();
        self.token = Cookies.get('token');
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
    var fullURL = self.baseURL + '/admin/signin';
    
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
                self.token = token;
                self.loadInfo();
                return;
            }
        }
        alert('An error occurred. Please make sure you entered correct username and password.');
    }).fail((resp) => {
        alert('An error occurred.');
    });
}

Core.prototype.importData = function() {
    alert('Under construction. Coming Soon™');
}

Core.prototype.summaryReport = function() {
    var self = this;
    self._submitRequest('/admin/summary', (error, data) => {
        if (!error && data.status == 0) {
            self.generateSummaryReportWithData(data.sessions);
        }
    });
}

Core.prototype.detailReport = function() {
    var self = this;
    
    self._submitRequest('/admin/detail?pid='+getParameterByName('pid'), (error, data) => {
        if (!error && data.status == 0) {
            self.generateDetailReportWithData(data);
        }
    });
}

Core.prototype.fetchProjects = function() {
    var self = this;
    
    self._submitRequest('/admin/projects', (error, data) => {
        if (!error && data.status == 0) {
            self.updateProjectsList(data.projects);
        }
    });
}

Core.prototype.generateSummaryReportWithData = function(data) {
    var content = '';
    
    for(var index in data) {
        var session = data[index];
        
        var winner = 'Unknown';
        
        if (session.projects.length > 0) {
            winner = session.projects[0].name;
        }
        
        content += '<br><div id="sep-1" class="separator lt-view" style="left: 0px; right: 0px; height: 1px;"></div><h2>'+session.name+'</h2><h4>Winner: '+winner+'</h4><div style="width: 75%;"><table><tr><th>Team</th><th>Score</th></tr>';
        
        for(var p_idx in session.projects) {
            var project = session.projects[p_idx];
            content += '<tr><th>'+project.name+'</th><th>'+project.score+'</th></tr>'
        }
          
        content += '</table></div>';
    }
        
    $('body').append(content);
}

Core.prototype.generateDetailReportWithData = function(data) {
    var content = '';
    
    content += '<h2>'+data.name+'</h2>'
    
    for(var index in data.judges) {
        var judge = data.judges[index];

        content += '<br><div id="sep-1" class="separator lt-view" style="left: 0px; right: 0px; height: 1px;"></div><h4>'+judge.name+'</h4><div style="width: 75%"><table><tr><th>Item</th><th>Score</th></tr>';
        
        var resolutions = [];
        
        for(var p_idx in judge.evals) {
            var eval = judge.evals[p_idx];
            if (eval.item_id < 13) {
                var item = data.sections[0].items[eval.item_id - 1];
                if (!item) {
                    item = data.sections[1].items[eval.item_id - 9];
                }
                
                content += '<tr><th>'+item.title+'</th><th>'+eval.value+'</th></tr>'
            } else if (eval.value == 1) {
                var item = data.sections[2].items[eval.item_id - 13];
                resolutions.push(item.title);
            }
        }
        
        content += '</table>';
        
        if (resolutions.length > 0) {
            content += '<h4>Resolutions:</h4><span>'+resolutions.join(', ')+'</span>';
        }
        
        if (judge.comment) {
            content += '<h4>Comment:</h4><span>'+judge.comment+'</span>';
        }
        content += '</div>';
    }
    
    content += '<div style="height: 40px;"></div>'
    
    $('body').append(content);
}

Core.prototype.updateProjectsList = function(data) {
    var content = '';
    
    for(var index in data) {
        var project = data[index];
        content += '<a href="detail.html?pid='+project.id+'">'+project.name+'</a><br>';
    }
    $('body').append(content);
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
            AUTHORIZATION: self.token
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
    var content = '<div id="sign-in" class="overlay" style="display: flex;justify-content: center;align-items: center;"><div><input id="username" type="text" class="judge-signin-input" placeholder="Username"><input id="password" type="password" class="judge-signin-input" placeholder="Password"><input id="sign-in-btn" style="display: table;margin: 12px auto;" type="submit" value="Sign In"></div></div>';
    $('body').append(content);
}

Core.prototype.signOut = function() {
    Cookies.remove('token');
    location.reload();
}