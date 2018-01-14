/*
XMLHttpRequest:
https://en.wikipedia.org/wiki/XMLHttpRequest

CouchDB:
http://guide.couchdb.org/draft/tour.html
https://wiki.apache.org/couchdb/HTTP_Document_API
http://docs.couchdb.org/en/1.6.1/config/intro.html
http://docs.couchdb.org/en/1.6.1/config/http.html#cross-origin-resource-sharing
http://docs.couchdb.org/en/1.6.1/intro/curl.html

HTML(5):
http://www.w3schools.com/html/default.asp
http://www.w3schools.com/jsref/default.asp

Local HTTP server (not strictly needed):
python -m SimpleHTTPServer 8080

CouchDB configuration (Mac OS X):
~/Library/Application Support/CouchDB/etc/couchdb/local.ini
/Applications/Apache CouchDB.app/Contents/Resources/couchdbx-core/etc/couchdb/local.ini
CouchDB configuration (Windows):
C:\Program Files (x86)\Apache Software Foundation\CouchDB\etc\couchdb\local.ini
start/stop/restart: Control Panel --> Services --> Apache CouchDB

[httpd]
enable_cors = true
bind_address = 0.0.0.0
[cors]
origins = *
*/

var requestGet = new XMLHttpRequest();

requestGet.onreadystatechange = function() {
    // console.log("onreadystatechange: " + requestGet.readyState + ", " +  requestGet.status);
    // console.log(requestGet.responseText);
    if (requestGet.readyState == 4) {
        if (requestGet.status == 200) {
            var response = JSON.parse(requestGet.responseText);
            getHandlers[response._id](response);
        }
        if (requestGet.status == 404) {
            console.log("not found: " + requestGet.responseText);
        }
    }
};

function get(variable) {
    // console.log("get " + variable);
    requestGet.open("GET", dburl + variable, false);
    requestGet.send();
}

function update() {
    for (var name in getHandlers) {
        // console.log("updating " + name);
        get(name);
    }
}

// request updates at a fixed interval (ms)
var intervalID = setInterval(update, 1000);

var requestSet = new XMLHttpRequest();

requestSet.onreadystatechange = function() {
    console.log("onreadystatechange: " + requestSet.readyState + ", " +  requestSet.status);
    console.log(requestSet.responseText);
    if (requestSet.readyState == 4) {
        if (requestSet.status == 200) {
            var response = JSON.parse(requestSet.responseText);
            setHandlers[response._id](response);
        }
        if (requestSet.status == 404) {
            var json = JSON.parse(requestSet.responseText);
            if (json.reason === "no_db_file") {
                createDB();
            } else {
                var url = requestSet.responseURL
//              console.log(typeof(url));
                var i = url.lastIndexOf("/", url.length - 1);
                var name = url.substring(i + 1);
                setHandlers[name]({ "_id" : name });
            }
        }
    }
};

function set(name) {
    console.log("set::name = " + name);
    console.log("set::GET = " + dburl + name);
    requestSet.open("GET", dburl + name, false);
    requestSet.send();
}

function put(response, message) {
    console.log("put::response = " + response);
    console.log("put::message = " + message);
    requestSet.open("PUT", dburl + response._id, false);
    requestSet.setRequestHeader("Content-type", "application/json");
    message["_id"] = response._id;
    if (response._rev) {
        message["_rev"] = response._rev;
    }
    var s = JSON.stringify(message);
//  console.log("put: " + s);
    requestSet.send(s);
}

function createDB() {
    requestSet.open("PUT", dburl, false);
    requestSet.send();
}





///////////////////////////////////////////////////////////////////////////////
// your code below

var dbname = "gmci";
var dburl = "http://127.0.0.1:5984/" + dbname + "/";
var getHandlers = {
    "questionList": fillQuestionList,
};

var setHandlers = {
    // add further handlers here
    "questionList": parseQuestionList
};

var questionList = {"list" : []};




function parseQuestionList(response) {
    
    
    put(response, questionList);
}

function fillQuestionList(response) {
    
    
    questionList = response;
    
    var listElement = document.getElementById("questionList");
    var commentElement = document.getElementById("commentList");
    
    if(listElement) {
        document.getElementById("questionList").innerHTML = "";
        if(response) {
            for(var i = 0; i < response.list.length; i++) {
                var frage = response.list[i];
            
            
            
                var questionText = frage.question;
                var commentNumber = frage.comments.length;
                var points = frage.points;
                var questionId = i;
                var QuestionString = '<div class="row"><div class="col-sm-11"><div class="panel panel-default">           <div class="panel-body" id="panel-body">' + questionText + '</div>           <div class="container" align ="center" style="width: 80%"> <a href="frageansicht.html?questionId='+questionId+'"> <span class="glyphicon glyphicon-comment"></span> <span class="badge">' +commentNumber+'</span></a><br> </div>         </div>       </div>        <div class="col-sm-1">         <div class="container">            <a onclick="upvoteQuestion('+questionId+')">             <span class="glyphicon glyphicon-triangle-top"></span>           </a>            <p>' + points + '</p>           <a onclick="downvoteQuestion('+questionId+')">             <span class="glyphicon glyphicon-triangle-bottom"></span>           </a>            </div>          </div>        </div>';
                
                document.getElementById("questionList").innerHTML += QuestionString;
            
            }
        }
    }
    else if(commentElement) {
        
        var params = getUrlVars();
        
       
        
        fillCommentList(params.questionId);
    }
    
    
    
}


function fillCommentList(questionId) {
    
    document.getElementById("commentList").innerHTML = "";
    
    if(questionList) {
        var frage = questionList.list[questionId];
        
         var questionText = frage.question;
        var commentNumber = frage.comments.length;
        var points = frage.points;
        var QuestionString = '<div class="row panel panel-default"><div class="col-sm-11"><div class="panel panel-default">           <div class="panel-body" id="panel-body">' + questionText + '</div>           </div>       </div>        <div class="col-sm-1">         <div class="container">            <a onclick="upvoteQuestion('+questionId+')">             <span class="glyphicon glyphicon-triangle-top"></span>           </a>            <p>' + points + '</p>           <a onclick="downvoteQuestion('+questionId+')">             <span class="glyphicon glyphicon-triangle-bottom"></span>           </a>            </div>          </div>        </div>';
                
        document.getElementById("commentList").innerHTML += QuestionString;
        
        
        for(var i = 0; i < frage.comments.length; i++) {
            var comment = frage.comments[i];
        
        
        
            var commentText = comment.text;
            var points = comment.points;
            var commentId = i;
            var commentString = '<div class="row"><div class="col-sm-11"><div class="panel panel-default">           <div class="panel-body" id="panel-body">' + commentText + '</div>           </div>       </div>        <div class="col-sm-1">         <div class="container">            <a onclick="upvoteComment('+questionId+','+commentId+')">             <span class="glyphicon glyphicon-triangle-top"></span>           </a>            <p>' + points + '</p>           <a onclick="downvoteComment('+questionId+','+commentId+')">             <span class="glyphicon glyphicon-triangle-bottom"></span>           </a>            </div>          </div>        </div>';
            
            document.getElementById("commentList").innerHTML += commentString;
        
        }
    }
    
}

function upvoteQuestion(questionId) {
    questionList.list[questionId].points += 1;
    set("questionList");
}

function downvoteQuestion(questionId) {
     questionList.list[questionId].points -= 1;
     set("questionList");
}

function upvoteComment(questionId, commentId) {
    questionList.list[questionId].comments[commentId].points += 1;
    set("questionList");
}

function downvoteComment(questionId, commentId) {
    questionList.list[questionId].comments[commentId].points  -= 1;
    set("questionList");
}

function addNewQuestion() {
      
      var newQuestion = document.getElementById("NewQuestion").value;
      
      document.getElementById("NewQuestion").value = "";
      
       var frage = {"question": newQuestion, "points": 0, "comments": []};
       
      questionList.list.push(frage);
      
      set("questionList");
}

function addNewComment() {
      
      var params = getUrlVars();
      
      var newComment = document.getElementById("NewComment").value;
      
      document.getElementById("NewComment").value = "";
      
      var kommentar = {"text": newComment, "points": 0};
       
      questionList.list[params.questionId].comments.push(kommentar);
      
      set("questionList");
}

function getUrlVars() {var vars = {};var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {if(vars[key]){if(vars[key] instanceof Array){vars[key].push(value);}else{vars[key] = [vars[key], value];}}else{vars[key] = value;}});return vars;}
    
