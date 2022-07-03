// index.JS
// Comments are fundamental
// aSecretToEverybody

//{ Init vars
var $ver = 400
var sparational = require("sparational");
sparational.sequelize = new sparational.Sequelize(process.env.DATABASE_URL || 'postgres://postgres:dbpasswd@127.0.0.1:5432/postgres');
var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var session = require("express-session");
var $AWS = require('aws-sdk');
var stripe = require("stripe")(process.env.STRIPE_KEY || 'sk_test_abcdef1234567890');
const { Client } = require('pg');

var $basePrice = Math.random()*10
var $chatChannel = [];
var $chatMessage = [];

var pg = require('pg').native;
var pghstore = require('pg-hstore');

var app = express();
var User = sparational.sequelize.import('./User');
User.sync();

var $privateBucket = "gilprivate";
var $privateParams = {Bucket: $privateBucket};

$AWS.config.update({
    "accessKeyId": process.env.AWS_S3_KEY || "AAAAAAAAAAAAA", 
    "secretAccessKey": process.env.AWS_S3_SECRET_KEY || "rc0jbosmx9o09gf72ov1xkp0dz2tirm6",
    "region": process.env.AWS_S3_REGION || "us-east-1"
});

var $s3 = new $AWS.S3({
  apiVersion: '2006-03-01',
  params: $privateParams
});

$s3.createBucket($privateParams);

var $userPWHTable;
var $pageSettingsJson;
var $aclTable;

var $urlPWHParams = {
	Bucket: $privateBucket, 
	Key: 'userPWHTable.json'
};
$s3.getObject($urlPWHParams, function(err, dataStream){
try {
	
	$userPWHTable = JSON.parse(dataStream.Body.toString('utf-8'));
	//addErr(JSON.stringify($userPWHTable));
	if (err) {
		addErr(err);
	};// end if err
}	catch(e){console.log(e)};
});// end s3 getObject

sparational.siteVar = {
    apiVersion: $ver, 
    deviceType: "null",
	basePrice : Math.random(1.25,9),
    chatGeneral: "", 
    awsS3Key: "",
    clientIP: "",
    errgoLogic: "--- Err and Log Output --- ",
    fruitbotwin:0,
    fruitbotloss:0,
    fruitbottie:0,
    googleApiKey: process.env.GOOGLE_API_KEY || 'aSecretToEverybody',
    session: "",
    userName: "Login"
};
// PostGre SQL stuff.
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});
client.connect();
client.query('SELECT table_name FROM information_schema.tables;', (err, queryOutput) => {
  sparational.siteVar.chatGeneral += "Connected successfully to server";
  if (err) addErr((err));
  addErr(("Connected successfully to DB server"));
});

User.findAll().then(users => {
  sparational.siteVar.chatGeneral = sparational.siteVar.chatGeneral + 'SELECT FROM Users\n\r';
  addErr((users));
});

var $serverParams = {
	Bucket: $privateBucket, 
	Key: 'settings.json'
};
$s3.getObject($serverParams, function(err, dataStream){
try {
	
	sparational.siteVar = JSON.parse(dataStream.Body.toString('utf-8'));
	addErr(JSON.stringify(sparational.siteVar));
	if (err) {
		addErr(err);
	};// end if err
}	catch(e){console.log(e)};
});// end s3 getObject

var $aclParams = {
	Bucket: $privateBucket, 
	Key: 'ACL.json'
};
$s3.getObject($aclParams, function(err, dataStream){
try {
	
	$aclTable = JSON.parse(dataStream.Body.toString('utf-8'));
	//addErr(JSON.stringify($aclTable));
	if (err) {
		addErr(err);
	};// end if err
}	catch(e){console.log(e)};
});// end s3 getObject

$s3.getSignedUrl('getObject', $urlPWHParams, function(err, url){
    addErr('the url is ' + url);
});
var $publicBucket = "gilpublic";
sparational.siteBase = "https://s3.amazonaws.com/" + $publicBucket;
var $publicParams = {Bucket: $publicBucket};
//}

//{ app init
app.use(cookieParser(process.env.PASSPORT_SECRET || 'aSecretToEverybody'));
app.use(bodyParser.urlencoded({ extended: true }));// get information from html forms
app.use(session({
	secret: process.env.PASSPORT_SECRET || 'aSecretToEverybody', 
	resave: true, 
	saveUninitialized: true, 
	maxAge: null
}));
app.use(function(request, response, next) {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

//}

//{ Functions
function getBadPW() {
	return Math.random().toString(36).slice(-20);
 }

function taskScheduler() {
	var $now = Date().toLocaleString();
	for ($task in $taskList) {
		if ($now == $taskList[$task].execTime){
			exec($taskList[$task].scriptBlock);
		};
	};
 };

function addErr(err) {
  sparational.siteVar.errgoLogic += err + "<br>"
};

function newSite($userName) {
	if($userName){
		var $siteName = getBadPW();
		$aclTable.users[$userName].userSites[$siteName] = {"permission":"write"};
		var $putParams = {
			Bucket: $privateBucket,
			Key: "ACL.json", 
			Body: JSON.stringify($aclTable),
			ContentType: "application/json"
		};
		$s3.putObject($putParams, function(err, data) {
			if (err) {
				addErr(err);
			};// end if err
		});// end s3
		return $siteName
	} else {
		return("Please login.");
	}
};

function deleteSite($userName,$siteName) {
	if($userName){
		delete $aclTable.users[$userName].userSites[$siteName];
		var $putParams = {
			Bucket: $privateBucket,
			Key: "ACL.json", 
			Body: JSON.stringify($aclTable),
			ContentType: "application/json"
		};
		$s3.putObject($putParams, function(err, data) {
			if (err) {
				addErr(err);
			};// end if err
		});// end s3
		return($siteName + " deleted");
	} else {
		return("Please login.");
	};
};

function deleteAccount($userName) {
	if($userName){
		delete $aclTable.users[$userName];
		var $putParams = {
			Bucket: $privateBucket,
			Key: "ACL.json", 
			Body: JSON.stringify($aclTable),
			ContentType: "application/json"
		};
		$s3.putObject($putParams, function(err, data) {
			if (err) {
				addErr(err);
			};// end if err
		});// end s3
		return($userName + " deleted");
	} else {
		return("Please login.");
	};
};

function sendS3Url($userName,$siteName,$fileName,$callback,$contentType) {
	if(!$fileName){
		$fileName = $siteName + ".spa"
	};//end if fileName
	if(!$contentType){
		$contentType = "text/plain;charset=UTF-8"
	};//end if fileName
	if($userName){
		addErr(("S3url - user found: " + $userName));
		console.log(("S3url - user found: " + $userName));
		//If you have an ACL
		if ($aclTable.users[$userName].userSites[$siteName].permission == "write") {
			addErr(("S3url site "+$siteName+" for user: " + $userName));
			console.log(("S3url site "+$siteName+" for user: " + $userName));

			var $urlParams = {
				ContentType: $contentType,
				ACL: 'public-read',
				Bucket: $publicBucket, 
				Key: $siteName + "/" + $fileName
			};// end urlParams
			$s3.getSignedUrl('putObject', $urlParams, function(err, url){
				if (err) {
					addErr(err);
				};// end if err
				$callback(url);
				console.log("S3url: " + url);
			});// end s3
			
		};// end if site
	} else {
		console.log("Bad ACL");
		$callback("Please login.");
	}
}
//}

//{ Page calls
app.get(/\S+/, function(request, response) {
	//https://gil-api.herokuapp.com/?p=giltech
	var $userName = request.session.userName;
	var $pagename = request.get('host')
	if ($pagename == "localhost:5000") {
		$pagename = "www.sparational.com"
	};//end if siteName
	sparational.siteVar.userACLTable = [];
   if($userName){
		for ($site in $aclTable.users[$userName].userSites) {
			sparational.siteVar.userACLTable += $site+","
		}
	}else{
	}// end if userName
	sparational.siteVar.clientIP = request.ip;
	sparational.siteVar.googleApiKey= process.env.GOOGLE_API_KEY;

	sparational.html($pagename,function($callback) {
		addErr(("Page load "+$pagename+" for user: " + $userName));
		response.end($callback);
	});
});
//}

//{ POST calls 
app.post('/fruitbotwin', function(request, response){
	$lane = "fruitbotwins"
	sparational.sequelize.query("UPDATE Fruitbot SET "+$lane+"="+$lane+"+1;SELECT * from Fruitbot").then(([$PagesResults, metadata]) => {
		response.send(JSON.stringify($PagesResults))
	}).catch(function(err) {
		console.log($lane+" error" +err.msg); 
		response.send($lane+" error")
	});//end Pages query
});

app.post('/fruitbotloss', function(request, response){
	$lane = "simplebotwins"
	sparational.sequelize.query("UPDATE Fruitbot SET "+$lane+"="+$lane+"+1;SELECT * from Fruitbot").then(([$PagesResults, metadata]) => {
		response.send(JSON.stringify($PagesResults))
	}).catch(function(err) {
		console.log($lane+" error" +err.msg); 
		response.send($lane+" error")
	});//end Pages query
});

app.post('/fruitbottie', function(request, response){
	$lane = "botstie"
	sparational.sequelize.query("UPDATE Fruitbot SET "+$lane+"="+$lane+"+1;SELECT * from Fruitbot").then(([$PagesResults, metadata]) => {
		response.send(JSON.stringify($PagesResults))
	}).catch(function(err) {
		console.log($lane+" error" +err.msg); 
		response.send($lane+" error")
	});//end Pages query
});

app.post('/fruitbottotals', function(request, response){
	$lane = "fruitbottotals"
	sparational.sequelize.query("SELECT * from Fruitbot").then(([$PagesResults, metadata]) => {
		response.send(JSON.stringify($PagesResults))
	}).catch(function(err) {
		console.log($lane+" error" +err.msg); 
		response.send($lane+" error")
	});//end Pages query
});

app.post('/login', function(request, response) {
    var $userName = request.query.username;
    var $enteredPassword = request.query.password;
	addErr(("Login for user: " + $userName));

	if ($userPWHTable[$userName]) {
		$pwhash = $userPWHTable[$userName];
		addErr(("User found: " + $userName));
	  
		bcrypt.compare($enteredPassword, $pwhash, function($err, $userFound) {
			if ($err) {
					addErr($err);
			};//end if err
			if ($userFound) {
				request.session.regenerate(function(err) {
					addErr(("User password matches: " + $userName));
					request.session.userName = $userName;
					console.log(request.session.userName);
					
					sparational.siteVar.userName = request.session.userName;
					sparational.siteVar.clientIP = request.ip;
					sparational.siteVar.googleApiKey= process.env.GOOGLE_API_KEY;
					response.json(sparational.siteVar);

					request.session.userName = "";
					sparational.siteVar.userName = "";
					sparational.siteVar.clientIP = "";
					sparational.siteVar.googleApiKey= "";
				})
			} else {
				addErr(("User password not match: " + $userName));
				response.json("User password not match.");
			};//end if userFound
		});// end bcrypt.compare
	} else {
		//Signup
		addErr(("User not found: " + $userName + " - starting signup."));
		bcrypt.hash($enteredPassword, null, null, function($err, $hash){
		if ($err) {
				addErr($err);
		};//end if err
		  
		$userPWHTable[$userName] = $hash
		var $putParams = {
			Bucket: $privateBucket,
			Key: "userPWHTable.json", 
			Body: JSON.stringify($userPWHTable),
			ContentType: "application/json"
		};
		$s3.putObject($putParams, function(err, data) {
			if (err) {
				addErr(err);
			};// end if err
		});		  
		addErr(("User password stored: " + $userName));
		
		newSite($userName);
		response.json(sendS3Url($userName,$siteName));

	  });// end bcrypt.hash
	};// end if userPWHTable
});// end app post login 

app.post('/logout', function(request, response) {
    var $userName = request.session.userName;
	request.session.destroy(function(err) {
		console.log("User Logout: " + $userName);
		response.json("You have been logged out.");
	})
});

app.post('/newSite', function(request, response){
	var $userName = request.session.userName;
	console.log("New site: " + $userName);
	$siteName = newSite($userName);
	console.log("New site name: " + $siteName);
	sendS3Url($userName,$siteName,'',function(url){response.json(url)});
});

app.post('/deleteSite', function(request, response){
	var $userName = request.session.userName;
    var $siteName = request.query.siteName;
	console.log("Delete site: " + $siteName);
	deleteSite($userName,$siteName);
	console.log("Delete site name: " + $siteName);
	response.send("Site "+$siteName+" deleted")
});

app.post('/deleteAccount', function(request, response){
	var $userName = request.session.userName;
	console.log("Delete account: " + $userName);
	deleteAccount($userName);
	console.log("Delete account name: " + $userName);
	request.session.destroy(function(err) {
		console.log("User Logout: " + $userName);
		response.send("Account "+$userName+" deleted. You have been logged out.");
	})
});

app.post('/s3upload', function(request, response){
   if(request.session.page_views){
      request.session.page_views++;
      response.send("Hi " + request.session.userName+ ", You visited this page " + request.session.page_views + " times");
   } else {
      request.session.page_views = 1;
      response.send("Welcome to this page for the first time, "+request.session.userName+"!");
   }
});

app.post('/upload', function(request, response){
	var $elements = request.query.elements
	$elements = $elements.replace(/~~/g,"#")
	$elements = JSON.parse($elements)
	console.log('elements: '); 
	console.log($elements); 
	if(request.session.userName){
	sparational.sequelize.query("INSERT INTO Pages (pageName, pageTitle, pageDesc, elements) SELECT '"+$elements.pageName+"','"+$elements.pageTitle+"','"+$elements.pageDesc+"','"+JSON.stringify($elements)+"'").then(([$PagesResults, metadata]) => {
response.send(JSON.stringify(metadata))
	}).catch(function(err) {
		console.log('Pages error: '); 
		console.log(err); 
response.send(JSON.stringify(err))
	});//end Pages query
	// } else {
	 }

});
app.post('/s3url', function(request, response){
	var $userName = request.session.userName;
	console.log("Existing site: " + $userName);
    var $siteName = request.query.siteName;
    var $fileName = request.query.fileName;
    var $contentType = request.query.contentType;
	console.log("Existing site name: " + $siteName+" & file name: " + $fileName+" & content name: " + $contentType);
	sendS3Url($userName,$siteName,$fileName,function(url){response.json(url)},$contentType);
});

app.post('/automation', function(request, response){
	var $score = request.query.score;
   if($score = "teal"){
      request.session.page_views++;
      response.send("Hi " + request.session.userName+ ", You visited this page " + request.session.page_views + " times");
   } else {
      request.session.page_views = 1;
      response.send("Welcome to this page for the first time, "+request.session.userName+"!");
   }
});

app.post('/chat', function(request, response){
	var $channel = request.query.channel;
	var $message = request.query.message;
   if(request.session.page_views){
      request.session.page_views++;
      response.send("Hi " + request.session.userName+ ", You visited this page " + request.session.page_views + " times");
   } else {
      request.session.page_views = 1;
      response.send("Welcome to this page for the first time, "+request.session.userName+"!");
   }
});

app.post('/test', function(request, response){
   if(request.session.page_views){
      request.session.page_views++;
      response.send("Hi " + request.session.userName+ ", You visited this page " + request.session.page_views + " times");
   } else {
      request.session.page_views = 1;
      response.send("Welcome to this page for the first time, "+request.session.userName+"!");
   }
});

app.post('/FakeCoin', function(request, response){
   if(request.session.page_views){
      request.session.page_views++;
      response.send("Hi " + request.session.userName+ ", You visited this page " + request.session.page_views + " times");
   } else {
      request.session.page_views = 1;
      response.send("Welcome to this page for the first time, "+request.session.userName+"!");
   }
});

app.post('/WorldHistory', function(request, response){
   if(request.session.page_views){
      request.session.page_views++;
      response.send("Hi " + request.session.userName+ ", You visited this page " + request.session.page_views + " times");
   } else {
      request.session.page_views = 1;
      response.send("Welcome to this page for the first time, "+request.session.userName+"!");
   }
});
//}

//{ Error capture
app.use(function(request, response, next) {
    var err = new Error('Not Found');
    response.status(err.status || 404);
	addErr((request + err));
    response.send('error: '+ err.message)
	next(err);
});

app.use(function(request, response, next) {
    var err = new Error('Not Working');
    response.status(err.status || 500);
	addErr((request + err));
    response.send('error: '+ err.message)
	next(err);
});
//}

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

