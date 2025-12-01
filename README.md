# Proyecto: Despliegue de Aplicación Web Interna sin HTTPS

Este proyecto documenta la instalación, configuración y despliegue de una aplicación web que corresponde a la parte FrontEnd del proyecto JOYASTACK.

Incluye:

* Configuración del frontend.
* Solución a problemas comunes.
* Proceso de despliegue completo.

---

## Requisitos previos

* Node (se recomienda **Node 20 LTS**). Vite 7+ requiere Node >= 18; para evitar errores ESM usar Node 20.
* npm (v10+ con Node 20).
* Acceso al repositorio del frontend en el servidor o máquina donde se hará el build.

---


## 1. Instalar Node 20 en Ubuntu (comandos usados)

```bash
# eliminar versiones viejas (opcional)
sudo apt remove nodejs -y
sudo apt autoremove -y

# instalar Node 20 (oficial)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# verificar
node -v    # debe mostrar v20.x.x
npm -v
```

---

## 2. Preparar el proyecto frontend

En la carpeta del proyecto (`frontend-joyastack`):

```bash
# eliminar instalaciones anteriores (opcional pero recomendado para limpieza)
rm -rf node_modules package-lock.json

# instalar dependencias
npm install

# verificar que vite esté instalado
npm list vite
```

Si `npm list vite` muestra una versión (p. ej. `vite@7.x`) está bien; si no, instala explícitamente:

```bash
npm install --save-dev vite@7
```

---

## 3. Errores comunes y cómo los solucionamos

### 3.1 `SyntaxError: Unexpected token {` al correr `npm run build`

Causa: Node demasiado antiguo que no soporta ESM / `import` desde `node:`. Solución: actualizar a Node 18+ (recomendado Node 20). Ver sección 1.

### 3.2 `Error [ERR_REQUIRE_ESM]: require() of ES Module ... vite/dist/node/index.js`

Causa: Firebase CLI (o alguna herramienta) intenta `require()` un paquete ESM (Vite 7 es ESM). Resultado: Firebase falla al detectar frameworks.

Soluciones:

* Evitar la autodetección de frameworks en Firebase: `firebase init hosting --no-frameworks`.
* O crear manualmente `firebase.json` y `.firebaserc` (ver sección 5).

### 3.3 Mensaje de Qt/`xcb` en servidor

Aparece como efecto secundario cuando un proceso falla; no es la causa del fallo del build. El verdadero problema es ESM/Node.

---

## 4. Construir la app (build)

```bash
# desde la raíz del proyecto
npm run build

# salida típica: carpeta `dist/` (o `build/` según tu config)
```

Si falla por la razón ESM, confirma `node -v` y vuelve a la sección 1.

---

## 5. Opciones de despliegue del frontend (solo frontend)

> A continuación están las opciones para desplegar la carpeta generada (`dist/`).

### Opción A — Firebase Hosting

1. Usar configuración manual:

```bash
# opción: init sin frameworks
firebase init hosting
```

2. Alternativa: crear manualmente `firebase.json` y `.firebaserc` en la raíz del proyecto.

`firebase.json` sugerido:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "cleanUrls": true,
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
    ]
  }
}
```

`.firebaserc`:

```json
{
  "projects": { "default": "joyastack" }
}
```

3. Deploy:

```bash
npm run build
firebase deploy --only hosting
```

**Importante:** Firebase Hosting usa HTTPS por defecto. Si el backend está en HTTP puro, las peticiones desde la app servida por Firebase (HTTPS) hacia ese backend HTTP causarán *mixed-content* y serán bloqueadas por el navegador. Esto es solo una consideración; la configuración del backend no está incluida en este README.

### Opción B — Servir la app por HTTP

Útil para demostraciones internas donde no quieres HTTPS y necesitas servir desde la misma red local.

**Usando `serve` (rápido):**

```bash
# instalar globalmente si no lo tienes
npm install -g serve

# desde la carpeta raíz del proyecto (tras build)
npm run build
serve -s dist -p 8080

# la app queda disponible en:
# http://<IP_del_servidor>:8080
```

---

## 6. Comandos y scripts útiles

```bash
# limpiar e instalar dependencias
rm -rf node_modules package-lock.json
npm install

# verificar vite
npm list vite

# build
npm run build

# servir rápido por HTTP
npm install -g serve
serve -s dist -p 8080

# firebase init (sin detección de frameworks)
firebase init hosting --no-frameworks

# deploy a Firebase (si eliges esta opción)
firebase deploy --only hosting
```

---

## 7. Registro de problemas que encontramos en este flujo

* **Vite 7 es ESM** → Firebase CLI intentó `require()` y falló con `ERR_REQUIRE_ESM`. Fix: `firebase init hosting --no-frameworks` o crear `firebase.json` manualmente.
* **Build fallando por `import`** → Node viejo en servidor (solución: instalar Node 20).
* **Firebase Hosting usa HTTPS** → si el API queda en HTTP, ocurrirá bloqueo por mixed-content.

---
