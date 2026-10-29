$path = 'c:/Users/gaga2/OneDrive/Desktop/fixed_files/script.js'
$text = Get-Content $path -Raw
$stack = New-Object System.Collections.Stack
for($i = 0; $i -lt $text.Length; $i++) {
    $ch = $text[$i]
    if ($ch -eq '{') {
        $stack.Push($i)
    } elseif ($ch -eq '}') {
        if ($stack.Count -gt 0) {
            $stack.Pop() | Out-Null
        } else {
            Write-Output ("extra } at index $i")
            break
        }
    }
}
if ($i -eq $text.Length) {
    if ($stack.Count -gt 0) {
        Write-Output ("unclosed { count=$($stack.Count) lastIndex=$($stack.Peek())")
    } else {
        Write-Output 'balanced'
    }
}
