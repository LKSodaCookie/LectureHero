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
            questionList = {"list" : []};
            set("questionList");
            set("quiz");
            set("survey");
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
    "quiz":fillQuiz,
    "survey":fillSurvey
};

var setHandlers = {
    // add further handlers here
    "questionList": parseQuestionList,
    "quiz":parseQuiz,
    "survey":parseSurvey
};


function parseSurvey(response) {
    
    
    if(!surveyData) {
        
        var questionA = "Welche Programmiersprachen beherrschen Sie?";
        
        var choicesA = ["Java","C/C++","PHP","Python"];
        
        var first = {"question":questionA, "choices":choicesA,"results":[0,0,0,0,0]};
        
        var questionB = "Welchem Studiengang gehören Sie an?";
        
        var choicesB = ["Informatik","Technische Informatik","Maschinenbau","Andere"];
        
        var second = {"question":questionB, "choices":choicesB,"results":[0,0,0,0,0]};
        
        surveyData = {"questions":[first,second]};
    }
    
    put(response, surveyData);
}

function fillSurvey(response) {
    
    
    
    var container = document.getElementById("surveyContainer");
    
    if(!container) {
        return;
    }
    
    var selected = [[false,false,false,false],[false,false,false,false]];
    
    for(var i = 0; i < selected.length; i++) {
        for(var n = 0; n < selected[i].length; n++) {
            
            if(document.getElementById("check" + i + "," + n)) {
            
                if(document.getElementById("check" + i + "," + n).checked) {
                    selected[i][n] = true;
                }
                else {
                     selected[i][n] = false;
                }
            
            }
            else {
                selected[i][n] = false;
            }
            
        }
    }
    
    
    surveyData = response;
    
    
    
    var list = surveyData.questions;    
    
    var finalHTML = "";
        
    for(var i = 0; i < list.length; i++) {
        var question = list[i];
        
        
        var choices = question.choices;
        var choicesListHTML = "";
        for(var n = 0; n < choices.length; n++) {
            var choice = choices[n];
            
            var checkbox = "";
            
            if(selected[i][n]) {
                checkbox = 'checked';
            }
            
            
            choicesListHTML += '<td style="width: 50%"><input type="checkbox" id="check'+ i + "," + n + '" aria-label="Checkbox for following text input" style="margin-right: 2em;" '+checkbox+'>' + choice +  '</td>';
            
            if(n % 2 == 1) {
                choicesListHTML += '</tr><tr>';
            }
        }
        
        var questionHTML = '<div class="question"> 	<h3 id="question">' + question.question + '</h3> 	<div class="input-group" style="margin-left: 2em; width: 100%; font-size: 14pt"> 		<table style="width: 100%"> 			<tr>' + choicesListHTML + '</tr> 			</table>   </div>   </div>';    
        
        finalHTML += questionHTML;
    }    
    
    container.innerHTML = finalHTML;
    
    
    
    fillSurveyResults();
    
}


var questionList = {"list" : []};
var surveyData;

function sortListByPoints(list) {
    
    var unsortedList = list.slice();
    var sortedList = [];

    while(unsortedList.length > 0) {
        
        var max = 0
        
        for(var i = 0; i < unsortedList.length; i++) {
            
            if(unsortedList[i].points > unsortedList[max].points) {
                max = i;
            }
            
        }
        
        sortedList.push(unsortedList[max]);
        unsortedList.splice(max, 1); 
    }
    
    return sortedList;
}

var answered = false;
var selected = [[false,true,false,false],[false,true,false,false]];

function fillQuiz(response) {
    
    if(answered) {
        return;
    }
    
     if(!document.getElementById("quizContainer")) {
        return;
    }
    
    
    for(var i = 0; i < selected.length; i++) {
        for(var n = 0; n < selected[i].length; n++) {
            
            if(document.getElementById("check" + i + "," + n)) {
            
                if(document.getElementById("check" + i + "," + n).checked) {
                    selected[i][n] = true;
                }
                else {
                     selected[i][n] = false;
                }
            
            }
            else {
                selected[i][n] = false;
            }
            
        }
    }
    
    
    
    var quiz = response;    
        
    var list = quiz.taskList;    
    
    var finalHTML = "";
        
    for(var i = 0; i < list.length; i++) {
        var question = list[i];
        
        
        var answers = question.answers;
        var answerListHTML = "";
        for(var n = 0; n < answers.length; n++) {
            var answer = answers[n];
            
            var checkbox = "";
            
            if(selected[i][n]) {
                checkbox = 'checked';
            }
            
            if(question.correct[n]) {
                answerListHTML += '<td style="width: 50%" class="correct"><input type="checkbox" id="check'+ i + "," + n + '" aria-label="Checkbox for following text input" style="margin-right: 2em;" '+checkbox+'>' + answer +  '</td>';
            }
            else {
                answerListHTML += '<td style="width: 50%" class="wrong"><input type="checkbox" id="check'+ i + "," + n + '"  aria-label="Checkbox for following text input" style="margin-right: 2em" '+checkbox+'>' + answer +  '</td>';
            }
            
            if(n % 2 == 1) {
                answerListHTML += '</tr><tr>';
            }
        }
        
        var questionHTML = '<div class="question"> 	<h3 id="question">' + question.task + '</h3> 	<div class="input-group" style="margin-left: 2em; width: 100%; font-size: 14pt"> 		<table style="width: 100%"> 			<tr>' + answerListHTML + '</tr> 			</table>   </div>   </div>';    
        
        finalHTML += questionHTML;
    }    
    
    document.getElementById("quizContainer").innerHTML = finalHTML;
    
}

function parseQuestionList(response) {
    
    
    put(response, questionList);
}

function parseQuiz(response) {
    
    //hardcode quiz here
    
    var questionA = "Welche Aspekte sind Komponente der Wahrnehmung?";
    var answersA = ["Visual System","Hair System","Auditory System","Work System"];
    
    var correctA = [true,false,true,false];
    
    var questionB = "Was beinhaltet deklaratives Wissen?";
    var answersB = ["Wie man ein Instrument spielt","Wie man lernt","Chlorophyll macht die Blätter grün.","Die Mitochondrie ist das Kraftwerk der Zelle."];
    
    var correctB = [false,false,true,true];
    
    
    var questions = [{"task": questionA, "answers": answersA, "correct":correctA },{"task": questionB, "answers": answersB, "correct":correctB }];
    
    
    var quiz = {"taskList": questions};
    
    
    put(response, quiz);
}

function fillQuestionList(response) {
    
    
    questionList = response;
    
    var listElement = document.getElementById("questionList");
    var commentElement = document.getElementById("commentList");
    
    if(listElement) {
        document.getElementById("questionList").innerHTML = "";
        if(response) {
            
            var sortedList = sortListByPoints(questionList.list);
            
            for(var i = 0; i < sortedList.length; i++) {
                var frage = sortedList[i];
            
            
            
                var questionText = frage.question;
                var commentNumber = frage.comments.length;
                var points = frage.points;
                var questionId = frage.id;
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
        
        var sortedList = sortListByPoints(frage.comments);
        
        for(var i = 0; i < sortedList.length; i++) {
            var comment = sortedList[i];
        
        
        
            var commentText = comment.text;
            var points = comment.points;
            var commentId = comment.id;
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
      
       if(newQuestion == ""){
        
        alert("Es muss eine Frage formuliert sein!");

        return;

      }

      document.getElementById("NewQuestion").value = "";
      
       var frage = {"id":questionList.list.length,"question": newQuestion, "points": 0, "comments": []};
       
      questionList.list.push(frage);
      
      set("questionList");
}

function addNewComment() {
      
      var params = getUrlVars();
      
      var newComment = document.getElementById("NewComment").value;
      
      document.getElementById("NewComment").value = "";
      
      var kommentar = {"id":questionList.list[params.questionId].comments.length,"text": newComment, "points": 0};
       
      questionList.list[params.questionId].comments.push(kommentar);
      
      set("questionList");
}

function resetDB() {
    questionList = {"list" : []};
    set("questionList");
    set("quiz");
    set("survey");
}

function submitQuiz() {
	//document.getElementById("quizContainer").style.textAlign = "center";
	//document.getElementById("quizContainer").style.marginTop = "3em";
	//document.getElementById("quizContainer").style.fontSize = "1.5em";
	//document.getElementById("quizContainer").innerHTML = "Vielen Dank für die Teilnahme!";
	tmp = document.getElementById("button");
	tmp.parentNode.removeChild(tmp);
    
    var correctAnswers = document.getElementsByClassName("correct");
    
    for(var i = 0; i < correctAnswers.length; i++) {
        correctAnswers[i].style.color = "green";
    }
    
    var wrongAnswers = document.getElementsByClassName("wrong");
    
    for(var i = 0; i < wrongAnswers.length; i++) {
        wrongAnswers[i].style.color = "red";
    }
    
    answered = true;
}

function submitSurvey(){
        document.getElementById("surveyContainer").style.display = "none";
    
		document.getElementById("message").style.textAlign = "center";
		document.getElementById("message").style.marginTop = "3em";
		document.getElementById("message").style.fontSize = "1.5em";
		document.getElementById("message").innerHTML = "Vielen Dank für die Teilnahme!";
		
		tmp = document.getElementById("button");
		tmp.parentNode.removeChild(tmp);
    
        for(var i = 0; i < selected.length; i++) {
            for(var n = 0; n < selected[i].length; n++) {
                
                if(document.getElementById("check" + i + "," + n)) {
                
                    if(document.getElementById("check" + i + "," + n).checked) {
                        surveyData.questions[i].results[n+1] += 1;
                    }
                
                }
                
            }
            
            surveyData.questions[i].results[0] += 1;
        }
        
        set("survey");
        
        document.getElementById("resultContainer").style.display = "inline";
        
        answered = true;
    }
    
function fillSurveyResults() {
    
    var list = surveyData.questions;
    
    var finalHMTL = "";
    
    for(var i = 0; i < list.length; i++) {
       var question = list[i];
       
       
       var resultListHTML = "";
       var choices = question.choices;
       for(var n = 0; n < choices.length; n++) {
           
           var percent = Math.round((question.results[n+1]/question.results[0]) * 100);
           if(question.results[0] == 0) percent = "-";
           
           
           resultListHTML += '<td style="width: 50%">'+ choices[n] +': ' + percent +'% (' + question.results[n+1] + ')</td>';
            
           if(n % 2 == 1) {
               resultListHTML += '</tr><tr>';
           }
           
           
       }
       
       var questionHTML = '<div class="question"> 	<h3 id="question">' + question.question + '(' + question.results[0] + ' Answers)</h3> 	<div class="input-group" style="margin-left: 2em; width: 100%; font-size: 14pt"> 		<table style="width: 100%"> 			<tr>' + resultListHTML + '</tr> 			</table>   </div>   </div>';
       
       
       finalHMTL += questionHTML;
    }
    
    document.getElementById("resultContainer").innerHTML = finalHMTL;
}

function arraySum(array) {
    var sum = 0;
    for(var i = 0; i < array.length; i++) {
        sum += array[i];
    }
    
    return sum;
}

function getUrlVars() {var vars = {};var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {if(vars[key]){if(vars[key] instanceof Array){vars[key].push(value);}else{vars[key] = [vars[key], value];}}else{vars[key] = value;}});return vars;}
    
