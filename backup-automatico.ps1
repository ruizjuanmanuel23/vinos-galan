# Script de Backup Automático para Vinoteca
# Ejecuta: powershell -ExecutionPolicy Bypass -File backup-automatico.ps1

$BackupDir = "C:\BACKUP-VINOTECA"
$LogFile = "$BackupDir\backup-log.txt"
$MaxBackups = 30  # Guardar últimos 30 backups

# Crear carpeta si no existe
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
    Write-Host "✓ Carpeta de backup creada: $BackupDir"
}

function LogMensaje {
    param([string]$msg)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $linea = "[$timestamp] $msg"
    Add-Content -Path $LogFile -Value $linea
    Write-Host $linea
}

function HacerBackup {
    $fecha = Get-Date -Format "yyyy-MM-dd_HHmmss"
    $archivo = "$BackupDir\vinos_galan_$fecha.sql"

    try {
        # Hacer backup
        & mysqldump -h localhost -u Claude -pMagui420 vinos_galan | Out-File -Encoding utf8 $archivo

        if (Test-Path $archivo) {
            $tamaño = (Get-Item $archivo).Length / 1KB
            LogMensaje "✓ Backup exitoso: vinos_galan_$fecha.sql ($([math]::Round($tamaño, 2)) KB)"
            return $true
        }
    } catch {
        LogMensaje "✗ Error en backup: $_"
        return $false
    }
}

function LimpiarBackupsViejos {
    # Eliminar backups más antiguos que MaxBackups
    $backups = Get-ChildItem $BackupDir -Filter "*.sql" | Sort-Object CreationTime -Descending

    if ($backups.Count -gt $MaxBackups) {
        $aEliminar = $backups | Select-Object -Skip $MaxBackups
        foreach ($archivo in $aEliminar) {
            Remove-Item $archivo.FullName
            LogMensaje "Limpiado: $($archivo.Name)"
        }
    }
}

# Hacer primer backup
Write-Host "🔄 Iniciando backup automático de Vinoteca..."
Write-Host "Carpeta: $BackupDir"
Write-Host ""

HacerBackup
LimpiarBackupsViejos

# Loop infinito - hacer backup cada hora
while ($true) {
    Start-Sleep -Seconds 3600  # Esperar 1 hora

    Write-Host "`n[$(Get-Date -Format 'HH:mm:ss')] Ejecutando backup automático..."
    HacerBackup
    LimpiarBackupsViejos
}

# Para parar el script: Ctrl+C
Write-Host "✓ Script de backup en ejecución..."
