# 🚀 VINOTECA - SETUP PARA MAÑANA

## ✅ Lo que está listo
- Backend Spring Boot 3 completamente configurado
- Frontend con arquitectura offline-first
- MySQL configurado (`vinos_galan`, user `Claude`, pass `Magui420`)
- APIs REST para Clientes, Zonas, Vinos, Viajes

## 🔧 PARA MAÑANA - 3 PASOS:

### PASO 1: Iniciar el Backend

**Opción A (RECOMENDADO - más fácil):**
```
1. Abre File Explorer
2. Ve a: C:\CLAUDE\vinoteca\backend
3. Haz doble click en: run-backend.bat
4. Espera 20-30 segundos a que aparezca "Started VinotecaApplication"
```

**Opción B (Si usás IntelliJ IDEA):**
```
1. Abre C:\CLAUDE\vinoteca\backend como proyecto
2. Click derecho en VinotecaApplication.java
3. Selecciona "Run"
4. Espera a que arranque
```

### PASO 2: Verifica que funciona
- Abre navegador: http://localhost:8110/api/zonas
- Debería retornar: `[]` (array vacío)

### PASO 3: Usa la app
- Web: https://vinosgalanlaplata.vercel.app/app/clientes
- App en celular: Abre la PWA (debería conectarse automáticamente al backend)

---

## 🗄️ BACKUP DE DATOS

Si necesitás backup:
```bash
# Exportar base de datos a SQL
mysqldump -h localhost -u Claude -pMagui420 vinos_galan > C:\backup-vinos.sql

# Importar si es necesario:
# mysql -h localhost -u Claude -pMagui420 vinos_galan < C:\backup-vinos.sql
```

---

## ❓ Si no funciona

**Error: "Maven no encontrado"**
→ Instala Maven desde: https://maven.apache.org/download.cgi
→ O usa IntelliJ IDEA que lo incluye

**Error: "Puerto 8110 ya está en uso"**
→ Cierra el proceso: `netstat -ano | findstr :8110`

**Error: "Conexión a MySQL rechazada"**
→ Asegúrate que MySQL esté corriendo
→ Verifica usuario/contraseña: `Claude` / `Magui420`

---

## 📊 Arquitectura

```
Frontend (Vercel)
    ↓
Intenta Backend (localhost:8110)
    ↓
Si no disponible → Fallback localStorage
    ↓
Sincroniza automáticamente cuando backend vuelve
    ↓
MySQL (vinos_galan) ← Datos reales persistidos
```

---

**Listo para trabajar. Solo ejecuta el backend mañana y ¡listo!** 🎉
