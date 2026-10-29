param([int]$Index)
$path = 'c:/Users/gaga2/OneDrive/Desktop/fixed_files/script.js'
$text = Get-Content $path -Raw
if($Index -lt 0 -or $Index -ge $text.Length){
    Write-Output "Index out of range"
    exit
}
$start = [Math]::Max(0, $Index - 200)
$length = [Math]::Min(400, $text.Length - $start)
$snippet = $text.Substring($start, $length)
$lineNumber = ($text.Substring(0, $Index) -split '\n').Count
Write-Output ("line=" + $lineNumber)
Write-Output $snippet
