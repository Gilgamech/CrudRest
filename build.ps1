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
	$sitePct = Test-Webserver
<#
	if ($sitePct = 100) {
		Push-Webserver;
	}
#>
	
}

function Test-WebItem($siteUri,$Method,$shouldError,$testOutput,$expectedOutput) {
	$testItem = iwr -SkipHttpErrorCheck -Method $Method $siteUri -Body '{"URI":"/","Action":"fs~/index.html","Owner":"Gilgamech","AccessList":{"Everyone":["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"]},"notes":"","Data":""}'
	$msg = $siteUri +"should $Method without error"
	Test-Item $msg  $testOutput $expectedOutput
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
		"method": "PUT",
		"URI": "http://localhost/",
		"body": {"URI":"/","Action":"fs~/index.html","Owner":"Gilgamech","AccessList":{"Everyone":["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"]},"notes":"","Data":""},
		"shouldPass":1,
		"testItem":"StatusCode"
		"expectedOutput":200
	},
	{
		"method": "PUT",
		"URI": "http://localhost/GIlgamch.html"
	}
]' | convertfrom-JSON
}

function Test-Webserver($testData) {
	$testCounter = 0;
	$testCounter++;$passCounter = 0;

	#$testData = $testData | convertfrom-JSON

	#Serve index.html as root.
	$method = "Put"
	$siteUri = "http://localhost/"
	$testItem = iwr -SkipHttpErrorCheck -Method $method $siteUri -Body '{"URI":"/","Action":"fs~/index.html","Owner":"Gilgamech","AccessList":{"Everyone":["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"]},"notes":"","Data":""}'
	$testCounter++;$passCounter += Test-Item "$siteUri should $method without error" $testItem.StatusCode 200

	#LB between 2 websites
	$method = "Put"
	$siteUri = "http://localhost/Gilgamech.html"
	$testItem = iwr -SkipHttpErrorCheck -Method $method $siteUri -Body '{"URI":"/Gilgamech.html","Action":"uri~GET~https:#www.Gilgamech.com,https:#gilgamech.neocities.org~0","Owner":"Gilgamech","AccessList":{"Everyone":["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"]},"notes":"","Data":""}'
	$testCounter++;$passCounter += Test-Item "$siteUri should $method without error" $testItem.StatusCode 200

	#+1 test 
	$method = "Put"
	$siteUri = "http://localhost/increment"
	$testItem = iwr -SkipHttpErrorCheck -Method $method $siteUri -Body '{"URI":"/increment","Action":"data~%increment+1","Owner":"Gilgamech","AccessList":{"Everyone":["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"]},"notes":"","Data":1}'
	$testCounter++;$passCounter += Test-Item "$siteUri should $method without error" $testItem.StatusCode 200

	$method = "Get"
	$testItem = iwr -SkipHttpErrorCheck -Method $method $siteUri
	$testCounter++;$passCounter += Test-Item "$siteUri should $method without error" $testItem.content 2

	$testItem = iwr -SkipHttpErrorCheck -Method $method $siteUri
	$testCounter++;$passCounter += Test-Item "$siteUri should $method without error" $testItem.content 3

	#-1 test
	$method = "Put"
	$siteUri = "http://localhost/decrement"
	$testItem = iwr -SkipHttpErrorCheck -Method $method $siteUri -Body '{"URI":"/decrement","Action":"data~%decrement-1","Owner":"Gilgamech","AccessList":{"Everyone":["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"]},"notes":"","Data":1000000}'
	$testCounter++;$passCounter += Test-Item "$siteUri should $method without error" $testItem.StatusCode 200

	$method = "Get"
	$testItem = iwr -SkipHttpErrorCheck -Method $method $siteUri
	$testCounter++;$passCounter += Test-Item "$siteUri should $method without error" $testItem.content 999999
	$testItem = iwr -SkipHttpErrorCheck -Method $method $siteUri
	$testCounter++;$passCounter += Test-Item "$siteUri should $method without error" $testItem.content 999998

	#URI validation 
	$method = "Put"
	$siteUri = "http://localhost/test"
	$testItem = iwr -SkipHttpErrorCheck -Method $method $siteUri -Body '{"URI":"/decrement","Action":"data~%decrement-1","Owner":"Gilgamech","AccessList":{"Everyone":["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"]},"notes":"","Data":1000000}'
	$testCounter++;$passCounter += Test-Item "$siteUri should Error on $method" $testItem.StatusCode 400

	#404 test
	$method = "Get"
	$siteUri = "http://localhost/badURI"
	$testItem = iwr -SkipHttpErrorCheck -Method $method $siteUri
	$testCounter++;$passCounter += Test-Item "$siteUri should Error on $method" $testItem.StatusCode 404
	$testItem = iwr -SkipHttpErrorCheck -Method $method $siteUri
	$testCounter++;$passCounter += Test-Item "$siteUri should Error again on $method" $testItem.StatusCode 404

	#Multiple users
	$method = "Put"
	$siteUri = "http://localhost/test2"
	$testItem = iwr -SkipHttpErrorCheck -Method $method $siteUri -Body '{"URI":"/test2","Action":"data~%test2/2","Owner":"Gilgamech","AccessList":{"Gilgamech":["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"],"Everyone":["GET", "HEAD", "OPTIONS"]},"notes":"","Data":1000000}'
	$testCounter++;$passCounter += Test-Item "$siteUri should $method without error" $testItem.StatusCode 200

	$method = "Get"
	$testItem = iwr -SkipHttpErrorCheck -Method $method $siteUri
	$testCounter++;$passCounter += Test-Item "$siteUri should $method without error" $testItem.StatusCode 200

	#no Everyone
	$method = "Put"
	$siteUri = "http://localhost/test3"
	$testItem = iwr -SkipHttpErrorCheck -Method $method $siteUri -Body '{"URI":"/test3","Action":"data~%test3/2","Owner":"Gilgamech","AccessList":{"Gilgamech":["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"]},"notes":"","Data":1000000}'
	$testCounter++;$passCounter += Test-Item "$siteUri should $method without error" $testItem.StatusCode 200

	$method = "Get"
	$testItem = iwr -SkipHttpErrorCheck -Method $method $siteUri
	$testCounter++;$passCounter += Test-Item "$siteUri should Error on $method" $testItem.StatusCode 405
	 
	#Owner test
	$method = "Put"
	$siteUri = "http://localhost/test4"
	$testItem = iwr -SkipHttpErrorCheck -Method $method $siteUri -Body '{"URI":"/test4","Action":"data~%test4*2","Owner":"Gilgamech","AccessList":{"BobbyTables":["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"]},"notes":"","Data":1}'
	$testCounter++;$passCounter += Test-Item "$siteUri should $method without error" $testItem.StatusCode 200

	$method = "Get"
	$testItem = iwr -SkipHttpErrorCheck -Method $method $siteUri
	$testCounter++;$passCounter += Test-Item "$siteUri should Error on $method" $testItem.StatusCode 405
	 
	$method = "Get"
	$siteUri = "http://localhost/header.html"
	$testItem = iwr -SkipHttpErrorCheck -Method $method $siteUri 
	$testCounter++;$passCounter += Test-Item "$siteUri should $method without error" $testItem.StatusCode 200

	$method = "Get"
	$siteUri = "http://localhost/footer.html"
	$testItem = iwr -SkipHttpErrorCheck -Method $method $siteUri 
	$testCounter++;$passCounter += Test-Item "$siteUri should $method without error" $testItem.StatusCode 200

	#$method = "Put"
	#iwr -SkipHttpErrorCheck -Method $method $siteUri -Body (gc .\header.html) 
	#iwr -SkipHttpErrorCheck -Method $method $siteUri -Body (gc .\footer.html) 

	#Data concatenation
	$method = "Put"
	$siteUri = "http://localhost/page.html"
	$testItem = iwr -SkipHttpErrorCheck -Method $method $siteUri -Body '{"URI":"/page.html","Action":"data~%header.html <div class=\"textBubbleBG\"><h1>We Are Number 1!</h1></div> %footer.html","Owner":"Gilgamech","AccessList":{"Everyone":["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"]},"notes":"","Data":""}'
	$testCounter++;$passCounter += Test-Item "$siteUri should $method without error" $testItem.StatusCode 200

	#Login testing
	$method = "Put"
	$siteUri = "http://localhost/login"
	$testItem = iwr -SkipHttpErrorCheck -Method $method $siteUri -Body '{"URI":"/login","Action":"login","Owner":"Gilgamech","AccessList":{"Everyone":["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"]},"notes":"","Data":""}'
	$testCounter++;$passCounter += Test-Item "$siteUri should $method without error" $testItem.StatusCode 200

	$method = "Post"
	$testItem = iwr -SkipHttpErrorCheck -Method $method $siteUri -Body '{"username":"Gilgamech","password":"testingPass"}'
	$testCounter++;$passCounter += Test-Item "$siteUri should $method without error" ($testItem.content -split " ")[0] "Bearer"
	$token = $testItem.content
	$headers = @{};
	$headers.token = $token

	#Multiple users
	$method = "Put"
	$siteUri = "http://localhost/test2"
	$testItem = iwr -SkipHttpErrorCheck -Method $method $siteUri -Headers $headers -Body '{"URI":"/test2","Action":"data~%test2/2","Owner":"Gilgamech","AccessList":{"Gilgamech":["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"],"Everyone":["GET", "HEAD", "OPTIONS"]},"notes":"","Data":1000000}'
	$testCounter++;$passCounter += Test-Item "$siteUri should $method without error" $testItem.StatusCode 200

	#no Everyone
	$method = "Put"
	$siteUri = "http://localhost/test3"
	$testItem = iwr -SkipHttpErrorCheck -Method $method $siteUri -Headers $headers -Body '{"URI":"/test3","Action":"data~%test3/2","Owner":"Gilgamech","AccessList":{"Gilgamech":["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "MERGE"]},"notes":"","Data":1000000}'
	$testCounter++;$passCounter += Test-Item "$siteUri should $method without error" $testItem.StatusCode 200

	$method = "Get"
	$testItem = iwr -SkipHttpErrorCheck -Method $method $siteUri -Headers $headers
	$testCounter++;$passCounter += Test-Item "$siteUri should $method without error" $testItem.content 500000

	$method = "Get"
	$siteUri = "http://localhost/test4"
	$testItem = iwr -SkipHttpErrorCheck -Method $method $siteUri -Headers $headers
	$testCounter++;$passCounter += Test-Item "$siteUri should $method without error" $testItem.StatusCode 200
	
	$passRate = [math]::Round($passCounter*100/$testCounter,2)
	Write-Host "$testCounter of $passCounter tests passed, for a pass rate of $passRate %"
	return $passRate
}

function Push-Webserver() {
	docker push $latest
}
