# install_deepface_windows.ps1
# Instalador automático para ambiente DeepFace/TensorFlow no Windows

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   Instalador DeepFace/TensorFlow para Windows    " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está executando como administrador
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  AVISO: Execute este script como Administrador para melhor compatibilidade" -ForegroundColor Yellow
    Write-Host ""
}

# Função para verificar se um comando existe
function Test-CommandExists {
    param($command)
    $null = Get-Command $command -ErrorAction SilentlyContinue
    return $?
}

# Verificar Python instalado
Write-Host "📋 Verificando Python instalado..." -ForegroundColor Yellow
if (Test-CommandExists python) {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python encontrado: $pythonVersion" -ForegroundColor Green
    
    # Extrair versão
    if ($pythonVersion -match "Python (\d+)\.(\d+)\.(\d+)") {
        $major = [int]$matches[1]
        $minor = [int]$matches[2]
        
        if ($major -eq 3 -and $minor -gt 11) {
            Write-Host "❌ Python $major.$minor detectado. TensorFlow 2.11 requer Python 3.10 ou 3.11" -ForegroundColor Red
            Write-Host ""
            
            # Oferecer download do Python correto
            Write-Host "Deseja baixar Python 3.10? (S/N)" -ForegroundColor Yellow
            $response = Read-Host
            
            if ($response -eq 'S' -or $response -eq 's') {
                Write-Host "🌐 Abrindo página de download do Python 3.10..." -ForegroundColor Cyan
                Start-Process "https://www.python.org/downloads/release/python-31011/"
                Write-Host ""
                Write-Host "📝 Instruções:" -ForegroundColor Yellow
                Write-Host "1. Baixe 'Windows installer (64-bit)'" -ForegroundColor White
                Write-Host "2. Durante a instalação, marque 'Add Python to PATH'" -ForegroundColor White
                Write-Host "3. Após instalar, execute este script novamente" -ForegroundColor White
                Write-Host ""
                pause
                exit
            }
        }
    }
} else {
    Write-Host "❌ Python não encontrado!" -ForegroundColor Red
    Write-Host "📥 Baixe Python 3.10 de: https://www.python.org/downloads/release/python-31011/" -ForegroundColor Yellow
    pause
    exit
}

# Criar ambiente virtual
Write-Host ""
Write-Host "🔧 Criando ambiente virtual..." -ForegroundColor Yellow

$venvPath = ".\venv_deepface"
if (Test-Path $venvPath) {
    Write-Host "⚠️  Ambiente virtual já existe. Deseja recriá-lo? (S/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq 'S' -or $response -eq 's') {
        Remove-Item -Recurse -Force $venvPath
        python -m venv $venvPath
    }
} else {
    python -m venv $venvPath
}

# Ativar ambiente virtual
Write-Host "🔌 Ativando ambiente virtual..." -ForegroundColor Yellow
& "$venvPath\Scripts\Activate.ps1"

# Verificar se o ambiente foi ativado
if ($env:VIRTUAL_ENV) {
    Write-Host "✅ Ambiente virtual ativado" -ForegroundColor Green
} else {
    Write-Host "❌ Falha ao ativar ambiente virtual" -ForegroundColor Red
    Write-Host "Tente executar manualmente: $venvPath\Scripts\Activate.ps1" -ForegroundColor Yellow
    pause
    exit
}

# Atualizar pip
Write-Host ""
Write-Host "📦 Atualizando pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip

# Instalar dependências
Write-Host ""
Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow

# Array de pacotes com versões específicas
$packages = @(
    "flask==3.0.0",
    "flask-cors==4.0.0",
    "numpy==1.24.3",
    "opencv-python==4.8.1.78",
    "opencv-contrib-python==4.8.1.78",
    "pillow==10.1.0",
    "tensorflow==2.11.0",
    "deepface==0.0.79",
    "mtcnn==0.1.1",
    "retina-face==0.0.13"
)

foreach ($package in $packages) {
    Write-Host "📥 Instalando $package..." -ForegroundColor Cyan
    pip install $package
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao instalar $package" -ForegroundColor Red
    } else {
        Write-Host "✅ $package instalado com sucesso" -ForegroundColor Green
    }
}

# Verificar instalação do TensorFlow
Write-Host ""
Write-Host "🧪 Verificando instalação do TensorFlow..." -ForegroundColor Yellow
$testScript = @"
import tensorflow as tf
print(f'TensorFlow versão: {tf.__version__}')
print('TensorFlow instalado com sucesso!')
"@

$testScript | python

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ TensorFlow funcionando corretamente!" -ForegroundColor Green
} else {
    Write-Host "❌ Problema com TensorFlow" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possíveis soluções:" -ForegroundColor Yellow
    Write-Host "1. Instale Microsoft Visual C++ Redistributable:" -ForegroundColor White
    Write-Host "   https://aka.ms/vs/17/release/vc_redist.x64.exe" -ForegroundColor Cyan
    Write-Host "2. Instale Microsoft Visual C++ Build Tools:" -ForegroundColor White
    Write-Host "   https://visualstudio.microsoft.com/visual-cpp-build-tools/" -ForegroundColor Cyan
}

# Criar script de ativação
Write-Host ""
Write-Host "📝 Criando scripts auxiliares..." -ForegroundColor Yellow

# Script para ativar ambiente
$activateScript = @"
@echo off
echo Ativando ambiente DeepFace...
call venv_deepface\Scripts\activate.bat
echo Ambiente ativado! Use 'python app.py' para iniciar o servidor.
cmd /k
"@
$activateScript | Out-File -FilePath "ativar_deepface.bat" -Encoding ASCII

# Script para executar servidor
$runScript = @"
@echo off
echo Iniciando servidor DeepFace...
call venv_deepface\Scripts\activate.bat
python app.py
pause
"@
$runScript | Out-File -FilePath "executar_deepface.bat" -Encoding ASCII

Write-Host "✅ Scripts criados:" -ForegroundColor Green
Write-Host "   - ativar_deepface.bat (ativa o ambiente)" -ForegroundColor White
Write-Host "   - executar_deepface.bat (executa o servidor)" -ForegroundColor White

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "✅ Instalação concluída!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📌 Para executar o servidor:" -ForegroundColor Yellow
Write-Host "   1. Use 'executar_deepface.bat' ou" -ForegroundColor White
Write-Host "   2. Ative o ambiente: .\venv_deepface\Scripts\Activate.ps1" -ForegroundColor White
Write-Host "   3. Execute: python app.py" -ForegroundColor White
Write-Host ""

# Perguntar se deseja executar agora
Write-Host "Deseja executar o servidor agora? (S/N)" -ForegroundColor Yellow
$response = Read-Host

if ($response -eq 'S' -or $response -eq 's') {
    Write-Host "🚀 Iniciando servidor..." -ForegroundColor Cyan
    python app.py
}