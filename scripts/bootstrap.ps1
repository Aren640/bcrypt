$ErrorActionPreference = "Stop"

function Find-ProjectRoot {
  param([string]$StartPath)

  $current = Resolve-Path $StartPath
  while ($true) {
    if (Test-Path (Join-Path $current "package.json")) {
      return $current
    }

    $parent = Split-Path $current -Parent
    if ($parent -eq $current) {
      throw "No se encontro package.json en la jerarquia de carpetas."
    }

    $current = $parent
  }
}

function New-RandomSecret {
  param([int]$Length = 48)

  $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}"
  $result = ""
  for ($i = 0; $i -lt $Length; $i++) {
    $result += $chars[(Get-Random -Minimum 0 -Maximum $chars.Length)]
  }
  return $result
}

function Get-EnvMap {
  param([string]$Path)

  $map = @{}
  if (-not (Test-Path $Path)) {
    return $map
  }

  Get-Content $Path | ForEach-Object {
    if ([string]::IsNullOrWhiteSpace($_)) { return }
    if ($_.TrimStart().StartsWith("#")) { return }

    $idx = $_.IndexOf("=")
    if ($idx -lt 1) { return }

    $key = $_.Substring(0, $idx).Trim()
    $value = $_.Substring($idx + 1)
    $map[$key] = $value
  }

  return $map
}

function Set-EnvValue {
  param(
    [string]$Path,
    [string]$Key,
    [string]$Value
  )

  $lines = @()
  if (Test-Path $Path) {
    $lines = Get-Content $Path
  }

  $updated = $false
  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "^\s*$Key=") {
      $lines[$i] = "$Key=$Value"
      $updated = $true
      break
    }
  }

  if (-not $updated) {
    $lines += "$Key=$Value"
  }

  Set-Content -Path $Path -Value $lines -Encoding UTF8
}

function Test-PortInUse {
  param([int]$Port)

  try {
    $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop
    return $connections.Count -gt 0
  }
  catch {
    return $false
  }
}

function Stop-ProjectNodeProcesses {
  param([string]$ProjectRoot)

  $escapedRoot = [Regex]::Escape($ProjectRoot)
  $processes = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match $escapedRoot }

  foreach ($proc in $processes) {
    try {
      Stop-Process -Id $proc.ProcessId -Force -ErrorAction Stop
      Write-Host "[bootstrap] Detenido node PID $($proc.ProcessId) para liberar Prisma"
    }
    catch {
      Write-Host "[bootstrap] No se pudo detener PID $($proc.ProcessId), continuo"
    }
  }
}

function Invoke-NpmScript {
  param(
    [Parameter(Mandatory = $true)][string]$ScriptName,
    [switch]$AllowFailure
  )

  npm run $ScriptName
  if ($LASTEXITCODE -ne 0 -and -not $AllowFailure) {
    throw "npm run $ScriptName failed with exit code $LASTEXITCODE"
  }

  return ($LASTEXITCODE -eq 0)
}

$projectRoot = Find-ProjectRoot -StartPath $PSScriptRoot
Set-Location $projectRoot

$envPath = Join-Path $projectRoot ".env"
if (-not (Test-Path $envPath)) {
  $jwtSecret = New-RandomSecret
  @"
DATABASE_URL=postgresql://Emilio:1402556z@localhost:5433/BaseEmilio
JWT_ACCESS_SECRET=$jwtSecret
PORT=3000
NODE_ENV=development
BCRYPT_SALT_ROUNDS=12
JWT_ACCESS_EXPIRES_IN=15m
JWT_ISSUER=auth-bcrypt-ejercicio
CORS_ORIGIN=*
"@ | Set-Content -Path $envPath -Encoding UTF8
  Write-Host "[bootstrap] .env creado"
}
else {
  Write-Host "[bootstrap] .env ya existe"
}

$envMap = Get-EnvMap -Path $envPath

if (-not (Test-Path (Join-Path $projectRoot "node_modules"))) {
  Write-Host "[bootstrap] Instalando dependencias..."
  npm install
  if ($LASTEXITCODE -ne 0) {
    throw "npm install failed with exit code $LASTEXITCODE"
  }
}
else {
  Write-Host "[bootstrap] node_modules ya existe, omitiendo npm install"
}

Write-Host "[bootstrap] Generando cliente Prisma..."
Stop-ProjectNodeProcesses -ProjectRoot $projectRoot
Invoke-NpmScript -ScriptName "prisma:generate" | Out-Null

Write-Host "[bootstrap] Aplicando migraciones..."
if (-not (Invoke-NpmScript -ScriptName "prisma:deploy" -AllowFailure)) {
  Write-Host "[bootstrap] prisma:deploy fallo, intentando prisma:push..."
  Invoke-NpmScript -ScriptName "prisma:push" | Out-Null
}

$port = 3000
if ($envMap.ContainsKey("PORT")) {
  $parsed = 0
  if ([int]::TryParse($envMap["PORT"], [ref]$parsed)) {
    $port = $parsed
  }
}

if ($port -eq 3000 -and (Test-PortInUse -Port 3000)) {
  Write-Host "[bootstrap] Puerto 3000 ocupado, cambiando a 3001 en .env"
  Set-EnvValue -Path $envPath -Key "PORT" -Value "3001"
  $port = 3001
}

Write-Host ""
Write-Host "[bootstrap] Todo listo"
Write-Host "Health: http://localhost:$port/health"
Write-Host ""
Write-Host "PowerShell examples:"
Write-Host "`$base = 'http://localhost:$port'"
Write-Host "Invoke-RestMethod -Method GET -Uri ""`$base/health"""
Write-Host "Invoke-RestMethod -Method POST -Uri ""`$base/auth/register"" -ContentType 'application/json' -Body '{""email"":""user@example.com"",""password"":""Abcdef1!"",""name"":""Emilio""}'"
Write-Host "`$login = Invoke-RestMethod -Method POST -Uri ""`$base/auth/login"" -ContentType 'application/json' -Body '{""email"":""user@example.com"",""password"":""Abcdef1!""}'"
Write-Host "`$token = `$login.accessToken"
Write-Host "Invoke-RestMethod -Method GET -Uri ""`$base/auth/me"" -Headers @{ Authorization = ""Bearer `$token"" }"
Write-Host ""
Write-Host "[bootstrap] Iniciando servidor..."
npm run dev
