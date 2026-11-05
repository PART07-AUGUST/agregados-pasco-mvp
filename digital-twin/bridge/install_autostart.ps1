$ErrorActionPreference = 'Stop'

$taskName = 'AgregadosOpenPLCBridge'
$bridgeDir = $PSScriptRoot
$repoRoot = Split-Path -Parent (Split-Path -Parent $bridgeDir)
$python = Join-Path $bridgeDir '.venv\Scripts\python.exe'
$runner = Join-Path $bridgeDir 'run_bridge_hidden.vbs'
$envFile = Join-Path $bridgeDir '.env'

if (-not (Test-Path -LiteralPath $python)) {
    throw "Python environment is missing: $python"
}
if (-not (Test-Path -LiteralPath $envFile)) {
    throw "Bridge credentials are missing: $envFile"
}

$user = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$action = New-ScheduledTaskAction -Execute (Join-Path $env:WINDIR 'System32\wscript.exe') -Argument ('//B "' + $runner + '"') -WorkingDirectory $repoRoot
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $user
$principal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Seconds 0) `
    -MultipleInstances IgnoreNew `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -StartWhenAvailable `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
Start-ScheduledTask -TaskName $taskName
Write-Output "Installed and started $taskName for $user"
