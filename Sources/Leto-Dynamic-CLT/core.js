function Core() {
    var self = this;
    
    // Update this to actual url
//     self.baseURL = 'http://students.engr.scu.edu/~mbernste/cgi-bin/test.cgi';
    self.baseURL = 'https://api.oltica.org/leto';
}

Core.prototype.authorize = function(judgeID) {
    var self = this;
    
    var data = {
        id: judgeID
    };
    var dataPayload = JSON.stringify(data);
    // Update this to actual url
    var fullURL = self.baseURL + '/judge/signin';
    
    $.ajax({
        url: fullURL,
        crossDomain: true,
        type: 'POST',
        dataType: 'json',
        data: dataPayload
    }).done((data, status) => {
        if (status == 'success') {
            var response = data;
            if (response && response.status == 0) {
                alert('Success');
                Cookies.set('judge_id', judgeID);
            }
        } else {
            alert(status);
        }
    }).fail((resp) => {
        alert('An error occurred.');
    });
}

Core.prototype.loadInfo = function() {
    var self = this;
    
    self._submitRequest('/judge/info', (error, data) => {
        // TODO: Update UI
        if (error) {
            alert(error);
        }
    });
}

Core.prototype.submitEval = function() {
    var self = this;
    
    // TODO: Gather changes
    
    var evals = {
        id: 1, // project id
        change: {
            "tech_bla": 5
        }
    };
    
    self._submitRequest('/judge/update', evals, (error, data) => {
        // TODO: Update UI
        if (error) {
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
    
    var judgeID = Cookies.get('judge_id');
    
    if (!judgeID) {
        callback("Missing Judge ID");
        return;
    }
    
    var fullURL = self.baseURL + endpoint;
    
    var request = {
        url: fullURL,
        headers: {
            AUTHENTICATION: judgeID
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

$(document).ready(function() {
    var comm = new Core();
    
    $('#btnSignIn').click(function(){
        var judgeID = $('#judge_id').val();
        
        if (!judgeID) {
            alert('Judge ID needed.');
            return;
        }
        
        comm.authorize(judgeID);
    }); 
    
    $('#btnLoadInfo').click(function(){
        comm.loadInfo();
    });
    
    $('#btnSubmit').click(function(){
        comm.submitEval();
    });
});