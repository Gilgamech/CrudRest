
<#
RequestTraceIdentifier : 00000000-0000-0000-8d09-0080060000f0
AcceptTypes            : {text/html, application/xhtml+xml, application/xml;q=0.9, image/webp...}
ContentEncoding        : System.Text.SBCSCodePageEncoding
ContentLength64        : 0
ContentType            :
Headers                : {Upgrade-Insecure-Requests, DNT, Connection, Accept...}
HttpMethod             : GET
InputStream            : System.IO.Stream+$nullStream
IsAuthenticated        : False
IsLocal                : False
IsSecureConnection     : False
IsWebSocketRequest     : False
QueryString            : {api, z, t}
RawUrl                 : /?api=i&z=r&t=map1
ServiceName            :
Url                    : http://gilgamech.com:65530/?api=i&z=r&t=map1
UrlRef$errer            :
UserAgent              : Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)
                         Chrome/58.0.3029.110 Safari/537.36
UserHostAddress        : 10.0.0.5:65530
UserHostName           : gilgamech.com:65530
UserLanguages          : {en-US, en;q=0.8}
ClientCertificate$error :
TransportContext       : System.Net.HttpListen$errequestContext
Cookies                : {}
ProtocolVersion        : 1.1
HasEntityBody          : False
KeepAlive              : True
RemoteEndPoint         : 24.16.132.159:59040
LocalEndPoint          : 10.0.0.5:65530

#>

Function End-GilAPI {
    <#
    .Synopsis
        Creates a new HTTP Listener accepting PowerShell command line to execute
    .Description
        Creates a new HTTP Listener enabling a remote client to execute PowerShell command lines using a simple REST API.
        This function requires running from an elevated administrator prompt to open a port.

        Use Ctrl-C to stop the listener.  You'll need to send another web request to allow the listener to stop since
        it will be blocked waiting for a request.
    .Parameter Port
        Port to listen, default is 8888
    .Parameter URL
        URL to listen, default is /
    .Parameter Auth
        Authentication Schemes to use, default is IntegratedWindowsAuthentication
    .Example
        Start-HTTPListener -Port 8080 -Url PowerShell
        Invoke-WebRequest -Uri "http://localhost:65530/ARK$data/DemoPage.html" 
	.Link
		https://gallery.technet.microsoft.com/Simple-REST-api-for-b04489f1
    #>
	[CmdletBinding()]
    Param (
        [Int]$Port = 65530,
        [String]$Url = "",
		[String]$Webcache = "C:\Media\Projects\gh\Webcache",
		[String]$LogPath = "C:\Media\Projects\gh\Weblogs"
	); #end Param		
    Process {
		[console]::Title = "Windows PowerShell - GilAPI"
		$errorActionPreference = "Stop"

        $CurrentPrincipal = New-Object Security.Principal.WindowsPrincipal( [Security.Principal.WindowsIdentity]::GetCurrent())
        if ( -not ($currentPrincipal.IsInRole( [Security.Principal.WindowsBuiltInRole]::Administrator ))) {
            Write-Error "This script must be executed from an Administrator PowerShell session to interact with the HTTPListener object." -ErrorAction Stop
        }; #end if not currentPrincipal

        if ($Url.Length -gt 0 -and -not $Url.EndsWith('/')) {
            $Url += "/"
        }; #end if Url.Length

        $listener = New-Object System.Net.HttpListener
        $prefix = "http://*:$Port/$Url"
        $listener.Prefixes.Add($prefix)
        #$listener.AuthenticationSchemes = $Auth 
		
		try {
            $listener.Start()
            while ($true) {
                $commandOutput = $null
                $statusCode = 200
                Write-Verbose "Listening on $port..."
                $context = $listener.GetContext()
                $request = $context.Request
				$identity = $context.User.Identity
				Write-Verbose "Received request $(get-date) from $($identity.Name):"
				$request | fl * | Out-String | Write-Verbose
				$QueryString = $request.QueryString


					try {
						write-verbose "QueryString: $($QueryString)"
						#$script = $ExecutionContext.InvokeCommand.NewScriptBlock($command)               
						[string]$requestURL = $request.RawURL  | Filter-URLs
							Switch ($QueryString) {
								"Cache" {
									$Webpage = $request.QueryString.Item($QueryString)
									$WebFile = "$Webcache\$Webpage" -replace "https://","" -replace " ","" -replace "/","\" -replace "\\\\","\" -replace "\?","~~" -replace "=","~~~"
									if ($webfile.EndsWith("\\")) {$Webfile = $Webfile + "__root__.html"}
									if ($webfile.EndsWith("\")) {$Webfile = ($Webfile.ToCharArray())[0..($Webfile.Length-2)] -join ""}
									if ($webfile.EndsWith(".com")) {$Webfile = $Webfile + "\__root__.html"}
									Write-Verbose "Processing Cache call: $WebFile."
									$Format = "Plain"
									try {
										$commandOutput = gc -raw $WebFile
									}catch {
										Write-Warning "Couldn't find site $Webpage"
										$statusCode = 404
										$commandOutput = "File not found."
										$Format = "TEXT"
									}; #end Try
								}; #end Cache
								"Proxy" {
									$Webpage = $request.QueryString.Item("Proxy")
									Write-Verbose "Processing Proxy call: $Webpage."
									$WebFile = "$Webcache\$Webpage" -replace "https://","" -replace " ","" -replace "/","\" -replace "\\\\","\" -replace "\?","~~" -replace "=","~~~"
									if ($webfile.EndsWith("\\")) {$Webfile = $Webfile + "__root__.html"}
									if ($webfile.EndsWith("\")) {$Webfile = ($Webfile.ToCharArray())[0..($Webfile.Length-2)] -join ""}
									if ($webfile.EndsWith(".com")) {$Webfile = $Webfile + "\__root__.html"}
									$Format = "Plain"
									try {
									Write-Verbose "Checking path: $Webfile."
										if (test-path (split-path $WebFile)) {
										} else {
											md (split-path $WebFile) -force
									Write-Verbose "Creating path: $Webfile."
									Write-Warning $error[0]
										}
										$commandOutput = (iwr $Webpage).content -replace "cloud","butt"
									Write-Verbose "Saving as: $Webfile."
										$commandOutput > $WebFile
									}catch {
										Write-Warning "Couldn't find site $Webfile"
										$statusCode = 404
										$commandOutput = "File not found."
										$Format = "TEXT"
									}; #end Try
								}; #end Proxy
								Default {
									$WebFile = "$Webcache\$Webpage" -replace "https://","" -replace " ","" -replace "/","\" -replace "\\\\","\" -replace "\?","~~" -replace "=","~~~"
									if ($webfile.EndsWith("\\")) {$Webfile = $Webfile + "__root__.html"}
									if ($webfile.EndsWith("\")) {$Webfile = ($Webfile.ToCharArray())[0..($Webfile.Length-2)] -join ""}
									if ($webfile.EndsWith(".com")) {$Webfile = $Webfile + "\__root__.html"}
									#$Webpage = "C:\Dropbox\www\Webcache\$Webpage"
									$Format = "TEXT"
									Write-Verbose "Loading webpage $Webfile."
									switch (Test-Path $WebFile) {
										$True {
											$commandOutput = (gc -raw $WebFile)
										}; #end True
										Default {
											Write-Warning "Couldn't find file $Webfile."
											$statusCode = 404
											$commandOutput = "File not found."
										}; #end False
									}; #end Switch Test-Path
								}; #end Default
							}; #end switch request
							
						} else {
	#https:#gil-api.herokuapp.com/?p=giltech
	$userName = $request.session.userName;
	$requestPath = $request.RawUrl
	$directoryPath = $requestPath
	Write-Verbose "Pagename: $pagename"
	if ($requestPath -eq "/") {
		$requestPath += $rootPage
	};#end if siteName
	#if ($requestPath.indexOf("ipynb") > -1 ) {
	if ($requestPath > -1 ) {
		$pagename = $requestPath;
		$pageSettingsJson = $request.query | ConvertTo-JSON;
		Write-Host ($pageSettingsJson);
	} else {
		$pagename = $requestPath;
		#$pagename = $requestPath + '.spa';
		$pageSettingsJson = $siteBase + $requestPath + $pagename;
	};#end if $requestPath.indexOf
   if($userName){
		$settingsVar.userACLTable = @();
		foreach ($site in $aclTable.users[$userName].userSites) {$settingsVar.userACLTable += $site+","}
	}else{
		$settingsVar.userACLTable = @();
	}# end if userName
	$settingsVar.clientIP = $request.ip;
	$settingsVar.googleApiKey= $process.env.GOOGLE_API_KEY;
	Write-Verbose (("Page load "+$requestPath+" for user: " + $userName));
							$BasePath = "C:\Dropbox"
							$WebPath = $BasePath + "\www"
							$Webpage = ("$WebPath\$requestURL")
							#if ($Webpage.EndsWith('\\')) {$Webpage = $Webpage -replace '\\$',"index.html"}
							if ($Webpage.EndsWith('\\')) {
								$Webpage = $Webpage -replace '\\$',"index.html"
								$pageSettingsJson = "http://localhost:65530/root/root.spa"
								$commandOutput = '<!DOCTYPE html><html lang="en"><html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><link rel="shortcut icon" href="' + $siteBase + '/favicon.ico" type="image/x-icon"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="deleteme" hidden><p1>Page requires Javascript and load files (XHR) to function.</p1><br><p3>This page composes itself entirely from Javascript -  a true single-page application, not only is it entirely one page in the browser. Where most websites use HTML for structure, CSS for style, and Javascript for operations, this page uses JSON to express every element. This uses a small (less than 500 lines) Javascript engine to interpret the JSON. To see this in action, please permit the site to run Javascript, and load files from the $data source: </p3><br><div id="pageSettingsJson" >' + $pageSettingsJson + '</div></div></body></html><script src="' + $siteBase + '/Gilgamech.js"></script><script>$settingsVar='+($settingsVar|ConvertTo-JSON)+'</script> '
							}
							$Format = "TEXT"
							Write-Verbose "Loading webpage $Webfile"
							switch (Test-Path $Webpage) {
								$True {
									if (!$commandOutput){
											$commandOutput = (gc $Webpage)
									if ($Webpage -eq "C:\Dropbox\www\root\root.spa"){
											#$commandOutput.pages.main.elements[10].elementType = "h1"
											$commandOutput.pages.legal.elements[5].elementParent = "whoArea"
										} else {
										}
									}
								}; #end True
								Default {
									Write-Warning "Couldn't find file $Webfile"
									$statusCode = 404
									$commandOutput = "File not found."
								}; #end False
							}; #end Switch Test-Path
						}; #end if request.QueryString.length
				} catch {
					Write-Verbose "$error $error"
					$commandOutput = $_.ScriptStackTrace #| ConvertTo-HashTable 
					$statusCode = 500
				}; #end Try
				Write-Verbose "Format: $Format"
				$commandOutput = switch ($Format) {
					"TEXT"    { $commandOutput | Out-String ; break } 
					"JSON"    { $commandOutput | ConvertTo-JSON; break }
					"XML"     { $commandOutput | ConvertTo-XML -As String; break }
					"CLIXML"  { [System.Management.Automation.PSSerializer]::Serialize($commandOutput) ; break }
					"Plain" { $commandOutput ; break } 
					default { $commandOutput ; break } 
				}; #end switch Format

                Write-Verbose "Response:"
                if (!$commandOutput) {
                    $commandOutput = [string]::Empty
                }
				#$commandOutput = $commandOutput[0..10]
                Write-Verbose $commandOutput
                #$commandOutput | %{ Write-Verbose  $_ }

                $response = $context.Response
                $response.StatusCode = $statusCode
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($commandOutput)

                $response.ContentLength64 = $buffer.Length
                $output = $response.OutputStream
                try{$output.Write($buffer,0,$buffer.Length)}catch{write-warning $error[0]}
                $output.Close()
            }; #end while True
        } finally {
            $listener.Stop()
		[console]::Title = "Windows PowerShell"
		}; #end Try
	}; #end Process
}; #end Start-GilAPI

#region Functions
Filter Filter-URLs ($input) {
	try {
		$_ = $_ -replace "<div\>",""
	} catch {Write-Warning $error[0]}
	$_
}; # end parseHtml

Filter Parse-Html ($input) {
	try {
	$_ = $_.trim()
	#$_ = $_ -replace " ",""
	$_ = $_ += '"}]';
	$_ = $_ -replace "[ ]",'", "' -replace '"", ""','", "'; 
	$_ = $_ -replace "<div\>",""
	$_ = $_ -replace "<a\>",""
	$_ = $_ -replace "<li\>",""
	$_ = $_ -replace "<ul\>",""
	$_ = $_ -replace "<span\>",""
	$_ = $_ -replace "<h1\>",""
	$_ = $_ -replace "<h3\>",""
	$_ = $_ -replace "<p\>",""
	$_ = $_ -replace "<table\>",""
	$_ = $_ -replace "<tbody\>",""
	$_ = $_ -replace "<td\>",""
	$_ = $_ -replace "<tr\>",""
	$_ = $_ -replace "<th\>",""
	$_ = $_ -replace "<code\>",""
	$_ = $_ -replace "/div",""
	$_ = $_ -replace "/&nbsp;",""
	$_ = $_ -replace "<td","td"
	$_ = $_ -replace "<tr","tr"
	$_ = $_ -replace "<th","th"
	$_ = $_ -replace "<table","table"
	$_ = $_ -replace '<p","{"elementParent": "parentElement","elementType":"p"'
	$_ = $_ -replace "<",'"},{"elementParent": "parentElement","elementType":"'
	$_ = $_ -replace '"/"},{"/','{"pageName":"blank", "pageTitle":"blank", "pageDesc":"This page is for blanking.", "onload":""","elements":[{"'
	$_ = $_ -replace ">",'","innerText":"'
	$_ = $_ -replace "/class",'","elementClass'
	$_ = $_ -replace "/img src",'img","href'
	$_ = $_ -replace "/a href",'a","href'
	$_ = $_ -replace "/font face",'font","face'
	$_ = $_ -replace "/style type",'style","type'
	$_ = $_ -replace "/body bgcolor",'body","bgcolor'
	$_ = $_ -replace "/href",',"href'
	$_ = $_ -replace '/"elementType":" align":"center"','"align":"center"'
	$_ = $_ -replace '/" cell",'',"cell'
	$_ = $_ -replace '/" border",',"border"
	$_ = $_ -replace '/" width",',"width"
	$_ = $_ -replace '/  text":"",','"innerText":"'
	$_ = $_ -replace '/  link":"",','"link":"'
	$_ = $_ -replace '/  hlink":"",','"hlink":"'
	$_ = $_ -replace '/width"""','width"'
	$_ = $_ -replace '/" size",','"size'
	$_ = $_ -replace "/a type",'a","type'
	$_ = $_ -replace '/,"innerText":" "",""'
	$_ = $_ -replace '/,"innerText":""",""'
	$_ = $_ -replace '/,\"elementType\"\:\" \"',""
	$_ = $_ -replace "=",'":"'
	$_ = $_ -replace "/",''
	$_ = $_ -replace '"","','","'
	$_ = $_ -replace '":""','":"'
	$_ = $_ -replace '":"}','":""}'
	$_ = $_ -replace '":",','":"",'
	$_ = $_ -replace '":"", ""','":""'

<#
	$_ = $_ -replace "/=",'":"'
	$_ = $_ -replace "/"":""",'":"'
	$_ = $_ -replace '/"":"','":"'
	$_ = $_ -replace '/"","",""',""
	$_ = $_ -replace '"/" ",""','",'
	$_ = $_ -replace '/",","",""',""
	$_ = $_ -replace "/""",'"\"'
	$_ = $_ -replace '"/" "}"','"}'
	$_ = $_ -replace '"/""}"','"}'
	$_ = $_ -replace '/"" ""','""'
	$_ = $_ -replace '"/" " }]"','"}]}'
	$_ = $_ -replace '/"{','"},{'
	$_ = $_ -replace "/""},{",'"},{'
	$_ = $_ -replace '/"  {"','"}",{'
	$_ = $_ -replace '"/"  "},{"','"},{"#'
	$_ = $_ -replace '/","innerText":}"','"}'
	$_ = $_ -replace '"/","innerText":"}"','"}'
	$_ = $_ -replace '"/","innerText":"    {","}"',"{'"
	$_ = $_ -replace "/",","",'",""


-elementParent $elementParent -innerText $innerText -elementClass $elementClass -elementType $elementType -elementStyle $elementStyle -href $href -onChange $onChange -onClick $onClick -contentEditable $contentEditable -attributeType $attributeType -attributeAction $attributeAction -elementId $elementId
#>
	} catch {Write-Warning $error[0]}
	if ($_.toCharArray()[0] -ne "{"){
		$_ = $_[3..($_.length)] -join ""
	}
	$_ = '[' + $_;
	$_
}; # end parseHtml
#endregion
