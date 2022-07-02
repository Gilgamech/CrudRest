//Conspiratoral > Perspirational
//Just use IIS and get the c# server running on some other port.
//Since C# is almost compiled Powershell, write in PS, and only compile if it's public or prod (heavily used). 

//ToScript
//New EC2 server
//New-EC2Instance -ImageId -AssociatePublicIp -SecurityGroup -InstanceType -AvailabilityZone -SubnetId
//Enable-WindowsOptionalFeature –online –featurename IIS-WebServerRole
//Get & install LE cert
//Move public IP
//Download EXE from S3?
//Update Security Group?
//Write files?
//Read files from current?
//Run site remotely?
//Robocopy to (encrypted?) zip file on EC2

using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using System.Data.SQLite;

namespace ObnubilateServer {
    internal class HostingServer {
        private static void Main(string[] args) {
            if (!HttpListener.IsSupported) {
                Console.WriteLine("HttpListener class is unsupported.");
                return;	
            }


            uint port = uint.Parse(args[1]);
			Console.WriteLine("port = "+args[1]);
			//string Role = args[2]
			
			// Build prefixes and listener, and add prefixes to listener, then start listening.
			//Serve same pages to both interfaces.
            var prefixes = new List<string>() { "http://*:80/","https://*:443/" };
			
            string BaseDirectory = System.AppDomain.CurrentDomain.BaseDirectory;
            string SiteDirectory = BaseDirectory + "Sites\\";
            string OptionsDirectory = BaseDirectory + "Options\\";
            //string Webcache = "C:\\Dropbox\\www\\Webcache";
			string HostName = "http://localhost/";
			//int DBPort = getRandomNumber();
            //string Format = "Plain";
            Dictionary<string, string> ServerStorage = new Dictionary<string, string>();
            Dictionary<string, string> ServerOptions = new Dictionary<string, string>();

			Dictionary<string, string> Users = new Dictionary<string, string>();
			Dictionary<string, string> Sites = new Dictionary<string, string>();
			Dictionary<string, string> Pages = new Dictionary<string, string>();

            HttpListener listener = new HttpListener();
            foreach (string prefix in prefixes) {
                listener.Prefixes.Add(prefix);
            }
            listener.Start();
            Console.WriteLine("Listening...");

            while (listener.IsListening) {
                try {
                    
                    // Note: The GetContext method blocks while waiting for a request, so the code will hang out here between requests.
                    HttpListenerContext context = listener.GetContext();

                    //Set startTime for timeTaken
                    DateTime startTime = DateTime.Now;
                    HttpListenerRequest request = context.Request;
                    string documentBody;
                    using (Stream receiveStream = request.InputStream) {
                        using (StreamReader readStream = new StreamReader(receiveStream, Encoding.UTF8)) {
                            documentBody = readStream.ReadToEnd();
                        }
                    }

					//Pre-logging - add request data to variables
                    IPAddress RemoteAddr = request.RemoteEndPoint.Address;
					byte[] OriginalString = System.Text.Encoding.UTF8.GetBytes(request.Url.OriginalString);
                    string RequestUrl = getRequestURL(request.Url.OriginalString);
                    string RequestHost = request.Url.Host;
                    string Method = request.HttpMethod;
                    string UAgent = request.UserAgent;
                    CookieCollection Cookies = request.Cookies;
                    Uri Reefer = request.UrlReferrer;
                    
                    // Create a response object.
                    HttpListenerResponse response = context.Response;
                    // Construct a response.
                    string responseString = "<HTML><BODY>Hello world!</BODY></HTML>";
                    int responseStatusCode = 200;
					Console.WriteLine("RequestUrl: "+RequestUrl+"\tRequestHost: "+RequestHost+"\tdocumentBody: " + documentBody);
					
					string authHeader = request.Headers["Authorization"];
					string username = "UserName";
					string password = "P4$-$W0rd";
					string userlocation = "";
					bool RequestSuccess = false;
					string LoginHost = HostName+"login/";
					
					readUsers(ref Users)

					if (authHeader != null && authHeader.StartsWith("Basic")) {
						string encodedUsernamePassword = authHeader.Substring("Basic ".Length).Trim();
						Encoding encoding = Encoding.GetEncoding("iso-8859-1");
						string usernamePassword = encoding.GetString(Convert.FromBase64String(encodedUsernamePassword));
						int seperatorIndex = usernamePassword.IndexOf(':');
						
						//Select all items from this table from this DB file, and put the results into this var
						
						username = usernamePassword.Substring(0, seperatorIndex);
						password = usernamePassword.Substring(seperatorIndex + 1);
						//Check if item stored in /login/username matches the password.
						string UserURI = LoginHost+username;
						xhrRequest(ref userlocation, UserURI, "GET","");
						if (userlocation == password){
							Console.WriteLine("Basic Token Found: "+userlocation);
							string Token = getBadPW();
							RequestSuccess = true;
							response.Headers.Add("Authentication", Token);
							string TokenURI = LoginHost+Token;
							//xhrRequest(ref Token, TokenURI,"PUT",username);
							Console.WriteLine("Basic Token Store: "+TokenURI);
						}
						Console.WriteLine("Basic Login attempt: "+username+"\tSuccessful: "+RequestSuccess);
						
					} else if (authHeader != null && authHeader.StartsWith("Bearer")) {
						string bearerToken = authHeader.Substring("Bearer ".Length).Trim();

						//Check if item stored in /login/token matches the bearerToken.
						string UserURI = LoginHost+bearerToken;
						Console.WriteLine("UserURI = "+UserURI);
						xhrRequest(ref username, UserURI, "GET","");
						if (username != "UserName"){
							Console.WriteLine("Username Found: "+username);
							string Token = getBadPW();
							RequestSuccess = true;
							response.Headers.Add("Authentication", Token);
							string TokenURI = LoginHost+Token;
							xhrRequest(ref Token, TokenURI,"PUT",username) ;
							Console.WriteLine("Bearer Token Store: "+TokenURI);
							//xhrRequest(ref string response_out, string uri, string Method,string body) 
						}
						Console.WriteLine("Bearer Token Renewal: "+username+"\tSuccessful: "+RequestSuccess);
						
					} else {
						//throw new Exception("The authorization header is either empty or isn't Basic.");
						username = "Anonymous";
						password = "Password";
						RequestSuccess = true;
						Console.WriteLine("Unauthenticated: "+username+"\tSuccessful: "+RequestSuccess);
					}

					//Will expose querystring, files, proxy operations
					//POST takes function and it will execute the function on GET.
					//To host a file there, can either POST the file contents as a function that displays that text, or POST a function saying to load the file. (Might make some of these into a marketplace)
					//To proxy another site, POST a function that reads from another site
					string fileName = SiteDirectory+RequestUrl;
					string optionsName = OptionsDirectory+RequestUrl;
					
					switch (request.HttpMethod) {
						case "GET" :// Executes the function at the location
							if (ServerStorage.ContainsKey(RequestUrl)) {
								responseString = ServerStorage[RequestUrl];
							} else if (File.Exists(fileName)) {
								ServerStorage[RequestUrl] = System.IO.File.ReadAllText(@fileName);
								responseString = ServerStorage[RequestUrl];
							} else {
								responseString = "<HTML><body>404 Error not found.</body><HTML>";
								responseStatusCode = 404;
							}
						break;
						case "POST" :// Writes
							if (ServerStorage.ContainsKey(RequestUrl)) {
								ServerStorage[RequestUrl] = documentBody;
							} else {
								ServerStorage.Add(RequestUrl, documentBody);
								File.WriteAllText(fileName, documentBody);
							}
							responseString = RequestUrl+" set.";
						break;
						case "PATCH" :// Appends 
							if (ServerStorage.ContainsKey(RequestUrl)) {
								ServerStorage[RequestUrl] += documentBody;
								File.WriteAllText(fileName, ServerStorage[RequestUrl]);
								responseString = RequestUrl+" appended.";
							} else if (File.Exists(fileName)) {
								ServerStorage.Add(RequestUrl, System.IO.File.ReadAllText(@fileName));
								ServerStorage[RequestUrl] += documentBody;
								File.WriteAllText(fileName, ServerStorage[RequestUrl]);
								responseString = RequestUrl+" appended.";
							} else {
								ServerStorage.Add(RequestUrl, documentBody);
								File.WriteAllText(fileName, ServerStorage[RequestUrl]);
								responseString = RequestUrl+" appended.";
							}
						break;
						case "DELETE" :// Deletes
							if (File.Exists(fileName)) {
								File.Delete(fileName);
								ServerStorage.Remove(RequestUrl);
								responseString = RequestUrl+" deleted.";
							} else {
								responseString = RequestUrl+" not found.";
							}
						break;
						case "OPTIONS" :// Reads Options - The most important is CORS
							if (ServerOptions.ContainsKey(RequestUrl)) {
								responseString = ServerOptions[RequestUrl];
							} else if (File.Exists(optionsName)) {
								ServerOptions[RequestUrl]= System.IO.File.ReadAllText(@optionsName);
								responseString = ServerOptions[RequestUrl];
							} else {
								responseString = "";
							}
						break;
						case "PUT" :// Writes Options (incl Permissions)
							ServerOptions.Add(RequestUrl, documentBody);
							File.WriteAllText(optionsName, documentBody);
							responseString = RequestUrl+" options updated.";
						break;
					}//end switch request

					response.StatusCode = responseStatusCode;
					byte[] buffer = System.Text.Encoding.UTF8.GetBytes(responseString);
					// Get a response stream and write the response to it.
					response.ContentLength64 = buffer.Length;
					System.IO.Stream output = response.OutputStream;
					output.Write(buffer, 0, buffer.Length);
					// Close the output stream.
					output.Close();

                    //Calculate timeTaken
                    DateTime Now = DateTime.Now;
                    double timeTaken = Math.Round((Now - startTime).TotalMilliseconds);
                    
                    //Logging
					// Log request bodies somewhere
                    writeLog(RemoteAddr, documentBody, request.Url, Method, request.Url.PathAndQuery, request.Url.Query, response.StatusCode, response.ContentLength64, OriginalString.Length, timeTaken, (request.Url.Scheme+"/"+request.ProtocolVersion), UAgent, Cookies, Reefer);
                } catch (Exception e) {
                    //Log errors
                        writeError(e);
                        //string responseString = "<HTML><body>502 Server Error.</body><HTML>";
                        //response.StatusCode = 500;
                } // end try 
            } //end while listener
            listener.Stop();
        }// end Main

        public static string getRequestURL(string inputString){
                    inputString = inputString.Replace(":80","").Replace(":443","");
					inputString = inputString.Replace(" ","").Replace("/","\\");//.Replace("\\","\\");
                    Regex regex = new Regex("[^a-zA-Z0-9-_]");
					return regex.Replace(inputString, "");

        }// end writeLog 

        public static string getBadPW(int size = 16,bool lowerCase = false){
			StringBuilder builder = new StringBuilder();  
			Random random = new Random();  

			char ch;  
			for (int i = 0; i < size; i++) {  
				ch = Convert.ToChar(Convert.ToInt32(Math.Floor(26 * random.NextDouble() + 65)));  
				builder.Append(ch);  
			}; //end for i


			if (lowerCase)  
				return builder.ToString().ToLower();  
			return builder.ToString();	
        }// end getBadPassword 
        
        public static void writeSql(string inputString){
                    
            SQLiteConnection Sqlite_dbConnection = new SQLiteConnection("Data Source=Logs.sqlite;Version=3;");
            Sqlite_dbConnection.Open();
            
            SQLiteCommand command = new SQLiteCommand(inputString, Sqlite_dbConnection);
            command.ExecuteNonQuery();
            Sqlite_dbConnection.Close();

        }// end writeLog 

		public static void readUsers(ref Dictionary<string, string> Users){

			//Dictionary<string, string> sites = new Dictionary<string, string>();
			string sql = "select * from Users";
			// Set up DB
			SQLiteConnection Sites_dbConnection = new SQLiteConnection("Data Source=Users.sqlite;Version=3;");
			Sites_dbConnection.Open();
			SQLiteCommand command = new SQLiteCommand(sql, Sites_dbConnection);
			SQLiteDataReader reader = command.ExecuteReader();
			Users.Clear();
			while (reader.Read()) {
				//Console.WriteLine("Site: " + reader["Site"] + "\tPage: " + reader["File"]);
				Users.Add(reader["Site"].ToString(), reader["File"].ToString());
			}

			Sites_dbConnection.Close();
			
		}// end readSites 

		//Log errors to itself
        public static void writeError(Exception inputString){
			// Add date and time and request.uri and other info to errors.
			// Add 404s and 500s to errors.
            DateTime Now = DateTime.Now;
            string sql = "insert into errors (date, time, error) values ('"+Now.ToString("d")+"', '"+Now.ToString("T")+"','"+inputString+"')";
            writeSql(sql);

        }// end writeLog 
        
		//Log requests to itself
        public static void writeLog(IPAddress clientip, string csusername, Uri serveraddr, string csmethod, string uristem, string uriquery, int status, long scbytes, int csbytes, double timetaken, string csversion, string UserAgent, CookieCollection Cookie, Uri Referrer){
            
            //Fields: date time c-ip cs-username s-ip cs-method cs-uri-stem cs-uri-query sc-status sc-bytes cs-bytes time-taken cs-version cs(User-Agent) cs(Cookie) cs(Referrer)
			//IPAddress ipaddress = [System.Text.Encoding]::ASCII.GetString((iwr https://checkip.amazonaws.com).content).trim()
            DateTime Now = DateTime.Now;
            
            string sql = "insert into logs (date, time, clientip, csusername, serverip, csmethod, uristem, uriquery, status, scbytes, csbytes, timetaken, csversion, UserAgent, Cookie, Referrer) values ('"+Now.ToString("d")+"', '"+Now.ToString("T")+"','"+clientip+"','"+csusername+"','"+serveraddr+"','"+csmethod+"','"+uristem+"','"+uriquery+"','"+status+"','"+scbytes+"','"+csbytes+"','"+timetaken+"','"+csversion+"','"+UserAgent+"','"+Cookie+"','"+Referrer+"')";
            
            writeSql(sql);

        }// end writeLog 
        
        //XHR
		//xhrRequest(ref responseString, WebFile, "GET","");
        public static void xhrRequest(ref string response_out, string uri, string Method,string body) {
            try {
                ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
                
                HttpWebRequest request = (HttpWebRequest)WebRequest.Create(uri);
                request.Method = Method;// WebRequestMethods.Http.Get;
                request.ContentType = "application/json;charset=utf-8";
                request.Accept = "application/json";
                request.UserAgent = "obnubilate";
				if (body.Length > 0) {
					request.ContentType = "application/x-www-form-urlencoded";
					ASCIIEncoding encoding = new ASCIIEncoding ();
					byte[] encodedBody = encoding.GetBytes (body);
					request.ContentLength = encodedBody.Length;
					Stream requestStream  = request.GetRequestStream();
					requestStream.Write(encodedBody, 0, encodedBody.Length);
				}
                WebResponse response = request.GetResponse();
                StreamReader sr = new StreamReader(response.GetResponseStream());
                
				string response_text = sr.ReadToEnd();
                if (response_text == null) {
                    response_out = "problem with getting data";
                } else {
                    response_out = response_text;
                }
                sr.Close();
            }
            catch (Exception ex) {
				Console.WriteLine(ex.Message);
                //response_out = ex.Message;
            }
        }// end xhrRequest


    }// end HostingServer
}// end ObnubilateServer

/*
//Read file: System.IO.File.ReadAllText(@fileName);
//Write file: File.WriteAllText(fileName, lines);
//System.Console.ReadKey();

// Login will be an application that reads from and writes to specific URLs on the application.
if (PassHash(Querystring.Password) equals WebRequest("/pwstore/"+Querystring.Username, GET)) {
	WebRequest("/tokens/"+Querystring.Username, POST,GetToken()))
	ReturnString = WebRequest("/tokens/"+Querystring.Username, GET)
}
*/

/*
	try {
		readSites(ref sites);
		string filename = SiteDirectory + RequestHost +"\\"+ sites[RequestUrl];
		string text = System.IO.File.ReadAllText(@filename);
		responseString = text;
	}catch (Exception e) {
		writeError(e);
		responseString = "<HTML><body>404 Error not found.</body><HTML>";
		response.StatusCode = 404;
	} // end try 

*/

/*responseString = switch (Format) {
"TEXT"    { responseString | Out-String ; break } 
"JSON"    { responseString | ConvertTo-JSON; break }
"XML"     { responseString | ConvertTo-XML -As String; break }
"CLIXML"  { [System.Management.Automation.PSSerializer]::Serialize(responseString) ; break }
"Plain" { responseString ; break } 
default { responseString ; break } 
}; //end switch Format
*/

/*RequestTraceIdentifier : 00000000-0000-0000-8d09-0080060000f0
AcceptTypes            : {text/html, application/xhtml+xml, application/xml;q=0.9, image/webp...}
ContentEncoding        : System.Text.SBCSCodePageEncoding
ContentLength64        : 0
ContentType            :
Headers                : {Upgrade-Insecure-Requests, DNT, Connection, Accept...}
HttpMethod             : GET
InputStream            : System.IO.Stream+NullStream
IsAuthenticated        : False
IsLocal                : False
IsSecureConnection     : False
IsWebSocketRequest     : False
QueryString            : {api, z, t}
RawUrl                 : /?api=i&z=r&t=map1
ServiceName            :
Url                    : http://gilgamech.com:65530/?api=i&z=r&t=map1
UrlReferrer            :
UserAgent              : Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)
						Chrome/58.0.3029.110 Safari/537.36
UserHostAddress        : 10.0.0.5:65530
UserHostName           : gilgamech.com:65530
UserLanguages          : {en-US, en;q=0.8}
ClientCertificateError :
TransportContext       : System.Net.HttpListenerRequestContext
Cookies                : {}
ProtocolVersion        : 1.1
HasEntityBody          : False
KeepAlive              : True
RemoteEndPoint         : 24.16.132.159:59040
LocalEndPoint          : 10.0.0.5:65530
*/

/* Request body

sites = gc .\\sites.csv |convertfrom-csv
listener = New-Object System.Net.HttpListener
listener.Prefixes.Add("http://+:65530/")
listener.Start()
context = listener.GetContext()
request = context.Request
request

AcceptTypes: {text/html, application/xhtml+xml, application/xml;q=0.9, image/avif...}
ClientCertificateError: 
ContentEncoding: System.Text.SBCSCodePageEncoding
ContentLength64: 0
ContentType: 
Cookies: {}
HasEntityBody: False
Headers: {DNT, Upgrade-Insecure-Requests, Sec-Fetch-Site, Sec-Fetch-Mode...}
HttpMethod: GET
InputStream: System.IO.Stream+NullStream
IsAuthenticated: False
IsLocal: True
IsSecureConnection: False
IsWebSocketRequest: False
KeepAlive: True
LocalEndPoint: [::1]:65531
ProtocolVersion: 1.1
QueryString: {}
RawUrl: /
RemoteEndPoint: [::1]:62173
RequestTraceIdentifier: 00000000-0000-0000-2000-0080040000f7
ServiceName: 
TransportContext: System.Net.HttpListenerRequestContext
Url: http://localhost:65531/
UrlReferrer: 
UserAgent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36
UserHostAddress: [::1]:65531
UserHostName: localhost:65531
UserLanguages: {en-US, en;q=0.9}
*/

/*Bibliography
https://gist.github.com/pingec/9bf2fd92ac85032b5e30d487a35789a0#file-dumphttprequests-cs
http://system.data.sqlite.org/index.html/doc/trunk/www/downloads.wiki
https://stackoverflow.com/questions/15292880/create-sqlite-database-and-table
Install-PackageProvider -Name NuGet -Force
Register-PackageSource -Name nuget.org -Location https://www.nuget.org/api/v2 -ProviderName NuGet
Install-Package System.Data.Common -RequiredVersion 4.3.0
https://www.c-sharpcorner.com/article/csharp-try-catch/
https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/file-system/how-to-write-to-a-text-file
https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/file-system/how-to-read-from-a-text-file
https://docs.microsoft.com/en-us/dotnet/api/system.collections.generic.dictionary-2?view=net-5.0
https://stackoverflow.com/questions/7388475/reading-int-values-from-sqldatareader
ipmo -Force "C:\\Program Files\\WindowsPowerShell\\Modules\\PSSQLite\\1.1.0\\Invoke-SqliteQuery.ps1"
Install-Module -Name PSSQLite -Force
https://zetcode.com/csharp/datetime/
https://www.tutorialkart.com/c-sharp-tutorial/c-sharp-math-round/
https://docs.microsoft.com/en-us/dotnet/api/system.net.ipaddress?view=net-5.0
https://stackoverflow.com/questions/40215995/system-array-doesnt-contain-a-definition-for-length
https://stackoverflow.com/questions/15653921/get-current-folder-path
https://www.sqlite.org/lang_UPSERT.html
https://stackoverflow.com/questions/29312882/sqlite-preventing-duplicate-rows
https://stackoverflow.com/questions/7702573/importing-csv-data-into-c-sharp-classes
https://thesysadminchannel.com/create-free-lets-encrypt-ssl-certificates-using-powershell/
https://support.n4l.co.nz/s/article/Installing-an-SSL-Certificate-on-a-Windows-Device-Manually
https://stackoverflow.com/questions/15212190/why-is-the-netsh-http-add-sslcert-throwing-error-from-powershell-ps1-file
https://community.qlik.com/t5/Knowledge-Base/How-To-Setup-HTTPS-SSL-with-QlikView-AccessPoint-WebServer-and/ta-p/1710263
https://docs.microsoft.com/en-us/windows/win32/http/add-sslcert
https://stackoverflow.com/questions/537173/what-appid-should-i-use-with-netsh-exe
https://csharp.net-tutorials.com/regular-expressions-regex/search-replace-with-the-regex-class/
https://stackoverflow.com/questions/4256136/setting-a-webrequests-body-data
https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/operators/comparison-operators
https://stackoverflow.com/questions/1243717/how-to-update-the-value-stored-in-dictionary-in-c
https://www.c-sharpcorner.com/UploadFile/mahesh/how-to-remove-an-item-of-a-dictionary-with-C-Sharp/
https://www.techiedelight.com/determine-key-exists-dictionary-csharp/
https://www.codegrepper.com/code-examples/csharp/how+to+get+authorization+header+in+c%23
https://www.c-sharpcorner.com/article/how-to-generate-a-random-password-in-c-sharp-and-net-core/
https://stackoverflow.com/questions/15129296/params-parameter-with-default-parameter-values#15129349
https://www.thecodebuzz.com/add-custom-headers-to-response-in-asp-net-core/
https://www.tutorialspoint.com/how-to-run-an-external-application-through-a-chash-application
https://www.derpturkey.com/c-windows-service-startup-arguments/
https://www.c-sharpcorner.com/UploadFile/dbeniwal321/how-to-delete-a-file-in-C-Sharp/
https://stackoverflow.com/questions/7387085/how-to-read-an-entire-file-to-a-string-using-c
*/

//iXsEfzwqjqImlk8vlnYq
