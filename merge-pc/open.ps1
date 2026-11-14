$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Windows.Forms

function Show-Note([string]$text) {
  [System.Windows.Forms.MessageBox]::Show($text, "센터 파일 합치기") | Out-Null
}

function Choose-Center([string]$center) {
  $dialog = New-Object System.Windows.Forms.OpenFileDialog
  $dialog.Title = "$center 파일을 고르세요. 없으면 취소를 누르세요."
  $dialog.Filter = "Excel (*.xlsx;*.xls;*.xlsm)|*.xlsx;*.xls;*.xlsm"
  $dialog.Multiselect = $false
  if ($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { return $null }
  return $dialog.FileName
}

function Find-Detail($book) {
  foreach ($sheet in @($book.Worksheets)) {
    $key = ($sheet.Name -replace "\s", "").ToLower()
    if ($key -eq "torderdetail" -or $key -eq "orderdetail" -or $key.Contains("orderdetail")) {
      return $sheet
    }
  }
  return $null
}

$picked = @()
foreach ($center in @("1센터", "2센터", "3센터")) {
  $path = Choose-Center $center
  if ($path) { $picked += [pscustomobject]@{ Center = $center; Path = $path } }
}
if ($picked.Count -eq 0) { exit 0 }

$save = New-Object System.Windows.Forms.SaveFileDialog
$save.Title = "업로드용 엑셀을 저장할 곳"
$save.Filter = "Excel (*.xlsx)|*.xlsx"
$save.FileName = "업로드용.xlsx"
if ($save.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { exit 0 }
$outPath = $save.FileName
if (-not $outPath.ToLower().EndsWith(".xlsx")) { $outPath += ".xlsx" }

$excel = $null
$outBook = $null
$opened = @()
try {
  $excel = New-Object -ComObject Excel.Application
  $excel.Visible = $false
  $excel.DisplayAlerts = $false
  $excel.AskToUpdateLinks = $false
  $outBook = $excel.Workbooks.Add()
  foreach ($item in $picked) {
    $src = $excel.Workbooks.Open($item.Path, 0, $true)
    $opened += $src
    $detail = Find-Detail $src
    if (-not $detail) {
      $names = @($src.Worksheets | ForEach-Object { $_.Name }) -join ", "
      throw "$($item.Center) 파일에 OrderDetail 시트가 없습니다.`n있는 시트: $names"
    }
    $detail.Copy([Type]::Missing, $outBook.Worksheets.Item($outBook.Worksheets.Count))
    $outBook.Worksheets.Item($outBook.Worksheets.Count).Name = $item.Center
    $src.Close($false)
    $opened = @($opened | Where-Object { $_ -ne $src })
  }
  for ($i = $outBook.Worksheets.Count; $i -ge 1; $i--) {
    $name = $outBook.Worksheets.Item($i).Name
    if ($name -ne "1센터" -and $name -ne "2센터" -and $name -ne "3센터" -and $outBook.Worksheets.Count -gt 1) {
      $outBook.Worksheets.Item($i).Delete()
    }
  }
  if (Test-Path -LiteralPath $outPath) { Remove-Item -LiteralPath $outPath -Force }
  $outBook.SaveAs($outPath, 51)
  $outBook.Close($true)
  $outBook = $null
  Show-Note "만들었습니다.`n$outPath"
  exit 0
} catch {
  Show-Note ("엑셀을 만들지 못했습니다.`n" + $_.Exception.Message)
  exit 1
} finally {
  foreach ($book in $opened) {
    try { $book.Close($false) } catch {}
  }
  if ($outBook) {
    try { $outBook.Close($false) } catch {}
  }
  if ($excel) {
    try { $excel.Quit() } catch {}
    try { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) } catch {}
  }
}
