$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$runtime = Join-Path $PSScriptRoot 'runtime'
if (-not (Test-Path $runtime)) {
  New-Item -ItemType Directory -Path $runtime | Out-Null
}

$env:DB_HOST = if ($env:IBLOG_TEST_DB_HOST) { $env:IBLOG_TEST_DB_HOST } else { '127.0.0.1' }
$env:DB_PORT = if ($env:IBLOG_TEST_DB_PORT) { $env:IBLOG_TEST_DB_PORT } else { '3306' }
$env:DB_USER = if ($env:IBLOG_TEST_DB_USER) { $env:IBLOG_TEST_DB_USER } else { 'root' }
$env:DB_PASS = if ($env:IBLOG_TEST_DB_PASS) { $env:IBLOG_TEST_DB_PASS } else { '' }
$env:DB_NAME = if ($env:IBLOG_TEST_DB_NAME) { $env:IBLOG_TEST_DB_NAME } else { 'ibloglv_test_' + $PID }
if (Test-Path Env:DB_DSN) {
  Remove-Item Env:DB_DSN
}
$env:APP_ENV = 'test'
$env:MAIL_DISABLE = '1'
$env:IBLOG_TEST_BASE_URL = 'http://127.0.0.1:18080'

$php = (Get-Command php).Source
$stdout = Join-Path $runtime 'server.out.log'
$stderr = Join-Path $runtime 'server.err.log'
$sessionPath = Join-Path $runtime 'sessions'
if (-not (Test-Path $sessionPath)) {
  New-Item -ItemType Directory -Path $sessionPath | Out-Null
}
$existingPids = @()
$listeners = netstat -ano | Select-String '127\.0\.0\.1:18080\s+.*LISTENING'
foreach ($listener in $listeners) {
  $parts = ($listener.Line -split '\s+') | Where-Object { $_ -ne '' }
  if ($parts.Length -gt 0) {
    $existingPids += [int] $parts[-1]
  }
}
foreach ($processId in ($existingPids | Select-Object -Unique)) {
  try {
    Stop-Process -Id $processId -Force -ErrorAction Stop
  } catch {
  }
}

if (Test-Path $stdout) {
  Remove-Item $stdout -Force
}
if (Test-Path $stderr) {
  Remove-Item $stderr -Force
}

$startInfo = New-Object System.Diagnostics.ProcessStartInfo
$startInfo.FileName = $php
$startInfo.Arguments = ('-d session.save_path="{0}" -S 127.0.0.1:18080 -t "{1}"' -f $sessionPath, $root)
$startInfo.WorkingDirectory = $root
$startInfo.UseShellExecute = $false
$startInfo.CreateNoWindow = $true
$startInfo.RedirectStandardOutput = $true
$startInfo.RedirectStandardError = $true

$server = New-Object System.Diagnostics.Process
$server.StartInfo = $startInfo
$server.Start() | Out-Null
$serverOutputTask = $server.StandardOutput.ReadToEndAsync()
$serverErrorTask = $server.StandardError.ReadToEndAsync()

try {
  $started = $false
  for ($i = 0; $i -lt 50; $i++) {
    Start-Sleep -Milliseconds 200
    try {
      $resp = Invoke-WebRequest 'http://127.0.0.1:18080/backend/view/components/auth/api-auth.php' -Method GET -UseBasicParsing
      if ($resp.StatusCode -ge 200) {
        $started = $true
        break
      }
    } catch {
      if ($_.Exception.Response -and $_.Exception.Response.StatusCode.value__ -ge 400) {
        $started = $true
        break
      }
    }
  }

  if (-not $started) {
    throw 'The PHP test server did not start correctly.'
  }

  $phpunit = Join-Path $root 'vendor/bin/phpunit'
  if (-not (Test-Path $phpunit) -and -not (Test-Path ($phpunit + '.bat'))) {
    throw 'PHPUnit is not installed. Run composer install first.'
  }

  if (Test-Path ($phpunit + '.bat')) {
    & ($phpunit + '.bat')
  } else {
    & $phpunit
  }

  exit $LASTEXITCODE
}
finally {
  if ($server -and -not $server.HasExited) {
    try {
      Stop-Process -Id $server.Id -Force -ErrorAction Stop
    } catch {
    }
  }

  if ($serverOutputTask) {
    [System.IO.File]::WriteAllText($stdout, $serverOutputTask.GetAwaiter().GetResult())
  }
  if ($serverErrorTask) {
    [System.IO.File]::WriteAllText($stderr, $serverErrorTask.GetAwaiter().GetResult())
  }
}
