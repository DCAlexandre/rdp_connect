Dim WShell
Set WShell = CreateObject("WScript.Shell")
' WShell.run "cmd /k echo " + Wscript.Arguments.Item(0)
WShell.Run "D:\Github\rdp_connect\dist\rdp_connect.exe " + Wscript.Arguments.Item(0), 0, false
Set WShell = Nothing
