//Copyright 2022 Gilgamech Technologies
//Title: Basic Webserver
//Made by: Stephen Gillie
//Created on: 6/17/2022
//Updated on: 6/30/2022
//Notes: The goal for CrudRest is to be, in different modes, a webserver, database, load balancer, in-memory cache, message queue, pub sub hub, login IdP, password manager, and a variety of other uses.

const http = require("http");
const https = require("https");
const fs = require('fs');
const url  = require('url');
const serverPort = 80;//443;

var sites = new Object();
var siteOptions = new Object();

sites["/index.html"] = '<!DOCTYPE html> <html lang="en"> <head> <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/> <link rel="shortcut icon" href="http://www.gilgamech.com/images/favicon.ico" type="image/x-icon"/> <meta name="viewport" content="width=device-width, initial-scale=1"> <title>Gilgamech Technologies</title> <script src="http://www.gilgamech.com/FruitBot/seedrandom.js"></script> <script src="http://www.gilgamech.com/FruitBot/board.js"></script> <script src="http://www.gilgamech.com/FruitBot/grid.js"></script> <script src="http://www.gilgamech.com/FruitBot/mybot.js"></script> <script src="http://www.gilgamech.com/FruitBot/simplebot.js"></script> <script src="http://www.gilgamech.com/FruitBot/player.js"></script> <script src="http://www.gilgamech.com/js/thirdparty/jquery.min.js"></script> <link href="http://www.gilgamech.com/css/normalize.css" rel="stylesheet" type="text/css"> <link href="http://www.gilgamech.com/css/Gilgamech.css" rel="stylesheet" type="text/css"> </head> <body> <div id="titleParent" class="titleContainer"> <a class="pageTitle " href="/">Gilgamech Technologies</a> </div> <div id="headWrapper"> <script> <!-- SCRIPTS GO HERE --> </script> <style> <!-- CSS CLASSES GO HERE --> </style> </div> <div id="navContainer"> <nav> <ul> <li><a>Blog ▼</a> <ul> <li><a href="/blog.html">June 2022</a></li> <li><a>2022 ▼</a><ul> <li><a href="/2022/May.html">May 2022</a></li> <li><a href="/2022/April.html">Apr 2022</a></li> <li><a href="/2022/March.html">Mar 2022</a></li> <li><a href="/2022/February.html">Feb 2022</a></li> <li><a href="/2022/January.html">Jan 2022</a></li> </ul></li> <li><a>2021 ▼</a><ul> <li><a href="/2021/December.html">Dec 2021</a></li> <li><a href="/2021/November.html">Nov 2021</a></li> <li><a href="/2021/October.html">Oct 2021</a></li> <li><a href="/2021/September.html">Sept 2021</a></li> <li><a href="/2021/August.html">August 2021</a></li> <li><a href="/2021/July.html">July 2021</a></li> </ul></ul></li> <li><a href="/history.html">World History</a></li> <li><a>Stuff ▼</a><ul> <li><a href="/Gillogisms.html">Gillogisms</a></li> <li><a>Gaming ▼</a><ul> <li><a href="/InGameItem.html">Ingame Items</a></li> <li><a href="/Android.html">Android</a></li> </ul></li> <li><a>Tools ▼</a><ul> <li><a href="/calc.html">Calculators</a></li> <li><a href="/WhyIsItDown.html">Whys It Down?</a></li> <li><a href="/errorcause.html">Error Causes</a></li> </ul></li> </ul></li> <li><a href="/contact.html">Contact</a></li> </ul></li> </nav> </div> <div id="content"> <canvas id="game_view"></canvas> <script>GamePlay.init();</script>  </div><!-- End Content--> <div id="footWrapper"> <div class="container-fluid"> </div> <div id="spacerName"> <br> <br> </div> <div id="errDiv" class="row img-rounded"> </div> <div id="footerStatic" class="navbar-static-bottom" style="text-align: center;"> <p class="copyright">© 2013-2022 Gilgamech Technologies - We are the gears that make our world go around.</p> </div> </div> </body> </html>'

siteOptions["/index.html"] = new Object();
siteOptions["/index.html"].URI = "/index.html";
siteOptions["/index.html"].Action = "";
siteOptions["/index.html"].Owner = "Gilgamech";
siteOptions["/index.html"].AccessList = "";
//how to allow only certain permission levels to do something? 
siteOptions["/index.html"].allowedVerbs = ["GET","HEAD","OPTIONS"]
//Default, Get, Head, Post, Put, Delete, Trace, Options, Merge, Patch"
siteOptions["/index.html"].notes = "";

siteOptions["/favicon.ico"] = new Object();
siteOptions["/favicon.ico"].URI = "/favicon.ico";
siteOptions["/favicon.ico"].Action = "";
siteOptions["/favicon.ico"].Owner = "Gilgamech";
siteOptions["/favicon.ico"].AccessList = "";
//how to allow only certain permission levels to do something? 
siteOptions["/favicon.ico"].allowedVerbs = ["GET","HEAD","OPTIONS"]
//Default, Get, Head, Post, Put, Delete, Trace, Options, Merge, Patch"
siteOptions["/favicon.ico"].notes = "";

var responseData = "Hola Mundo";
var error404 = "<HTML><body>404 Not Found</body><HTML>";
var error405 = "<HTML><body>405 Method Not Allowed.</body><HTML>";
var pagename = "/index.html";
var optionsData = 'HTTP/1.1 200 OK\nAllow: GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS\nAccess-Control-Allow-Origin: https://Gilgamech.com\nAccess-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS\nAccess-Control-Allow-Headers: Content-Type'
var statusCode = 200;
const files = fs.readdirSync("/home/app");

fs.readFile("/home/app/custerr/404.htm", 'utf8', function (err,data) {
	error404 =  data;
	if (err) {
		console.log(err);
	}
});

const server = http.createServer((request, response) => {
	statusCode = 200;

	console.log(request.method+" request from "+request.socket.remoteAddress+" for page "+pagename);

	if (request.url=='/'){
		pagename = "/index.html";
	} else {
		pagename = request.url;
	};

	var contentType = 'text/plain';
	var encodingType = '';
	switch(pagename.split(".")[1]) {
	  case "css":
		contentType = 'text/css'
		break;
	  case "gif":
		contentType = 'image/gif'
		break;
	  case "htm":
		contentType = 'text/html'
		break;
	  case "html":
		contentType = 'text/html'
		break;
	  case "ico":
		contentType = 'image/x-icon'
		break;
	  case "jpg":
		contentType = 'image/jpeg'
		break;
	  case "js":
		contentType = 'application/javascript'
		break;
	  case "pdf":
		contentType = 'application/pdf'
		break;
	  case "png":
		contentType = 'image/png'
		break;
	  case "scad":
		break;
	  case "txt":
		break;
	  case "png":
		contentType = 'image/png'
		break;
	  default:
	}//end switch pagename
	
	if (siteOptions[pagename] == null) {
		console.log("New page "+pagename);
		siteOptions[pagename] = new Object();
		siteOptions[pagename].URI = pagename;
		siteOptions[pagename].Action = "";
		siteOptions[pagename].Owner = "";
		siteOptions[pagename].AccessList = "";
		siteOptions[pagename].allowedVerbs = ["GET","HEAD","OPTIONS","POST","PUT","DELETE","MERGE"]
		siteOptions[pagename].notes = "";
	}

	if (siteOptions[pagename].allowedVerbs.includes(request.method)) {
		let body = '';
		switch(request.method) {
			case "HEAD":
				response.writeHead(statusCode, {'Content-Type': contentType});
				response.end();
				break; //end HEAD
			case "GET":
				if (sites[pagename] == null) {
					response.writeHead(404, {'Content-Type': 'text/html'});
					response.end(error404);
				}else{
					responseData = readUpstream(pagename  , sites);
					response.writeHead(statusCode, {'Content-Type': contentType});
					response.end(responseData);
				};//end if sites
				break; //end GET
			case "PUT":
				request.on('data', chunk => {
					body += chunk.toString(); // convert Buffer to string
				});
				request.on('end', () => {
					if (siteOptions[pagename] == null) {
						console.log(pagename+" empty, populating.")
						siteOptions[pagename] = body;
					} else {
						console.log(pagename+" exists, appending.")
						siteOptions[pagename] += body;
					}
					dataSave(siteOptions);
					responseData = "<HTML><body>Upsert "+siteOptions[pagename]+"</body><HTML>";
					console.log(request.method+" complete from "+request.socket.remoteAddress+" for page "+pagename);
					response.writeHead(statusCode, {'Content-Type': contentType});
					response.end(responseData);
				});
				break; //end PUT
			case "POST":
				request.on('data', chunk => {
					body += chunk.toString(); // convert Buffer to string
				});
				request.on('end', () => {
//must be in JSON format, listing URI, action on data, list of users who can modify, if public or private, notes. URI must match or upload fails.
//URL - redirect / cache there. list of URLs - LB between them. Format is Verb:URL:CacheExpiry,
//data++ increments the data (hope it's an int!) data-- decriments, will come up with a list.  data/2 divides it in half. Performs the operation then serves. 
//how to perform operation on remote data? Like get int from URL, divide by 2? (Verb:URL:CacheExpiry) / 2
//blank or just "$PutData" is serve put data
//if "$PutData" isn't in actions, then it ignores the put data. 
					sites[pagename] = body;
					dataSave(sites);
					responseData = "<HTML><body>Upsert "+sites[pagename]+"</body><HTML>";
					console.log(request.method+" complete from "+request.socket.remoteAddress+" for page "+pagename);
					
					response.writeHead(statusCode, {'Content-Type': contentType});
					response.end(responseData);
				});
				break; //end POST
			case "DELETE":
				responseData = "<HTML><body>Delete "+pagename+"</body><HTML>";
				sites[pagename] = null;
				dataSave(sites);
				
				response.writeHead(statusCode, {'Content-Type': contentType});
				response.end(responseData);
				break; //end DELETE
			case "MERGE":
				responseData = JSON.stringify(siteOptions[pagename]);
				
				response.writeHead(statusCode, {'Content-Type': contentType});
				response.end(responseData);
				break; //end POST
			case "OPTIONS":
				responseData = optionsData;
					
				response.writeHead(statusCode, {'Content-Type': contentType});
				response.end(responseData);
				break; //end POST
			default:
				response.writeHead(405, {'Content-Type': 'text/html'});
				response.end(error405);
				break; //end default
		}//end switch
	} else {
		response.writeHead(405, {'Content-Type': 'text/html'});
		response.end(error405);
	}
})

server.listen((serverPort), () => {
    console.log("Server is Running on port "+serverPort);
})

function readUpstream(path, dict) {
	return dict[path];
}// end readUpstream

function writeDownstream(path, method, body) {
	console.log(body);
}// end writeDownstream

function dataSave(dict) {
	fs.writeFile("CrudRestStorage.txt", dict, (err) => {
		if (err) {
			console.log(err);
		}
	});
	writeDownstream("/log", "PUT", "dataSave");
}

function webRequest(method, location, callback, JSON,file,cached) {
	var locsplit = loc.split(":").split("/")
	var locsplit2 =locsplit[1].split("/")
	var port
	if (locsplit[0] == "https"){
		port = 443;
	} else {
		port = 80;
	}
	locsplit2.shift();
	locsplit2.shift();//This tosses out the first 2 blank array entries.
	var host = locsplit2[0]
	locsplit2.shift();//This one tosses out the host, so only the path is left.
	var path = locsplit2.join("/")

	var contentType = 'text/plain';
	var encodingType = '';
	switch(pagename.split(".")[1]) {
	  case "css":
		contentType = 'text/css'
		break;
	  case "gif":
		contentType = 'image/gif'
		break;
	  case "htm":
		contentType = 'text/html'
		break;
	  case "html":
		contentType = 'text/html'
		break;
	  case "ico":
		contentType = 'image/x-icon'
		break;
	  case "jpg":
		contentType = 'image/jpeg'
		break;
	  case "js":
		contentType = 'application/javascript'
		break;
	  case "pdf":
		contentType = 'application/pdf'
		break;
	  case "png":
		contentType = 'image/png'
		break;
	  case "scad":
		break;
	  case "txt":
		break;
	  case "png":
		contentType = 'image/png'
		break;
	  default:
	}//end switch pagename

	const options = {
	  host: host,
	  port: port,
	  path: path,
	  method: method,
	  headers: {
		'Content-Type': contentType,
		'Content-Length': data.length
	  }
	};

	const req = https.request(options, res => {
		console.log(`statusCode: ${res.statusCode}`);

		var msg = '';
		res.setEncoding('utf8');
		res.on('data', d => {
			process.stdout.write(d);
		});
	});
	if (JSON) {data = JSON.parse(data)};

	request.on('error', error => {
	  console.error(error);
	});


	if(data) {req.write(data)};
	req.end();

}// end webRequest
function refreshKey($user,$sessionID,$sessionKey,$callback) {
	sparational.sequelize.query("SELECT sessionuser FROM Sessions WHERE sessionid = '"+$sessionID+"';").then(([$SessionResults, metadata]) => {
//console.log(JSON.stringify($SessionResults))
		if ($user==$SessionResults[0].sessionuser) {


		$sessionID = getBadPW()
		$sessionKey = getBadPW()
		$output = ""+$user+":" + $sessionID +":" + $sessionKey 
		sparational.sequelize.query("UPDATE Sessions SET logintime = current_timestamp, sessionid = '"+$sessionID+"', sessionkey = '"+$sessionKey+"' WHERE sessionuser='"+$user+"';INSERT INTO Sessions (sessionuser, sessionid,sessionkey) SELECT '"+$user+"','"+$sessionID+"','"+$sessionKey+"' WHERE NOT EXISTS (SELECT 1 FROM Sessions WHERE sessionuser='"+$user+"');").then(([$SessionResults, metadata]) => {
		
			var $output = $user + ":" + $sessionID + ":" + $sessionKey
			$callback($output)

		}).catch(function(err) {
			var $output = "Invalid refreshKey attempt: "+$user
			writeLog($output+" error: "+ err.message +" - sessionID: " + $sessionID)
			$callback($output)
		})//end Pages query


		} else {
			var $output = "Invalid starspar attempt: bad session key for user: "+$user
			writeLog($output+" sessionID: " + $sessionID)
			$callback($output)
		}//end if user
	}).catch(function(err) {
		var $output = "Session error: "+err.message
		writeLog($output)
		$callback($output)
	});//end Session query

};
function checkKey($user,$sessionID,$sessionKey,$callback) {
	sparational.sequelize.query("SELECT sessionuser FROM Sessions WHERE sessionid = '"+$sessionID+"';").then(([$sessionuser, metadata]) => {
//console.log(JSON.stringify($sessionuser))
		if ($user==$sessionuser[0]) {
		var $output = $sessionuser[0] + ":" + $sessionID + ":" + $sessionKey
		$callback($output)

		} else {
			var $output = "Invalid checkKey attempt: "+$user
			writeLog($output+" - sessionID: " + $sessionID)
			$callback($output)
		}//end if user
	}).catch(function(err) {
		var $output = "Invalid checkKey attempt: "+$user
		writeLog($output+" error: "+ err.message +" - sessionID: " + $sessionID)
		$callback($output)
	});//end Session query

};

