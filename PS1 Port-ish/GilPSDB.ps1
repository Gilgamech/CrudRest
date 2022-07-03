# C:\Dropbox\repos\www\GilPSDB\GilPSDB.ps1 Build: 7 2017-02-20T19:50:27     


# 3 : 9 : Write_Host _f green "GilCLC.ps1 Build: $GilCLCVersion"
# 4 : 18 :  Param_    [string]$Query   _; #end Param
# 5 : 18 :  Param_    [string]$Query   _; #end Param
# 6 : 31 :   [Parameter_Mandatory=$True_]    [ValidateSet_"c", "r", "u", "d"_]  [string]$OperationType,
# 7 : 142 : if _$Deleted_ _  #a _; # end if Deleted

$GilPSDB = "C:\Dropbox\repos\www\GilPSDB\GilPSDB.ps1"
$GilPSDBVersion = ([int](gc $GilPSDB)[0].split(" ")[3])
Write-Host -f green "GilPSDB.ps1 Build: $GilPSDBVersion"

$DataFolder = "C:\Dropbox\repos\www\GilPSDB\"
[int]$SGDBClientServerPort = 65002
New-Alias -Name igq -Value Invoke-GilPSDBQuery -Force
New-Alias -Name sgdb -Value Start-GilPSDB -Force


<#
c - Write record:
Request: c10 test
Response: 10

r - Read record
Request: r10
Response: test

u - Update record.
Request: u10 trees
Response: trees
- Responds

d - Delete record.
Request: d10 
Response: d10 00000
- Responds
#>


Function Invoke-GilPSDBQuery {
#http://powershell.com/cs/blogs/tips/archive/2012/05/09/communicating-between-multiple-powershells-via-udp.aspx
	Param(
		[Parameter(Mandatory=$True)][ValidateSet("c", "r", "u", "d","q")][string]$OperationType,
		[object]$Query = (Get-Clipboard),
		[int]$RecordNumber,
		[ipaddress]$ServerAddr = "172.0.0.1",
		[int]$ServerPort = $SGDBClientServerPort,
		#[int]$QueryPort = 65002,
		#[ipaddress]$ServerAddr = $localhost,
		#[int]$ServerPort = $RemotePort,
		[string]$FileName,
		[switch]$NotContinuous,
		[switch]$NotJSON,
		[int]$Timeout = 2000,
		[switch]$Insecure
	); #end Param
	$SGDBClientServerPort = $ServerPort
	$Message = @();
	$Message = "$($OperationType):$RecordNumber`n$Query"
	Send-UDPText -Message ($Message) -ServerAddr $ServerAddr -ServerPort $SGDBClientServerPort -Insecure
	$SGDBClientServerPort++
	$UDPData = Start-UDPListen -ServerPort ($SGDBClientServerPort) -NotContinuous -Insecure
	$SGDBClientServerPort,$Data = $UDPData -split "`n"
	$SGDBClientServerPort++
	$Data
	write-verbose $SGDBClientServerPort
}; #end Invoke-GilPSDBQuery


#http://powershell.com/cs/blogs/tips/archive/2012/05/09/communicating-between-multiple-powershells-via-udp.aspx
Function Start-GilPSDB {
	Param(
		[ipaddress]$ServerAddr = "172.0.0.1",
		[int]$ServerPort =  $ServerPort,
		#[ipaddress]$ServerAddr = $localhost,
		#[int]$ServerPort = $RemotePort,
		[string]$FileName = "GilFile.gdb",
		[switch]$NotContinuous,
		[switch]$NotJSON,
		[int]$Timeout = 2000,
		[switch]$Insecure
	); #end Param
	Begin {
		#$DBData = @();
		$Hostname = hostname;
		$Timestamp = Get-Date -f s
		$DBData = @();
		#Load data file, if any. If none, populate one with initial variables.
		$DataFile = $DataFolder + $FileName;
		$DBData += try {
			gc -raw $DataFile | ConvertFrom-Json
			$Data = "GilPSDB starting."
		} catch {
			"Index,OperationType,Data,SourceIP,SourcePort,Timestamp,Timestamp" | convertto-json > $DataFile
			gc $DataFile | ConvertFrom-Json
			$Data = "GilPSDB new file: $DataFile"
		} # end try
		$OpType = "c"
		
		$Index = $DBData[-1].Index +1
		$AddToDB = "$Index,$OpType,$Data,$Hostname,$ServerPort,$Timestamp,$Timestamp"
		$AddToDB = $AddToDB | Add-Member @{"Index"=$Index} -passthru
		$AddToDB = $AddToDB | Add-Member @{"OperationType"=$OpType} -passthru
		$AddToDB = $AddToDB | Add-Member @{"Data"=$Data} -passthru
		$AddToDB = $AddToDB | Add-Member @{"SourceIP"=$Hostname} -passthru
		$AddToDB = $AddToDB | Add-Member @{"SourcePort"=$ServerPort} -passthru
		$AddToDB = $AddToDB | Add-Member @{"Deleted"=$False} -passthru
		$AddToDB = $AddToDB | Add-Member @{"FirstWrite"=$Timestamp} -passthru
		$AddToDB = $AddToDB | Add-Member @{"LatestUpdate"=$Timestamp} -passthru
		$DBData += $AddToDB
		
		Write-Host "$AddToDB"

	}
	Process {
	# Continuous process
	$iterate = $True
	while ($iterate) {
		# Listen on port, CRUD the variable and reply.
		# Save file occasionally. Every 10 minutes?
		# How to exit? "Press Q to quit?" Or have it run in a job and keep an interactive console?
		$UDPInput = Start-UDPListen -ServerPort $ServerPort -NotContinuous -Insecure -SourceInfo
		$ServerPort++
		$Timestamp = Get-Date -f s
		$SourceIP,$SourcePort = $UDPInput[-1] -split ":"
		$UDPData= $UDPInput | where {$_ -ne $UDPInput[-1]}
		$OpType,$Data = $UDPData -split "`n"
		$OpType,$RecordNumber = $OpType -split ":"
		#$OpType = $UDPInput[0]
		#$Data = $UDPInput[1..($UDPInput.Length -2)]
		#$Data = $UDPInput -split "`n" -replace $OpType,"" -replace "$($SourceIP + ":" + $SourcePort)","" -join ""
		#$Input[0] = $Input[0]-split ".",2) -join ""

		
		$Result = Switch ($OpType) {
			"q" {
				"Quit query received, application closing."
				$null = ($iterate = $false)
			}; #end switch c
			"c" {
				"Record $Index Created."
			}; #end switch c
			"r" { 
				if ($RecordNumber > $DBData.Length) {
					"Max Record $($DBData.Length)."
				} elseif (($DBData[$RecordNumber].Deleted)) {
					"Record $RecordNumber Deleted."
				} else {
					$(($DBData | where {$_.Index -eq $RecordNumber}) | select-object -expandproperty $Data)
				}; # end if Deleted
			}; #end switch r
			"u" {
				"Record $RecordNumber Updated."
				$null = ($DBData | where {$_.Index -eq $RecordNumber}).Data = $Data
				$null = ($DBData | where {$_.Index -eq $RecordNumber}).LatestUpdate = $Timestamp
			}; #end switch u
			"d" {
				"Record $RecordNumber Deleted."
				$null = ($DBData | where {$_.Index -eq $RecordNumber}).deleted = $True
				$null = ($DBData | where {$_.Index -eq $RecordNumber}).LatestUpdate = $Timestamp
			}; #end switch d
			default {
				"Default."
			}; #end switch default
		}; #end switch OpType
		
		Write-Host "Operation Type: $OpType"
		Write-Host "Data received: $Data"
		Write-Host "Record Number: $RecordNumber"
		Write-Host "Output sent: $Result"
		
		$Index++
		$AddToDB = "$Index,$OpType,$Data,$SourceIP,$SourcePort,$Timestamp,$Timestamp"
		$AddToDB = $AddToDB | Add-Member @{"Index"=$Index} -passthru
		$AddToDB = $AddToDB | Add-Member @{"OperationType"=$OpType} -passthru
		$AddToDB = $AddToDB | Add-Member @{"Data"=$Data} -passthru
		$AddToDB = $AddToDB | Add-Member @{"SourceIP"=$SourceIP} -passthru
		$AddToDB = $AddToDB | Add-Member @{"SourcePort"=$SourcePort} -passthru
		$AddToDB = $AddToDB | Add-Member @{"Deleted"=$False} -passthru
		$AddToDB = $AddToDB | Add-Member @{"FirstWrite"=$Timestamp} -passthru
		$AddToDB = $AddToDB | Add-Member @{"LatestUpdate"=$Timestamp} -passthru
		
		
		$DBData += $AddToDB
		Write-Host "$AddToDB"
		
		$Message = "$ServerPort`n$Result"
		sleep 0.1
		Send-UDPText -Message $Message -ServerAddr $SourceIP -ServerPort $ServerPort -Insecure
		$ServerPort++
		
		if ($NotContinuous) {
			$iterate = $false
		}; #end if NotContinuous
	
	} # end while
	} End {
	# Close any connections.
	# Write file.
		$DBData | ConvertTo-Json > $DataFile 		
	}
	

}; #end Start-GilPSDB


