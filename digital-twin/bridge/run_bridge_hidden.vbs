Option Explicit

Dim files, shell, bridgeDir, projectRoot, python, runner, command, exitCode
Set files = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")
bridgeDir = files.GetParentFolderName(WScript.ScriptFullName)
projectRoot = files.GetParentFolderName(files.GetParentFolderName(bridgeDir))
python = files.BuildPath(bridgeDir, ".venv\Scripts\python.exe")
runner = files.BuildPath(bridgeDir, "run_bridge.py")
shell.CurrentDirectory = projectRoot
command = Chr(34) & python & Chr(34) & " " & Chr(34) & runner & Chr(34)
exitCode = shell.Run(command, 0, True)
WScript.Quit exitCode
