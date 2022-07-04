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

var error404 = "<HTML><body>404 Not Found</body><HTML>";
var error405 = "<HTML><body>405 Method Not Allowed.</body><HTML>";
var pagename = "/index.html";
var optionsData = 'HTTP/1.1 200 OK\nAllow: GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS\nAccess-Control-Allow-Origin: https://Gilgamech.com\nAccess-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS\nAccess-Control-Allow-Headers: Content-Type'
const files = fs.readdirSync("/home/app");

var sites = new Object();


//Valid actions: fs (read file), uri (caching proxy), math (transform PutData), PutData (read PutData)
sites["/index.html"] = {"URI":"/index.html","Action":"fs~/index.html","Owner":"Gilgamech","AccessList":"","allowedVerbs":["GET","HEAD","OPTIONS","MERGE"],"notes":"","PutData":""};
sites["/favicon.ico"] = {"URI":"/favicon.ico","Action":"fs~/favicon.ico","Owner":"Gilgamech","AccessList":"","allowedVerbs":["GET","HEAD","OPTIONS","MERGE"],"notes":"","PutData":""};
sites["/Gilgamech.html"] = {"URI":"/Gilgamech.html","Action":"uri~GET~https://www.Gilgamech.com~0","Owner":"Gilgamech","AccessList":"","allowedVerbs":["GET","HEAD","OPTIONS","POST","PUT","DELETE","MERGE"],"notes":"","PutData":""};
sites["/increment"] = {"URI":"/increment","Action":"math~PutData++","Owner":"Gilgamech","AccessList":"","allowedVerbs":["GET","HEAD","OPTIONS","POST","PUT","DELETE","MERGE"],"notes":"","PutData":1};
sites["/decrement"] = {"URI":"/decrement","Action":"math~PutData--","Owner":"Gilgamech","AccessList":"","allowedVerbs":["GET","HEAD","OPTIONS","POST","PUT","DELETE","MERGE"],"notes":"","PutData":1000000};


fs.readFile("/home/app/custerr/404.htm", 'utf8', function (err,data) {
	error404 =  data;
	if (err) {
		console.log(err);
	}
});

const server = http.createServer((request, response) => {
	var statusCode = 200;
	var responseData = "";
	var contentType = 'text/plain';
	var encodingType = '';
	console.log(request.method+" request from "+request.socket.remoteAddress+" for page "+pagename);

	if (request.url=='/'){
		pagename = "/index.html";
	} else {
		pagename = request.url;
	};

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
		break;
	}//end switch pagename
	
	if (sites[pagename] == null) {
		console.log("New page "+pagename);
		sites[pagename] = new Object();
		sites[pagename].URI = pagename;
		sites[pagename].Action = "fs~"+pagename;
		sites[pagename].Owner = "";
		sites[pagename].AccessList = "";
		sites[pagename].allowedVerbs = ["GET","HEAD","OPTIONS","POST","PUT","DELETE","MERGE"]
		sites[pagename].notes = "";
		sites[pagename].PutData = "";
	}

	if (sites[pagename].allowedVerbs.includes(request.method)) {
		response.writeHead(statusCode, {'Content-Type': contentType});
		let body = '';
		switch(request.method) {
			case "HEAD":
				response.end();
				break; //end HEAD
			case "GET":
//URL redirect / cache. list of URLs - LB between them. Format is url:Verb:URL:CacheExpiry,
//Filesystem redirect / cache. List of files, LB between them? Format is fs:/filename.ext, everything lives under /home/app?
//data++ increments the data (hope it's an int!) data-- decriments, will come up with a list.  data/2 divides it in half. Performs the operation then serves. 
//how to perform operation on remote data? Like get int from URL, divide by 2? (Verb:URL:CacheExpiry) / 2
//blank or just "$PutData" is serve put data
//if "$PutData" isn't in actions, then it ignores the put data. 

				var splitAction = sites[pagename].Action.split("~");
				switch(splitAction[0]) {
					case "uri":
						var expiry = splitAction[3];
						if (sites[pagename].PutData == "") {
							webRequest(splitAction[1], splitAction[2],function(data){
								sites[pagename].PutData = data;
								responseData = sites[pagename].PutData;
								response.end(responseData);
							});
						} else {
							responseData = sites[pagename].PutData;
							response.end(responseData);
						}
						break;
					case "fs":
						fs.readFile("/home/app"+splitAction[1], function (err,data) {
							responseData = data;
							response.end(responseData);
							if (err) {
								console.log(err);
							}
						});
						break;
					case "math":
						switch(splitAction[1]) {
							case "PutData++":
								sites[pagename].PutData++;
								responseData = sites[pagename].PutData;
								responseData = JSON.stringify(responseData);
								break;
							case "PutData--":
								sites[pagename].PutData--;
								responseData = sites[pagename].PutData;
								responseData = JSON.stringify(responseData);
								break;
							default:
								responseData = "Bad Math";
								break;
						}//end switch splitAction[1]
						response.end(responseData);
					default:
						responseData = sites[pagename].PutData;
						if (typeof responseData == "number"){
							responseData = JSON.stringify(responseData);
						}
						response.end(responseData);
						break;
				}//end switch splitAction[0]
				};//end if sites
				break; //end GET
			case "PUT":
				request.on('data', chunk => {
					body += chunk.toString(); // convert Buffer to string
				});
				request.on('end', () => {
					sites[pagename] = JSON.parse(body);
					dataSave(sites);
					responseData = "<HTML><body>Upsert "+JSON.stringify(sites[pagename])+"</body><HTML>";
					console.log(request.method+" complete from "+request.socket.remoteAddress+" for page "+pagename);
					response.end(responseData);
				});
				break; //end PUT
			case "POST":
				request.on('data', chunk => {
					body += chunk.toString(); // convert Buffer to string
				});
				request.on('end', () => {
					if (sites[pagename] == null) {
						console.log(pagename+" empty, populating.")
						sites[pagename].PutData = body;
					} else {
						console.log(pagename+" exists, appending.")
						sites[pagename].PutData += body;
					}
					dataSave(sites);
					responseData = "<HTML><body>Upsert "+JSON.stringify(sites[pagename].URI)+"</body><HTML>";
					console.log(request.method+" complete from "+request.socket.remoteAddress+" for page "+pagename);
					
					response.end(responseData);
				});
				break; //end POST
			case "DELETE":
				responseData = "<HTML><body>Delete "+pagename+"</body><HTML>";
				sites[pagename] = null;
				dataSave(sites);
				
				response.end(responseData);
				break; //end DELETE
			case "MERGE":
				responseData = JSON.stringify(sites[pagename]);
				
				response.end(responseData);
				break; //end POST
			case "OPTIONS":
				responseData = optionsData;
					
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

function dataSave(dict) {
	fs.writeFile("/home/app/CrudRestStorage.txt", JSON.stringify(dict), (err) => {
		if (err) {
			console.log(err);
		}
	});
	console.log("dataSave");
}

function dataLoad(dict,callback) {
	fs.readFile("/home/app/CrudRestStorage.txt", 'utf8', function (err,data) {
		callback = JSON.parse(data);
		if (err) {
			console.log(err);
		}
	});
	console.log("dataRead");
}

function webRequest(method, location, callback, JSON,file,cached) {
	var port = 80;
	var locationSplit = location.split(":");
	var protocol = locationSplit[0]
	if (protocol == "https"){
		port = 443;
	}
	var locationSplit2 = locationSplit[1].split("/");
	var host = locationSplit2[2]
	var path = "/"+locationSplit2.slice(3,locationSplit2.length).join("/")
console.log(protocol+" request method "+method+" for path "+path+" from host "+host+" on port "+port)

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
		break;
	}//end switch pagename

	var $headers = {};
	switch (method) {
		case "POST":
		$headers= {
			'Content-Type': 'text/plain',
			'Content-Length': Buffer.byteLength($file)
		}
		break;
	case 'GET':
		$headers= {
			'Content-Type': 'application/json'
		}
		break;
	case 'PUT':
		$headers= {
			'Content-Type': 'application/json',
			'Content-Length': Buffer.byteLength($file)
		}
		break;
	default:
		$headers= {
			'Content-Type': 'application/json'
		}
		break;
	};
	const options = {
	  host: host,
	  port: port,
	  path: path,
	  method: method,
	  headers: $headers
	};

	const req = https.request(options, res => {
		console.log(`statusCode: ${res.statusCode}`);
		var returnVar = '';
		res.setEncoding(encodingType);
		res.on('data', function (chunk) {
			returnVar += chunk;
		});
		res.on('end', function () {
			if (JSON) {
				returnVar = JSON.parse(returnVar);
			};
			callback(returnVar);
		});
	});
	req.on('error', error => {
		var errMsg = "problem with request: ${error.message}"
		console.error(errMsg);
	});
	if (file) {
		req.write(file);
	};
	req.end();
};

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

