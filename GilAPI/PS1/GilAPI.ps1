#From here: https://gist.github.com/pmolchanov/0120a26a6ca8d88220a8
#The short term benefits of doing X exceed the long term support costs
#Start-GilServer -Port 80

<#
1. Dev on laptop
2. Upload to S3
3. Server watches S3
4. Server downloads and runs new script.
#>
$error.clear();
#region Main


Function Start-GilServer {
	Param (
        [Int]$Port = 65530,
		$LogPath = ".\"
	)
	[console]::Title = "Gilgamech Hosting server"
	[ipaddress]$ipaddress = [System.Text.Encoding]::ASCII.GetString((iwr https://checkip.amazonaws.com).content).trim()
$enc = [system.Text.Encoding]::ASCII
	$sites = gc .\sites.csv |convertfrom-csv

	$HttpListener = New-Object System.Net.HttpListener
	try{
		#$HttpListener.Prefixes.Add("https://+:443/")
		#$HttpListener.Prefixes.Remove("http://+:80/")
		$HttpListener.Prefixes.Add("http://*:$Port/")
		$HttpListener.Start()
        #$listener.Prefixes.Add($prefix)
	}catch{
		Write-Output "Port $Port in use."
	}
	While ($HttpListener.IsListening) {
		$HttpContext = $HttpListener.GetContext()
		$startTime = (get-date)
		$HttpRequest = $HttpContext.Request
		$RequestUrl = $HttpRequest.Url.OriginalString

		if($HttpRequest.HasEntityBody) {
		  $Reader = New-Object System.IO.StreamReader($HttpRequest.InputStream)
		  Write-Output $Reader.ReadToEnd()
		}

		$HttpResponse = $HttpContext.Response
		$HttpResponse.Headers.Add("Content-Type","text/html")
		$HttpResponse.StatusCode = 200
		$RemoteAddr = $HttpRequest.RemoteEndPoint.Address
		$Method = $HttpRequest.HttpMethod
		$UAgent = $HttpRequest.UserAgent
		$Cookies = $HttpRequest.Cookies
		$Reefer = $HttpRequest.UrlReferrer
		
			try {
				$Page = gc ($sites|where {$_.site -match $HttpRequest.Url.Host}).Page
			}catch {
				$Page = "<HTML><body>404 Error not found.</body><HTML>"
				$HttpResponse.StatusCode = 404
			}
		$ResponseBuffer = [System.Text.Encoding]::UTF8.GetBytes($Page)

		$HttpResponse.ContentLength64 = $ResponseBuffer.Length
		$HttpResponse.OutputStream.Write($ResponseBuffer,0,$ResponseBuffer.Length)
		$HttpResponse.Close()
		Write-Output "" # Newline


		Write-Output "$RequestUrl"
		$outfile = $LogPath+(Get-Date -Format yyyyMMdd)+".log"
$timeTaken = [math]::round(((get-date) - $startTime).TotalMilliseconds,0)

#Fields: date time c-ip cs-username s-ip cs-method cs-uri-stem cs-uri-query sc-status sc-bytes cs-bytes time-taken cs-version cs(User-Agent) cs(Cookie) cs(Referrer)

$LogEntry = (get-date -f d)+" "+(get-date -f T)+" "+$RemoteAddr+" - "+$ipaddress+" "+$Method+" "+$HttpRequest.Url.PathAndQuery+" "+$HttpRequest.Url.Query+" "+$HttpResponse.StatusCode+" "+$enc.GetBytes($Page).length+" "+$enc.GetBytes($HttpRequest.Url.OriginalString).length+" "+$timeTaken+" "+$HttpRequest.Url.Scheme+"/"+$HttpRequest.ProtocolVersion+" "+$UAgent+" "+$Cookies+" "+$Reefer

		Out-File -Append -InputObject $LogEntry -FilePath $outfile
	}
	$HttpListener.Stop()
}
#endregion

<# Request body
$sites = gc .\sites.csv |convertfrom-csv
$HttpListener = New-Object System.Net.HttpListener
$HttpListener.Prefixes.Add("http://+:65530/")
$HttpListener.Start()
$HttpContext = $HttpListener.GetContext()
$HttpRequest = $HttpContext.Request
$HttpRequest

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
#>

Function Write-AdminPage {
	Param (
		$OutFile = ".\admin.html"
	)
$cpuTime = (Get-Counter '\Processor(_Total)\% Processor Time').CounterSamples.CookedValue
$availMem = (Get-Counter '\Memory\Available MBytes').CounterSamples.CookedValue
$totalRam = (Get-CimInstance Win32_PhysicalMemory | Measure-Object -Property capacity -Sum).Sum


	
Out-File -FilePath $OutFile -Encoding ascii -InputObject "<HTML>" 
Out-File -FilePath $OutFile -Append -Encoding ascii -InputObject "<body>"
Out-File -FilePath $OutFile -Append -Encoding ascii -InputObject "<h1>Admin Page</h1>"
Out-File -FilePath $OutFile -Append -Encoding ascii -InputObject ("CPU use: " + $cpuTime.ToString("#,0.000") + "%<br>")
Out-File -FilePath $OutFile -Append -Encoding ascii -InputObject ("Avail. Mem.: " + $availMem.ToString("N0") + "MB (" + (104857600 * $availMem / $totalRam).ToString("#,0.0") + "%)<br>")
Out-File -FilePath $OutFile -Append -Encoding ascii -InputObject "<br>"
Out-File -FilePath $OutFile -Append -Encoding ascii -InputObject "</body>"
Out-File -FilePath $OutFile -Append -Encoding ascii -InputObject "<HTML>"

<#
"percent" > test.csv
25 >> test.csv
26 >> test.csv
26 >> test.csv
25 >> test.csv
24 >> test.csv
26 >> test.csv
28 >> test.csv
30 >> test.csv
$c = gc test.csv |convertfrom-csv
$c.percent |%{"a"*$_}
#>

}

