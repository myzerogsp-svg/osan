param([string]$ExcelPath)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Windows.Forms

function Show-Note([string]$text) {
  [System.Windows.Forms.MessageBox]::Show($text, "센터 생산성") | Out-Null
}

try {
  if ([string]::IsNullOrWhiteSpace($ExcelPath)) {
    $dialog = New-Object System.Windows.Forms.OpenFileDialog
    $dialog.Title = "작업 엑셀과 1, 2, 3센터 배치표를 함께 고르세요"
    $dialog.Filter = "Excel (*.xlsx, *.xlsm, *.xls)|*.xlsx;*.xlsm;*.xls"
    $dialog.Multiselect = $true
    if ($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { exit 0 }
    $paths = @($dialog.FileNames)
  } else {
    $paths = @($ExcelPath)
  }

  foreach ($path in $paths) {
    if (-not (Test-Path -LiteralPath $path)) {
      Show-Note "엑셀 파일을 찾지 못했습니다.`n$path"
      exit 1
    }
  }

  $here = Split-Path -Parent $MyInvocation.MyCommand.Path
  $templatePath = Join-Path $here "센터생산성.html"
  if (-not (Test-Path -LiteralPath $templatePath)) {
    Show-Note "같은 폴더에 센터생산성.html 이 없습니다."
    exit 1
  }

  $parts = foreach ($path in $paths) {
    $b64 = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($path))
    $nameJs = [System.IO.Path]::GetFileName($path) | ConvertTo-Json -Compress
    '{"name":' + $nameJs + ',"b64":"' + $b64 + '"}'
  }
  $html = [System.IO.File]::ReadAllText($templatePath)
  $token = 'window.__WB_FILES__=[]'
  if ($html.IndexOf($token) -lt 0) {
    Show-Note "화면 파일이 예전 버전입니다. 회사 PC용을 다시 받아 주세요."
    exit 1
  }
  $html = $html.Replace($token, 'window.__WB_FILES__=[' + ($parts -join ',') + ']')

  $first = $paths[0]
  $firstB64 = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($first))
  $firstName = [System.IO.Path]::GetFileName($first) | ConvertTo-Json -Compress
  $html = $html.Replace('window.__WB__=""', 'window.__WB__="' + $firstB64 + '"')
  $html = $html.Replace('window.__WB_NAME__=""', 'window.__WB_NAME__=' + $firstName)

  $outDir = Join-Path $env:TEMP "center-productivity"
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null
  $out = Join-Path $outDir "view.html"
  [System.IO.File]::WriteAllText($out, $html, [System.Text.UTF8Encoding]::new($false))

  $edge = @(
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
  ) | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
  if ($edge) {
    Start-Process -FilePath $edge -ArgumentList $out
  } else {
    Start-Process $out
  }
  exit 0
} catch {
  Show-Note ("엑셀을 열지 못했습니다.`n" + $_.Exception.Message)
  exit 1
}
