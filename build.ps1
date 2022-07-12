$name = "125886194542.dkr.ecr.us-west-2.amazonaws.com/"+(((get-location) -split "\\")[2]).ToLower()+":"
$latest = ($name + "latest")

function Build-Webserver ($ver, $serverID) {
	docker stop $serverID
	write-host "version $ver"
	$tag = $name+$ver
	docker build -t $tag .
	docker tag $tag $latest
	docker run -p 80:80 -d $tag
	sleep 1
	$sitePct = Test-Webserver (get-TestData)
<#
	if ($sitePct = 100) {
		Push-Webserver;
	}
#>
	
}

function Test-Item($stringName,$testOutput,$expectedOutput) {
	if ($testOutput -eq $expectedOutput) {
		write-host "$stringName - Pass - Expected: $expectedOutput - Got: $testOutput" -f green
		return 1
	} else {
		write-host "$stringName - Fail - Expected: $expectedOutput - Got: $testOutput" -f red
		return 0
	}
}

function get-TestData (){
	return '[
	{
		"description":"Serve index.html as root.",
		"method": "PUT",
		"URI": "http://localhost/",
		"headers":"",
		"body": {"URI":"/","Action":"fs~/index.html","Owner":"Gilgamech","AccessList":{"Everyone":["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"]},"notes":"","Data":""},
		"shouldPass":"pass",
		"testItem":"StatusCode",
		"expectedOutput":200,
		"notes":""
	},
	{
		"description":"LB between 2 websites",
		"method": "PUT",
		"URI": "http://localhost/Gilgamech.html",
		"headers":"",
		"body": {"URI":"/Gilgamech.html","Action":"uri~GET~https:#www.Gilgamech.com,https:#gilgamech.neocities.org~0","Owner":"Gilgamech","AccessList":{"Everyone":["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"]},"notes":"","Data":""},
		"shouldPass":"pass",
		"testItem":"StatusCode",
		"expectedOutput":200,
		"notes":""
	},
	{
		"description":"increment test",
		"method": "PUT",
		"URI": "http://localhost/increment",
		"headers":"",
		"body": {"URI":"/increment","Action":"data~%increment+1","Owner":"Gilgamech","AccessList":{"Everyone":["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"]},"notes":"","Data":1},
		"shouldPass":"pass",
		"testItem":"StatusCode",
		"expectedOutput":200,
		"notes":""
	},
	{
		"description":"",
		"method": "GET",
		"URI": "http://localhost/increment",
		"headers":"",
		"body": "",
		"shouldPass":"pass",
		"testItem":"content",
		"expectedOutput":2,
		"notes":""
	},
	{
		"description":"",
		"method": "GET",
		"URI": "http://localhost/increment",
		"headers":"",
		"body": "",
		"shouldPass":"pass",
		"testItem":"content",
		"expectedOutput":3,
		"notes":""
	},
	{
		"description":"decrement test",
		"method": "PUT",
		"URI": "http://localhost/decrement",
		"headers":"",
		"body": {"URI":"/decrement","Action":"data~%decrement-1","Owner":"Gilgamech","AccessList":{"Everyone":["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"]},"notes":"","Data":1000000},
		"shouldPass":"pass",
		"testItem":"StatusCode",
		"expectedOutput":200,
		"notes":""
	},
	{
		"description":"",
		"method": "GET",
		"URI": "http://localhost/decrement",
		"headers":"",
		"body": "",
		"shouldPass":"pass",
		"testItem":"content",
		"expectedOutput":999999,
		"notes":""
	},
	{
		"description":"",
		"method": "GET",
		"URI": "http://localhost/decrement",
		"headers":"",
		"body": "",
		"shouldPass":"pass",
		"testItem":"content",
		"expectedOutput":999998,
		"notes":""
	},
	{
		"description":"URI validation",
		"method": "PUT",
		"URI": "http://localhost/test",
		"headers":"",
		"body":  {"URI":"/decrement","Action":"data~%decrement-1","Owner":"Gilgamech","AccessList":{"Everyone":["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"]},"notes":"","Data":1000000},
		"shouldPass":"fail",
		"testItem":"StatusCode",
		"expectedOutput":400,
		"notes":""
	},
	{
		"description":"404 test",
		"method": "GET",
		"URI": "http://localhost/badURI",
		"headers":"",
		"body": "",
		"shouldPass":"fail",
		"testItem":"StatusCode",
		"expectedOutput":404,
		"notes":""
	},
	{
		"description":"",
		"method": "GET",
		"URI": "http://localhost/badURI",
		"headers":"",
		"body": "",
		"shouldPass":"fail",
		"testItem":"StatusCode",
		"expectedOutput":404,
		"notes":""
	},
	{
		"description":"Multiple users",
		"method": "PUT",
		"URI": "http://localhost/test2",
		"headers":"",
		"body":  {"URI":"/test2","Action":"data~%test2/2","Owner":"Gilgamech","AccessList":{"Gilgamech":["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"],"Everyone":["GET", "HEAD", "OPTIONS"]},"notes":"","Data":1000000},
		"shouldPass":"pass",
		"testItem":"StatusCode",
		"expectedOutput":200,
		"notes":""
	},
	{
		"description":"",
		"method": "GET",
		"URI": "http://localhost/test2",
		"headers":"",
		"body": "",
		"shouldPass":"pass",
		"testItem":"StatusCode",
		"expectedOutput":200,
		"notes":""
	},
	{
		"description":"no Everyone",
		"method": "PUT",
		"URI": "http://localhost/test3",
		"headers":"",
		"body":  {"URI":"/test3","Action":"data~%test3/2","Owner":"Gilgamech","AccessList":{"Gilgamech":["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"]},"notes":"","Data":1000000},
		"shouldPass":"pass",
		"testItem":"StatusCode",
		"expectedOutput":200,
		"notes":""
	},
	{
		"description":"",
		"method": "GET",
		"URI": "http://localhost/test3",
		"headers":"",
		"body": "",
		"shouldPass":"fail",
		"testItem":"StatusCode",
		"expectedOutput":405,
		"notes":""
	},
	{
		"description":"Owner test",
		"method": "PUT",
		"URI": "http://localhost/test4",
		"headers":"",
		"body":  {"URI":"/test4","Action":"data~%test4*2","Owner":"Gilgamech","AccessList":{"BobbyTables":["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"]},"notes":"","Data":1},
		"shouldPass":"pass",
		"testItem":"StatusCode",
		"expectedOutput":200,
		"notes":""
	},
	{
		"description":"",
		"method": "GET",
		"URI": "http://localhost/test4",
		"headers":"",
		"body": "",
		"shouldPass":"fail",
		"testItem":"StatusCode",
		"expectedOutput":405,
		"notes":""
	},
	{
		"description":"Website header & footer setup",
		"method": "POST",
		"URI": "http://localhost/header.html",
		"headers":"",
		"body": "(gc .\\header.html)",
		"shouldPass":"pass",
		"testItem":"StatusCode",
		"expectedOutput":200,
		"notes":""
	},
	{
		"description":"",
		"method": "POST",
		"URI": "http://localhost/footer.html",
		"headers":"",
		"body": "(gc .\\footer.html)",
		"shouldPass":"pass",
		"testItem":"StatusCode",
		"expectedOutput":200,
		"notes":""
	},
	{
		"description":"Data concatenation",
		"method": "PUT",
		"URI": "http://localhost/page.html",
		"headers":"",
		"body":  {"URI":"/page.html","Action":"data~%header.html <div class=\"textBubbleBG\"><h1>We Are Number 1!</h1></div> %footer.html","Owner":"Gilgamech","AccessList":{"Everyone":["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"]},"notes":"","Data":""},
		"shouldPass":"pass",
		"testItem":"StatusCode",
		"expectedOutput":200,
		"notes":""
	},
	{
		"description":"Login testing",
		"method": "PUT",
		"URI": "http://localhost/login",
		"headers":"",
		"body":  {"URI":"/login","Action":"login","Owner":"Gilgamech","AccessList":{"Everyone":["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"]},"notes":"","Data":""},
		"shouldPass":"pass",
		"testItem":"StatusCode",
		"expectedOutput":200,
		"notes":"%token."
	},
	{
		"description":"",
		"method": "POST",
		"URI": "http://localhost/login",
		"headers":"",
		"body":  {"username":"Gilgamech","password":"testingPass"},
		"shouldPass":"pass",
		"testItem":"content",
		"expectedOutput":"Bearer %token",
		"notes":""
	},
	{
		"description":"Multiple users",
		"method": "PUT",
		"URI": "http://localhost/test2",
		"headers":"Bearer %token",
		"body": {"URI":"/test2","Action":"data~%test2/2","Owner":"Gilgamech","AccessList":{"Gilgamech":["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"],"Everyone":["GET", "HEAD", "OPTIONS"]},"notes":"","Data":1000000},
		"shouldPass":"pass",
		"testItem":"StatusCode",
		"expectedOutput":200,
		"notes":""
	},
	{
		"description":"no Everyone",
		"method": "PUT",
		"URI": "http://localhost/test3",
		"body": {"URI":"/test3","Action":"data~%test3/2","Owner":"Gilgamech","AccessList":{"Gilgamech":["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"]},"notes":"","Data":1000000},
		"headers":"Bearer %token",
		"shouldPass":"pass",
		"testItem":"StatusCode",
		"expectedOutput":200,
		"notes":""
	},
	{
		"description":"",
		"method": "GET",
		"URI": "http://localhost/test3",
		"body": "",
		"headers":"Bearer %token",
		"shouldPass":"pass",
		"testItem":"content",
		"expectedOutput":500000,
		"notes":""
	},
	{
		"description":"",
		"method": "GET",
		"URI": "http://localhost/test4",
		"body": "",
		"headers":"Bearer %token",
		"shouldPass":"pass",
		"testItem":"StatusCode",
		"expectedOutput":200,
		"notes":""
	}
]' | convertfrom-JSON
}

function Test-Webserver($testData) {
	$testCounter = 0;
	$passCounter = 0;
	$token = ""
<#
$token = $webResponse.content
#>

	
	foreach ($data in $testData) {
		if ($data.description) {
			write-host $data.description
		}
		$testCounter++;
		$webResponse = ""
		$headers = @{};
		if ($token -ne "") {
			$headers.token = $data.headers -replace "%token",$token;
		} #end if token
		if (($data.Body[0..3] -join "") -eq "(gc ") {
			write-host $data.Body
			$data.Body = (invoke-expression $data.Body);
			$headers.ContentType = "text/html";
			$webResponse = iwr -SkipHttpErrorCheck -Method $data.method $data.URI -Body ($data.Body) -headers $headers
		} else {
			$webResponse = iwr -SkipHttpErrorCheck -Method $data.method $data.URI -Body ($data.Body |convertto-JSON) -headers $headers
		}
		if ($data.shouldPass -eq "pass") {
			$msgTxt = "$($data.URI) should $($data.method) without error"
		} elseif ($data.shouldPass -eq "fail") {
			$msgTxt = "$($data.URI) should Error on $($data.method)"
		} else {
			$msgTxt = "shouldPass err"
		}
		try {
			$contentSplit = ($webResponse.content -split " ")
			if ($contentSplit[0] -eq "Bearer") {
				$token = $contentSplit[1]
				$passCounter += Test-Item $msgTxt ($webResponse.($data.testItem) -replace $token,"%token") $data.expectedOutput
			} else {
				#$token = "";
				$passCounter += Test-Item $msgTxt $webResponse.($data.testItem) $data.expectedOutput
			}
		} catch {
			$token = "";
		}
	}
	
	$passRate = [math]::Round($passCounter*100/$testCounter,2)
	Write-Host "$passCounter of $testCounter tests passed, for a pass rate of $passRate %"
	return $passRate
}

function Push-Webserver() {
	docker push $latest
}
