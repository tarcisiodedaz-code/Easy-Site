# Rode este script DENTRO da pasta "Easy Site" (depois de mover os arquivos do easy-games para ca)
# Duplo clique em RODAR-ENVIAR-EASY-SITE.bat

$ErrorActionPreference = "Stop"
$repoUrl = "https://github.com/tarcisiodedaz-code/easygames-sitev2.git"
$pastaProjeto = $PSScriptRoot

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
    Write-Host "Git nao encontrado. Instale: https://git-scm.com/download/win" -ForegroundColor Red
    pause
    exit 1
}

Set-Location $pastaProjeto
Write-Host "Pasta do projeto: $pastaProjeto" -ForegroundColor Cyan
Write-Host ""

if (Test-Path ".git") {
    Write-Host "Removendo .git antigo para comecar limpo..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .git
}
Write-Host "Inicializando Git..." -ForegroundColor Yellow
& $gitExe init
& $gitExe branch -M main
Write-Host ""

Write-Host "Configurando remote: $repoUrl" -ForegroundColor Yellow
& $gitExe remote add origin $repoUrl
Write-Host ""

Write-Host "Adicionando todos os arquivos..." -ForegroundColor Yellow
& $gitExe add -A
Write-Host ""

Write-Host "Commit: Projeto completo Easy Games..." -ForegroundColor Yellow
& $gitExe commit -m "Projeto completo Easy Games"
Write-Host ""

Write-Host "Enviando para o GitHub (push)..." -ForegroundColor Yellow
& $gitExe push -u origin main

Write-Host ""
Write-Host "Concluido. Repositorio: https://github.com/tarcisiodedaz-code/easygames-sitev2" -ForegroundColor Green
pause
