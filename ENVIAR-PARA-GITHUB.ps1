# Script para enviar o projeto easy-games para GitHub (easygames-sitev2)
# Duplo clique ou: botão direito no arquivo -> "Executar com PowerShell"

$ErrorActionPreference = "Stop"
$repoUrl = "https://github.com/tarcisiodedaz-code/easygames-sitev2.git"
$pastaProjeto = $PSScriptRoot  # pasta onde está este script = easy-games

# Onde o Git costuma estar (GitHub Desktop instala aqui)
$gitPaths = @(
    "C:\Program Files\Git\bin\git.exe",
    "C:\Program Files (x86)\Git\bin\git.exe",
    "git"
)
$gitExe = $null
foreach ($p in $gitPaths) {
    if ($p -eq "git") {
        try { $null = Get-Command git -ErrorAction Stop; $gitExe = "git"; break } catch {}
    } else {
        if (Test-Path $p) { $gitExe = $p; break }
    }
}
if (-not $gitExe) {
    Write-Host "Git nao encontrado. Instale: https://git-scm.com/download/win ou use o GitHub Desktop." -ForegroundColor Red
    pause
    exit 1
}

Set-Location $pastaProjeto
Write-Host "Pasta do projeto: $pastaProjeto" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path ".git")) {
    Write-Host "Inicializando Git na pasta do projeto..." -ForegroundColor Yellow
    & $gitExe init
    & $gitExe branch -M main
}
Write-Host ""

$remoteExists = $false
try {
    $r = & $gitExe remote get-url origin 2>$null
    if ($r) { $remoteExists = $true }
} catch {}
if ($remoteExists) {
    Write-Host "Removendo remote 'origin' antigo para usar o repositorio correto..." -ForegroundColor Yellow
    & $gitExe remote remove origin
}
Write-Host "Configurando remote: $repoUrl" -ForegroundColor Yellow
& $gitExe remote add origin $repoUrl
Write-Host ""

Write-Host "Adicionando todos os arquivos..." -ForegroundColor Yellow
& $gitExe add -A
Write-Host ""

$status = & $gitExe status --short
if (-not $status) {
    Write-Host "Nenhum arquivo novo para commitar. Fazendo push do que ja existe..." -ForegroundColor Yellow
} else {
    Write-Host "Fazendo commit: 'Projeto completo Easy Games'..." -ForegroundColor Yellow
    & $gitExe commit -m "Projeto completo Easy Games"
}
Write-Host ""

Write-Host "Enviando para o GitHub (push)..." -ForegroundColor Yellow
& $gitExe push -u origin main

Write-Host ""
Write-Host "Concluido. Abra o repositorio: https://github.com/tarcisiodedaz-code/easygames-sitev2" -ForegroundColor Green
pause
