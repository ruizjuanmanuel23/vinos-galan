# 🗄️ ALMACENAMIENTO DE DATOS - GUÍA COMPLETA

## 📍 DÓNDE ESTÁN TUS DATOS

### 1️⃣ **localStorage (En el navegador/APK)**
- **Ubicación**: Memoria del navegador/PWA
- **Contenido**: Copia local de Clientes, Vinos, Zonas, Viajes
- **Propósito**: Funciona SIN internet (offline-first)
- **Persistencia**: Se borra si limpias cache del navegador
- **Acceso**:
  ```javascript
  // En console del navegador (F12)
  localStorage.getItem('vg:clientes')  // Ver clientes guardados
  localStorage.getItem('vg:zonas')     // Ver zonas
  localStorage.getItem('vg:viajes')    // Ver viajes
  JSON.parse(localStorage.getItem('vg:clientes'))  // Ver formateado
  ```

### 2️⃣ **MySQL (Base de datos real)**
- **Ubicación**: PC local → `vinos_galan`
- **Host**: `localhost:3306`
- **Usuario**: `Claude`
- **Contraseña**: `Magui420`
- **Propósito**: Almacenamiento persistente y respaldo
- **Tablas**:
  - `clientes` - Clientes
  - `zonas` - Barrios/Zonas
  - `vinos` - Catálogo de vinos
  - `viajes` - Repartos
  - `paradas` - Paradas en viajes
  
**Acceso a MySQL:**
```bash
mysql -h localhost -u Claude -pMagui420 vinos_galan

# Ver estructura
SHOW TABLES;
DESC clientes;

# Ver datos
SELECT * FROM clientes;
SELECT * FROM zonas;

# Contar registros
SELECT COUNT(*) FROM clientes;
```

### 3️⃣ **Sincronización (Cómo funciona)**

```
┌─────────────────────────────────────────────────┐
│         USUARIO EN APP (Web o APK)              │
└────────────────┬────────────────────────────────┘
                 │
         ┌───────▼──────────┐
         │ Intenta Backend  │  (http://localhost:8110)
         │ (Spring Boot)    │
         └───────┬──────────┘
                 │
          ┌──────▼─────────┐
    ¿Está disponible?
          └──────┬─────────┘
                 │
        ┌────────┴────────┐
        │                 │
     SÍ ◀───────────────► NO
        │                 │
        ▼                 ▼
      MySQL        localStorage
   (fuente real)   (caché local)
        │                 │
        └────────┬────────┘
                 ▼
        ✅ DATOS SINCRONIZADOS
        
Cuando backend vuelve online → Sincroniza automáticamente
```

---

## 💾 BACKUP AUTOMÁTICO

### OPCIÓN A: Backup diario (recomendado)
```bash
# Ejecutar en PowerShell cada mañana

$fecha = Get-Date -Format "yyyy-MM-dd_HHmmss"
$ruta = "C:\BACKUP-VINOTECA\$fecha.sql"

# Crear carpeta si no existe
New-Item -ItemType Directory -Path "C:\BACKUP-VINOTECA" -Force | Out-Null

# Hacer backup
mysqldump -h localhost -u Claude -pMagui420 vinos_galan > $ruta

Write-Host "✓ Backup guardado en: $ruta"
Write-Host "✓ Tamaño: $((Get-Item $ruta).Length) bytes"
```

### OPCIÓN B: Backup automático cada hora (Script Windows)
```batch
REM Crear archivo: C:\CLAUDEBACKUP-VINOTECA.bat

@echo off
REM Script de backup automático cada hora

:loop
set timestamp=%date:~-4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set timestamp=%timestamp: =0%
set output=C:\BACKUP-VINOTECA\vinos_galan_%timestamp%.sql

mkdir C:\BACKUP-VINOTECA 2>nul

mysqldump -h localhost -u Claude -pMagui420 vinos_galan > %output%

echo [%date% %time%] Backup guardado: %output% >> C:\BACKUP-VINOTECA\log.txt

REM Esperar 1 hora (3600 segundos)
timeout /t 3600

goto loop
```

**Ejecutar en background:**
```powershell
# PowerShell como Admin
Start-Process -NoWindow "C:\CLAUDEBACKUP-VINOTECA.bat"
```

### OPCIÓN C: Backup desde la app (exportar JSON)
```typescript
// Agregar a frontend para descargar backup

export async function exportarBackup() {
  const clientes = await db.listClientes()
  const zonas = await db.listZonas()
  const vinos = await db.listVinos()
  const viajes = await db.listViajes()
  
  const backup = {
    fecha: new Date().toISOString(),
    clientes,
    zonas,
    vinos,
    viajes,
  }
  
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
}
```

---

## 🔒 SEGURIDAD

### ✅ Datos SEGUROS porque:
- **MySQL**: Almacenamiento persistente (no se pierden con reinicios)
- **localStorage**: Backup automático en el navegador
- **Sincronización**: Datos en múltiples lugares (redundancia)
- **No en la nube**: Todo en tu PC (máximo control)

### ⚠️ Riesgos a tener en cuenta:
- Si limpias cache del navegador → Se pierde localStorage (pero no MySQL)
- Si formateas el disco → Se pierde MySQL (por eso necesitamos backup)
- Si desinstales la APK → Se pierde localStorage de la app (pero no MySQL)

### 🛡️ Protección recomendada:
1. **Backup diario** en un USB externo
2. **Backup en la nube** (Google Drive, Dropbox) opcional
3. **Documentar cambios** importantes en un registro

---

## 🔄 RESTAURAR DESDE BACKUP

Si algo se daña:

```bash
# Restaurar desde SQL
mysql -h localhost -u Claude -pMagui420 vinos_galan < C:\backup.sql

# Si la DB no existe aún
mysql -h localhost -u Claude -pMagui420 < C:\backup.sql
```

---

## 📊 VERIFICAR QUE TODO ESTÁ BIEN

```bash
# 1. Verificar que MySQL esté corriendo
mysql -h localhost -u Claude -pMagui420 -e "SELECT 1"

# 2. Verificar tablas y datos
mysql -h localhost -u Claude -pMagui420 vinos_galan -e "SELECT COUNT(*) as total FROM clientes;"

# 3. Ver último backup
dir C:\BACKUP-VINOTECA /O:D

# 4. Tamaño de la DB
mysql -h localhost -u Claude -pMagui420 vinos_galan -e "SELECT SUM(data_length + index_length) / 1024 / 1024 as 'Tamaño MB' FROM information_schema.tables WHERE table_schema='vinos_galan';"
```

---

## 📋 CHECKLIST SEMANAL

- [ ] Backup hecho ✓
- [ ] MySQL corriendo ✓
- [ ] Datos visibles en la app ✓
- [ ] Clientes pueden cargar sin internet ✓
- [ ] Datos se sincronizan cuando hay internet ✓

**Ahora puedes trabajar seguro sabiendo EXACTAMENTE dónde están tus datos.** 🎉
