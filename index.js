//Copyright 2022 Gilgamech Technologies
//Title: Basic Webserver
//Made by: Stephen Gillie
//Created on: 6/17/2022
//Updated on: 7/3/2022
//Notes: The goal for CrudRest is to be, in different modes, a webserver, database, load balancer, in-memory cache, message queue, pub sub hub, login IdP, password manager, and a variety of other uses.

const http = require("http");
const https = require("https");
const fs = require('fs');
const url  = require('url');
const serverPort = 80;//443;
const crudRestDataFile = "/home/app/CrudRestStorage.txt"

var error404 = "404 Not Found";
var error405 = "405 Method Not Allowed.";
var pagename = "/index.html";
var optionsData = 'HTTP/1.1 200 OK\nAllow: GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS\nAccess-Control-Allow-Origin: https://Gilgamech.com\nAccess-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS\nAccess-Control-Allow-Headers: Content-Type'
const files = fs.readdirSync("/home/app"); 

var sites = new Object();
fs.readFile(crudRestDataFile, 'utf8', function (err,data) {
	if (err) {
		console.log(err);
	} else {
		sites =  data;
	}
});
//Valid Actions: fs (read file), uri (caching proxy), math (transform PutData), PutData (read PutData)
sites["/index.html"] = {"URI":"/index.html","Action":"fs~/index.html","Owner":"Gilgamech","AccessList":{"Everyone":["GET", "HEAD", "OPTIONS", "MERGE"]},"notes":"","PutData":""};
sites["/favicon.ico"] = {"URI":"/favicon.ico","Action":"fs~/favicon.ico","Owner":"Gilgamech","AccessList":{"Everyone":["GET", "HEAD", "OPTIONS", "MERGE"]},"notes":"","PutData":""};
sites["/Gilgamech.html"] = {"URI":"/Gilgamech.html","Action":"uri~GET~https://www.Gilgamech.com~0","Owner":"Gilgamech","AccessList":{"Everyone":["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"]},"notes":"","PutData":""};
sites["/increment"] = {"URI":"/increment","Action":"math~PutData++","Owner":"Gilgamech","AccessList":{"Everyone":["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"]},"notes":"","PutData":1};
sites["/decrement"] = {"URI":"/decrement","Action":"math~PutData--","Owner":"Gilgamech","AccessList":{"Everyone":["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"]},"notes":"","PutData":1000000};

sites["/FruitBotwin"] = {"URI":"/increment","Action":"math~PutData++","Owner":"Gilgamech","AccessList":{"Everyone":["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"]},"notes":"","PutData":1};
sites["/FruitBotloss"] = {"URI":"/increment","Action":"math~PutData++","Owner":"Gilgamech","AccessList":{"Everyone":["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"]},"notes":"","PutData":1};
sites["/FruitBottie"] = {"URI":"/increment","Action":"math~PutData++","Owner":"Gilgamech","AccessList":{"Everyone":["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"]},"notes":"","PutData":1};
sites["/FruitBottotals"] = {"URI":"/increment","Action":"text~[{FruitBotwins: %FruitBotwin, botstie: %FruitBottie, simplebotwins: %FruitBotloss }];","Owner":"Gilgamech","AccessList":{"Everyone":["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"]},"notes":"","PutData":1};

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
	var userName = "Everyone"
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
		sites[pagename] = {"URI":pagename,"Action":"fs~"+pagename,"Owner":"","AccessList":{"Everyone":["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"]},"notes":"","PutData":""};
	}

	if (sites[pagename].AccessList[userName].includes(request.method)) {
		let body = '';
		switch(request.method) {
			case "HEAD":
				response.writeHead(statusCode, {'Content-Type': contentType});
				response.end();
				break; //end HEAD
			case "GET":
			var splitAction = sites[pagename].Action.split("~");
			switch(splitAction[0]) {
				case "uri":
//List of URLs - LB between them. Format is url:Verb:URL:CacheExpiry,
					var expiry = splitAction[3];
					if (sites[pagename].PutData == "") {
						webRequest(splitAction[1], splitAction[2],function(data){
							sites[pagename].PutData = data;
							responseData = sites[pagename].PutData;
							response.writeHead(statusCode, {'Content-Type': contentType});
							response.end(responseData);
						});
					} else {
						responseData = sites[pagename].PutData;
						response.writeHead(statusCode, {'Content-Type': contentType});
						response.end(responseData);
					}
					break;//end uri
				case "fs":
//List of files, LB between them? 
					fs.readFile("/home/app"+splitAction[1], function (err,data) {
						if (err) {
							console.log("404 error: "+splitAction[1]+" not found.");
							response.writeHead(404, {'Content-Type': 'text/html'});
							response.end(error404);
						}
						responseData = data;
						response.writeHead(statusCode, {'Content-Type': contentType});
						response.end(responseData);
					});
					break;//end fs
				case "math":
					switch(splitAction[1]) {
						case "PutData++":
							sites[pagename].PutData++;
							responseData = sites[pagename].PutData;
							responseData = JSON.stringify(responseData);
							break;//end ++
						case "PutData--":
							sites[pagename].PutData--;
							responseData = sites[pagename].PutData;
							responseData = JSON.stringify(responseData);
							break;//end --
//data/2 divides it in half. Performs the operation then serves. 
						default://splitAction[1]
							responseData = "Unsupported Operation in Math Action.";
							break;
					}//end switch splitAction[1]
					response.writeHead(statusCode, {'Content-Type': contentType});
					response.end(responseData);
					break;//end math
					case "text":
						responseData = splitAction[1].replace("PutData",sites[pagename].PutData).replace("%FruitBotwin",sites["/FruitBotwin"].PutData).replace("%FruitBottie",sites["/FruitBottie"].PutData).replace("%FruitBotloss",sites["/FruitBotloss"].PutData)
	//"Action":"text~[{FruitBotwins: %FruitBotwin, botstie: %FruitBottie, simplebotwins: %FruitBotloss }];"
						response.writeHead(statusCode, {'Content-Type': contentType});
						response.end(responseData);
					break;//end text
				default://splitAction[0]
						responseData = sites[pagename].PutData;
						if (typeof responseData == "number"){
							responseData = JSON.stringify(responseData);
						}
						response.writeHead(statusCode, {'Content-Type': contentType});
						response.end(responseData);
					break;
				}//end switch splitAction[0]
				break; //end GET
			case "PUT":
				request.on('data', chunk => {
					body += chunk.toString(); // convert Buffer to string
				});
				request.on('end', () => {
					var inputData = JSON.parse(body);
				try {
					statusCode=400;
					if (pagename != inputData.URI) {
						responseData = request.method+JSON.stringify(sites[pagename])+" failed: URI does not match server location.";
						console.log(request.method+" failed from "+request.socket.remoteAddress+" for page "+pagename+" : URI does not match server location.");
						response.writeHead(statusCode, {'Content-Type': contentType});
						response.end(responseData);
					} else if (inputData.AccessList == "") {
						responseData = request.method+JSON.stringify(sites[pagename])+" failed: AccessList too short.";
						console.log(request.method+" failed from "+request.socket.remoteAddress+" for page "+pagename+" : AccessList too short.");
						response.writeHead(statusCode, {'Content-Type': contentType});
						response.end(responseData);
					} else if (inputData.Action == "") {
						responseData = request.method+JSON.stringify(sites[pagename])+" failed: Action too short.";
						console.log(request.method+" failed from "+request.socket.remoteAddress+" for page "+pagename+" : Action too short.");
						response.writeHead(statusCode, {'Content-Type': contentType});
						response.end(responseData);
					} else {
						statusCode=200;
						sites[pagename] = inputData;
						dataSave(sites);
						responseData = request.method+JSON.stringify(sites[pagename])+" successful";
						console.log(request.method+" complete from "+request.socket.remoteAddress+" for page "+pagename);
						response.writeHead(statusCode, {'Content-Type': contentType});
						response.end(responseData);
					}; //end if pagename
				} catch (err) {
					statusCode=400;
					responseData = request.method+JSON.stringify(sites[pagename])+" failed: "+err;
					console.log(request.method+" failed from "+request.socket.remoteAddress+" for page "+pagename+" : "+err);
					response.writeHead(statusCode, {'Content-Type': contentType});
					response.end(responseData);
				} //end try
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
					responseData = request.method+JSON.stringify(sites[pagename].URI);
					console.log(request.method+" complete from "+request.socket.remoteAddress+" for page "+pagename);
					
					response.writeHead(statusCode, {'Content-Type': contentType});
					response.end(responseData);
				});
				break; //end POST
			case "DELETE":
				sites[pagename] = null;
				dataSave(sites);
				responseData = request.method+pagename+" successful";
				
				response.writeHead(statusCode, {'Content-Type': contentType});
				response.end(responseData);
				break; //end DELETE
			case "MERGE":
				responseData = JSON.stringify(sites[pagename]);
				
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

function dataSave(dict) {
	fs.writeFile(crudRestDataFile, JSON.stringify(dict), (err) => {
		if (err) {
			console.log(err);
		}
	});
	console.log("dataSave");
}

function dataLoad(dict,callback) {
	fs.readFile(crudRestDataFile, 'utf8', function (err,data) {
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

