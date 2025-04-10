A continuación te explico de forma detallada cómo publicar tu aplicación Flutter para web siguiendo las instrucciones contenidas en el archivo "Publicació web.md": citeturn0file0

---

## 1. Agregar la plataforma Web

Antes de compilar tu aplicación para la web, debes asegurarte de que tu proyecto Flutter incluya el soporte para esta plataforma. Para ello, abre tu terminal en la raíz del proyecto y ejecuta:

```bash
flutter create . --platforms web
```

Este comando configura tu proyecto para que se pueda compilar para web, generando la estructura y archivos necesarios.

---

## 2. Compilar el Proyecto para Web

Una vez añadida la plataforma web, debes compilar tu aplicación. Se recomienda utilizar WebAssembly (wasm) para optimizar el rendimiento y definir el "base href" si tu aplicación se desplegará en un subdirectorio distinto de la raíz del servidor. Ejecuta:

```bash
flutter build web --wasm --base-href "/web/"
```

> **Nota:**  
> - El parámetro `--base-href "/web/"` indica que la aplicación se servirá desde la URL `http://tu-dominio/web`, si se va a alojar en una carpeta distinta a la raíz.  
> - Si deseas cambiar la carpeta base, asegúrate de modificar también el tag `<base>` en el archivo `index.html` que se genera dentro de la carpeta `build/web`.

---

## 3. Publicar la Aplicación en el Servidor NodeJS

### En Entorno Local

Si estás probando localmente, simplemente copia la carpeta generada (`build/web`) al directorio público de tu servidor NodeJS. Por ejemplo:

```bash
cp -r ./build/web ../server/public/web
```

De esta forma, el servidor podrá servir la aplicación desde la ruta `http://localhost:3000/web`.

### En un Servidor Remoto (Proxmox)

Si tu despliegue se realiza en un entorno como Proxmox, puedes seguir estos pasos:

1. **Comprimir la Carpeta Web:**

   ```bash
   zip -r web.zip ./build/web
   ```

2. **Transferir el Archivo Comprimido al Servidor:**

   Utiliza `scp` junto con tu llave SSH y especifica el puerto correspondiente:

   ```bash
   scp -i folder/id_rsa -P 20127 ./web.zip usuari@ieticloudpro.ieti.cat:/home/super/
   ```

3. **Descomprimir y Reubicar la Carpeta:**

   Conéctate al servidor y descomprime el archivo:

   ```bash
   unzip web.zip
   mv build/web web
   ```

4. **Verificar la Ubicación Correcta:**

   Es importante que la estructura final quede de modo que el archivo `index.html` se encuentre en `../server/public/web/index.html`. Esto garantizará que la aplicación se sirva correctamente desde la ruta `http://localhost:3000/web` o `https://usuari.ieti.site/web`.

---

## 4. Acceder a la Aplicación

Una vez completados los pasos anteriores, podrás acceder a la aplicación Flutter en web a través de las siguientes direcciones:

- **Local:**  
  `http://localhost:3000/web`

- **Producción:**  
  `https://usuari.ieti.site/web`

---

## 5. Actualizar NodeJS en el Servidor Proxmox

Si necesitas actualizar NodeJS en el servidor, sigue estos pasos:

1. Instala `npm` si aún no lo tienes:

   ```bash
   sudo apt install npm
   ```

2. Instala la herramienta `n`, que te permitirá gestionar las versiones de NodeJS:

   ```bash
   sudo npm install -g n
   ```

3. Actualiza a la última versión de NodeJS:

   ```bash
   sudo n latest
   ```

Esto garantiza que tu servidor cuente con la versión más reciente de NodeJS y pueda ejecutar de forma óptima la aplicación web publicada.

---

## Resumen

1. **Agregar la plataforma web** con `flutter create . --platforms web`.  
2. **Compilar la aplicación** con `flutter build web --wasm --base-href "/web/"`.  
3. **Desplegar en el servidor:**
   - Localmente, copiar la carpeta `build/web` a `../server/public/web`.
   - En Proxmox, comprimir, transferir y reubicar la carpeta correctamente.
4. **Acceder** a la aplicación mediante la URL adecuada.  
5. **Actualizar NodeJS** en el servidor usando `npm`, `n` y el comando `sudo n latest`.

Siguiendo estos pasos, podrás publicar y servir correctamente tu aplicación Flutter en web. ¡Buena suerte con tu despliegue!