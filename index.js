//Copyright 2022 Gilgamech Technologies
//Title: Basic Webserver
//Made by: Stephen Gillie
//Created on: 6/17/2022
//Updated on: 7/11/2022
//Notes: The goal for CrudRest is to be, in different configurations, a webserver, database, load balancer, in-memory cache, message queue, pub sub hub, login IdP, password manager, and a variety of other uses.

//////////////////////// Defaults ////////////////////////
const defaultVerbs = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"];
const defaultOwner = "Gilgamech"
const wwwFolder = "./www/"

const crypto = require('crypto');
const fs = require('fs');
const http = require("http");
const https = require("https");
const url  = require('url');
const serverPort = 80;
const inMemCacheFile = "./inMemCacheFile.txt"
const userFile = "./userFile.txt"

var error405 = "Method Not Allowed.";
var optionsData = 'HTTP/1.1 200 OK\nAllow: GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS\nAccess-Control-Allow-Origin: *\nAccess-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS\nAccess-Control-Allow-Headers: Content-Type'
var mathOperators = ["+","-","*","/"]
var saveDateTime = 0;
var sites = new Object();
var Users = new Object();

fs.readFile(inMemCacheFile, function (err,data) {
	if (err) {
		console.log("inMemCacheFile Read err: "+err);
	} else {
		console.log("inMemCacheFile Read successful.");
		sites = JSON.parse(data);
	}
});

fs.readFile(userFile, function (err,data) {
	if (err) {
		console.log("userFile Read err: "+err);
	} else {
		console.log("userFile Read successful.");
		Users = JSON.parse(data);
	}
});

if (sites["/error.html"] == null) {
	sites["/error.html"] = {"URI":"/error.html","Action":"fs~/error.html","Owner":defaultOwner,"AccessList":{"Everyone":defaultVerbs},"notes":"","Data":"<html><body><h1>Error %statusCode</h1><h3>%statusText</h3><p>Additionally, /error.html gave a 404 Not Found response.</p></body></html>"};
	//dataSave(sites,inMemCacheFile);
}

const server = http.createServer((request, response) => {
	var now = new Date();
	var statusCode = 200;
	var responseData = "";
	var contentType = 'text/plain';
	var encodingType = '';
	var userName = "Everyone"
	var incomingToken = '';
	var allowedVerbs = "";
	var pagename = request.url;
	
	if (sites[pagename] == null) {
		console.log("New page "+pagename);
		sites[pagename] = {"URI":pagename,"Action":"fs~"+pagename,"Owner":defaultOwner,"AccessList":{"Everyone":defaultVerbs},"notes":"","Data":""};
		dataSave(sites,inMemCacheFile);
	}
	var jsonAccessList = JSON.stringify(sites[pagename].AccessList);
	
	try {
		incomingToken = request.headers["token"].split(" ")[1]
		//Users[token] holds the userName, Users[userName] holds the expiry.
		if (Users[Users[incomingToken]].expiry > now.valueOf()) {//If the date is still smaller than the expiry
			userName = Users[incomingToken];
		}
	} catch {}
	console.log("At "+now.toISOString()+" user "+userName+" made "+request.method+" request from "+request.socket.remoteAddress+" for page "+pagename);
	
	if (jsonAccessList.includes("Everyone") && jsonAccessList.includes(userName)){
		allowedVerbs = [...new Set([...sites[pagename].AccessList["Everyone"], ...sites[pagename].AccessList[userName]])]
	} else if (jsonAccessList.includes("Everyone")){
		allowedVerbs = sites[pagename].AccessList["Everyone"]
	} else if (jsonAccessList.includes(userName)){
		allowedVerbs = sites[pagename].AccessList[userName]
	} else {
		//If AccessList contains neither the Everyone keyword, nor the currently logged in user, then there are no valid permissions for this site.
	}; // end if jsonAccessList
	
	if (sites[pagename].Owner == userName){
		allowedVerbs = [...new Set([...allowedVerbs, ...["GET", "HEAD", "OPTIONS", "PUT", "MERGE"]])]
	}
	
	if (allowedVerbs.includes(request.method)) {
		let body = '';
		//Split action into array by tildes.
		var splitAction = sites[pagename].Action.split("~");
		switch(request.method) {
			case "HEAD":
				response.writeHead(statusCode, {'Content-Type': getContentType(pagename)});
				response.end(); return;
				break; //end HEAD
			case "GET":
			if (pagename == sites[pagename].URI) {
				switch(splitAction[0]) {
					case "uri":
						var URItoLoad = splitAction[2]
						//List of URLs - LB between them.
						var URIList = splitAction[2].split(",");
						if (URIList.length > 1){
							//disable caching for now.
							sites[pagename].Data = ""
							//How to specify different LB types - weighted, round robin, etc?
							var LBNum = 0;
							if (sites[pagename].notes.includes("LB:")){
								//If the LB tag exists, split by semicolon then sort through them to find it. 
								var newNote = "";
								for (let note of sites[pagename].notes.split(";")) {
									if (note.includes("LB:")){
										//When on the note with LB, derive the LB page number.
										LBNum = note.split(":")[1]*1;
									} else {
										newNote += note;
									}; //end if note
								}; //end for let note
									var LBPage = (LBNum+1)%(URIList.length);
									sites[pagename].notes = newNote+" LB:"+LBPage+";";
									URItoLoad = URIList[LBPage]
							} else {
								URItoLoad = URIList[LBNum]
								sites[pagename].notes = sites[pagename].notes + "LB:"+LBNum+";";
							}; //end if sites pagename
						}; //end if URIList
						var expiry = splitAction[3];
						if (sites[pagename].Data == "") {
							webRequest(splitAction[1], URItoLoad,function(data){
								sites[pagename].Data = data;
								dataSave(sites,inMemCacheFile);
								response.writeHead(statusCode, {'Content-Type': getContentType(pagename)});
								response.end(sites[pagename].Data); return;
							});
						} else {
							response.writeHead(statusCode, {'Content-Type': getContentType(pagename)});
							response.end(sites[pagename].Data); return;
						}
						break;//end uri
					case "fs":
						if (sites[pagename].Data == "") {
							fs.readFile(wwwFolder+splitAction[1], function (err,data) {
								if (err) {
									statusCode=404;
									let errMsg = "Not found."
									sites[pagename].Data = "";
									console.log(statusCode+" "+errMsg);
									response.writeHead(statusCode, {'Content-Type': 'text/html'});
									response.end(sites["/error.html"].Data.replace("%statusCode",statusCode).replace("%statusText",errMsg)); return;
								} else {
									sites[pagename].Data = data;
									dataSave(sites,inMemCacheFile);
									response.writeHead(statusCode, {'Content-Type': getContentType(splitAction[1])});
									response.end(sites[pagename].Data); return;
								}
							});
						} else {
							response.writeHead(statusCode, {'Content-Type': getContentType(splitAction[1])});
							response.end(sites[pagename].Data); return;
						}
						break;//end fs
					case "data":
						//Replace from Data
						//Spread out operators by adding spaces between them, then remove any doubled spaces if they already had spaces there. Then split into a word array.
						responseData = splitAction[1].replaceAll("<\/","<$").replaceAll("+"," + ").replaceAll("+"," + ").replaceAll("-"," - ").replaceAll("*"," * ").replaceAll("/"," / ").replaceAll(","," , ").replaceAll("]"," ] ").replaceAll("}"," } ").replaceAll("  "," ");
						responseSplit = responseData.split(" ");
						//Go through the word array, and replace any paths (Use % instead of / to denote website directory or path, to avoid confusion with mathematical division.)
						for (let datum of responseSplit) {
							if (datum.includes("%")) {
								try{
									responseData = responseData.replace(datum,sites[datum.replaceAll("%","/")].Data)
								} catch {
									statusCode = 400;
									responseData = sites["/error.html"].Data.replace("%statusCode",statusCode).replace("%statusText","Site data can't be read - have all variable paths been visited?")
								}
							}
						}

						//Perform any operations
						for (let a of responseData.split("")) {
							if (mathOperators.includes(a)) {
								var Operator = a;
								var firstElement = responseData.split(Operator)[0] * 1;
								var secondElement = responseData.split(Operator)[1] * 1;
								var replaceVar = firstElement+" "+Operator+" "+secondElement;
								switch (Operator) {
									case "+":
										responseData = responseData.replace(replaceVar,firstElement + secondElement);
										break;//end plus
									case "-":
										responseData = responseData.replace(replaceVar,firstElement - secondElement);
										break;//end plus
									case "*":
										responseData = responseData.replace(replaceVar,firstElement * secondElement);
										break;//end plus
									case "/":
										responseData = responseData.replace(replaceVar,firstElement / secondElement);
										break;//end plus
									default://Operator
										console.log("err default")
										break;
								}; //end switch Operator
							}; //end if mathOperators
						}; //end for let a 

						//Store at current location, after reverting closing tags.
						sites[pagename].Data = responseData.replaceAll("<\$","</");
						dataSave(sites,inMemCacheFile);

						//Return as response.
						response.writeHead(statusCode, {'Content-Type': getContentType(pagename)});
						response.end(sites[pagename].Data); return;
					default://splitAction[0]
							response.writeHead(statusCode, {'Content-Type': getContentType(pagename)});
							if (typeof responseData == "number"){
								response.end(JSON.stringify(responseData)); return;
							} else {
								response.end(sites[pagename].Data); return;
							}
						break;
					}; //end switch splitAction[0]
				} else {
					response.writeHead(400, {'Content-Type': 'text/html'});
					response.end(sites["/error.html"].Data.replace("%statusCode",statusCode).replace("%statusText","Site Action URI mismatch")); return;
				}
				break; //end GET
			case "PUT":
				request.on('data', chunk => {
					body += chunk.toString(); // convert Buffer to string
				});
				request.on('end', () => {
					var inputData = "";
					let errMsg = "";
					statusCode=400;
					responseData = request.method+" "+JSON.stringify(sites[pagename])+" failed: "
					var consoleMsg = "At "+now.toISOString()+" user "+userName+"'s "+request.method+" failed from "+request.socket.remoteAddress+" for page "+pagename+": "
					try {//Verify JSON
						inputData = JSON.parse(body);
					} catch(errMsg) {
						console.log(consoleMsg+errMsg);
						response.writeHead(statusCode, {'Content-Type': contentType});
						response.end(sites["/error.html"].Data.replace("%statusCode",statusCode).replace("%statusText",(responseData += errMsg))); return;
					}; // end try
					try {//Verify inputs
						if (pagename != inputData.URI) {
							errMsg = "URI does not match server location."
							console.log(consoleMsg+errMsg);
							response.writeHead(statusCode, {'Content-Type': contentType});
							response.end(sites["/error.html"].Data.replace("%statusCode",statusCode).replace("%statusText",(responseData += errMsg))); return;
						} else if (inputData.AccessList == "") {
							errMsg = "AccessList too short."
							console.log(consoleMsg+errMsg);
							response.writeHead(statusCode, {'Content-Type': contentType});
							response.end(sites["/error.html"].Data.replace("%statusCode",statusCode).replace("%statusText",(responseData += errMsg))); return;
						} else if (inputData.Action == "") {
							errMsg = "Action too short."
							console.log(consoleMsg+errMsg);
							response.writeHead(statusCode, {'Content-Type': contentType});
							response.end(sites["/error.html"].Data.replace("%statusCode",statusCode).replace("%statusText",(responseData += errMsg))); return;
						} else {
							sites[pagename] = inputData;
							dataSave(sites,inMemCacheFile);
							console.log("At "+now.toISOString()+" user "+userName+"'s "+request.method+" complete from "+request.socket.remoteAddress+" for page "+pagename);
							response.writeHead(200, {'Content-Type': contentType});
							response.end(request.method+JSON.stringify(sites[pagename])+" successful"); return;
						}; //end if pagename
					} catch (errMsg) {
						statusCode=400;
						console.log(consoleMsg+errMsg);
						response.writeHead(statusCode, {'Content-Type': contentType});
						response.end(sites["/error.html"].Data.replace("%statusCode",statusCode).replace("%statusText",(responseData += errMsg))); return;
					}; //end try
				});
				break; //end PUT
			case "POST":
				request.on('data', chunk => {
					body += chunk.toString(); // convert Buffer to string
				});
				request.on('end', () => {
					if (sites[pagename] == null) {
						console.log(pagename+" empty, populating.")
						sites[pagename].Data = body;
					} else if (sites[pagename].URI == pagename) {
						switch(splitAction[0]) {
							case "login":
							try {//JSON validation
								body = JSON.parse(body);
							} catch(error) {
								body = error;
							}
							if (JSON.stringify(Users).includes(body.username)) {
								if (Users[body.username].password == body.password) {
									userName = body.username;
									console.log("Login for : "+userName)
									Users[userName].token = randomToken(); 
									Users[userName].expiry = now.valueOf()+86400000;
									Users[Users[userName].token] = userName;
									dataSave(Users,userFile);
									responseData = "Bearer "+Users[userName].token;
								} else {
									statusCode = 401;
									responseData = "Bad Password";
								}; // end if users body 
							} else {
								userName = body.username;
								console.log("New user: "+userName)
								Users[userName] = {"password":body.password, "email":body.email, "token":randomToken(), "expiry":now.valueOf()+86400000}
								Users[Users[userName].token] = userName;
								dataSave(Users,userFile);
								responseData = "Bearer "+Users[userName].token;
							}; //end users includes
							response.writeHead(statusCode, {'Content-Type': contentType});
							response.end(responseData); return;
							break; //end login
						default:
							console.log(pagename+" exists, appending.")
							sites[pagename].Data += body;
							break; //end login
						}; //end switch
					} else {
						console.log(pagename+" exists, appending.")
						sites[pagename].Data += body;
					}
					responseData = request.method+JSON.stringify(sites[pagename].URI);
					console.log("At "+now.toISOString()+" user "+userName+"'s "+request.method+" complete from "+request.socket.remoteAddress+" for page "+pagename);
					response.writeHead(statusCode, {'Content-Type': contentType});
					dataSave(sites,inMemCacheFile);
					response.end(responseData); return;
				});
				break; //end POST
			case "DELETE":
				sites[pagename] = null;
				responseData = request.method+pagename+" successful";
				response.writeHead(statusCode, {'Content-Type': contentType});
				dataSave(sites,inMemCacheFile);
				response.end(responseData); return;
				break; //end DELETE
			case "MERGE":
				responseData = JSON.stringify(sites[pagename]);
				response.end(responseData); return;
				break; //end POST
			case "OPTIONS":
				responseData = optionsData;
				response.writeHead(statusCode, {'Content-Type': contentType});
				response.end(responseData); return;
				break; //end POST
			default:
				statusCode = 405;
				response.writeHead(statusCode, {'Content-Type': 'text/html'});
				response.end(sites["/error.html"].Data.replace("%statusCode",statusCode).replace("%statusText",error405)); return;
				break; //end default
		}; //end switch
	} else {
		statusCode = 405;
		response.writeHead(statusCode, {'Content-Type': 'text/html'});
		response.end(sites["/error.html"].Data.replace("%statusCode",statusCode).replace("%statusText",error405)); return;
	}
})

server.listen((serverPort), () => {
	console.log("Server is Running on port "+serverPort);
})

function randomToken(){
	return crypto.randomBytes(16).toString('hex');
}

function dataSave(dict,filename) {
	var now = new Date();
	if (saveDateTime < now) {//if the date has increased by more than 5000 ms since saveDateTime was last updated...
		saveDateTime = now.valueOf()+5000;
		fs.writeFile(filename, JSON.stringify(dict), (err) => {
			if (err) {
				console.log(filename+" save err: "+err);
			} else {
				console.log(filename+" save successful.");
			}
		});
	} else {
		//console.log("not yet")
	}
}

function getContentType(pagename) {
		switch(pagename.split(".")[1]) {
	  case "css":
		return 'text/css'
		break;
	  case "gif":
		return 'image/gif'
		break;
	  case "htm":
		return 'text/html'
		break;
	  case "html":
		return 'text/html'
		break;
	  case "ico":
		return 'image/x-icon'
		break;
	  case "jpg":
		return 'image/jpeg'
		break;
	  case "js":
		return 'application/javascript'
		break;
	  case "pdf":
		return 'application/pdf'
		break;
	  case "png":
		return 'image/png'
		break;
	  case "scad":
		return 'text/plain'
		break;
	  case "txt":
		return 'text/plain'
		break;
	  case "png":
		return 'image/png'
		break;
	  default:
		return 'text/plain'
		break;
	}; //end switch pagename
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
	var encodingType = '';

	var $headers = {};
	switch (method) {
		case "POST":
		$headers= {
			'Content-Type': getContentType(file),
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
			'Content-Type': getContentType(file),
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
		console.log("statusCode:"+res.statusCode);
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
		console.error("problem with request: "+error.message);
	});
	if (file) {
		req.write(file);
	};
	req.end();
};
