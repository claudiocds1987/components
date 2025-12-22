SE INSTALÓ NVM PARA WINDOWS
NOTA: PARA QUE NVM FUNCIONE CORRECTAMENTE PREVIAMENTE A INSTALAR NVM DESINSTALAR
LA VERSION DE NODE.JS QUE TENEMOS INSTALADA, IR A ARCHIVOS DE PROGRAMAS BUSCAR
node.js y la desinstalamos.
ESTE PROYECTO ESTA EN ANGULAR 17 Y ESTA USANDO LA VERSION DE NODE 20.12.2
Y COMO BASE DE DATOS ESTA USANDO JSON-SERVER archivo "db.json"

PARA CORRER JSON-SERVER:

- Haber instalado json-server version 0.17.4 de forma global: npm install -g json-server@0.17.4
- para correrlo abrir una nueva terminal y tipiar: json-server --watch db.json --port 3000 --cors
- checkeamos data empleados: http://localhost:3000/employees
- la base de datos de json-server esta en el archivo db.json

NOTA: para paquetes usar "npx i" nombre-libreria, no usar npm i
para crear un servicio: npx ng g s employee-mock
para crear un componente: npx ng g c employee

CADA VEZ QUE ABRA EL PROYECTO HAY QUE INDICAR A NVM (NODE VERSION MANAGEMENT)
LA VERSION DE NODE.JS DE ESTE PROYECTO:

1. Abrir Visual Studio Code como Administrador (clic boton derecho sobre icono de Visuyal Studio Code opcion Ejecutar como administrador)

2. Desde la Terminal de Visual studio code tipiar nvm use 20.12.2

3. Arrancar proyecto cualquiera de los dos comandos:
   npm run start
   npx ng serve

4. Abrir una nueva terminal desde Visual Studio Code elegir cmd para crear
   componentes etc...

CASO DE ERROR:

1. Abrir la consola de windows CMD (como Administrador) y tipiar nvm uninstall 20.12.
2. nvm install 20.12.2
3. nvm use 20.12.2
4. node -v para corroborar la version, deberia devolver 20.12.2
5. where node (Indica la ruta donde esta apuntando la instalación de nvm-windows "NVM para Windows")
   deberia mostrar esta ruta: C:\nvm4w\nodejs\node.exe
6. nvm ls (Para listar las distintas versiones de node que tiene nvm)
   Tiene que aparecer con un asterisco "\*" la version que se esta ejecutando.
    - 20.12.2 (Currently using 64-bit executable)

7. Abrir proyecto de Angular 17 volver a correr nvm use 20.12.2
8. Arrancar el proyecto con cualquiera de los dos comandos:
   npm run start
   npx ng serve

---

PARA CREAR UN COMPONENTE (pararme en la carpeta donde quiero crear
el componente boton derecho Open in integrated Terminal):
Como estoy usando Angular CLI instalado localmente y no globalmente,
el comando "ng" no esta en el PATH global en mi sistema por eso hay
que hacer: npx ng g c nombre-del-componente

PARA EJECUTAR ES-LINT: npm run lint

---

BACKEND
(Los archivos del backend estan en Este Equipo -> disco C -> angular-25 -> json-server-data)

LA API HECHA EN JSON-SERVER SE ENCUENTRA EN EL REPOSITORIO GITHUB json-server-data
git remote add origin https://github.com/claudiocds1987/json-server-data.git
git branch -M main
git push -u origin main

opcion 2: HACER NORMALMENTE EL COMMIT Y PUSH SIN CLI.
(AL HACER EL PUSH "RENDER" DETECTA AUTOMATICAMENTE QUE HAY UN UPDATE POR EJEMPLO UN OBJETO JSON NUEVO Y CREA EL ENDPOINT PARA QUE
LO PUEDAS USAR EN TU PROYECTO) PARA VER EL ESTADO DEL DEPLOY ENTRAR A RENDER FIJARSE EN DONDE DICE json-server-data
Y VAS A VER QUE EL STATUS DEL DEPLOY ESTA DANDO VUELTAS, CUANDO TERMINA CON UN TILDE INDICA "DEPLOYED"

PARA VER EL NUEVO ENDPOINT CREADO POR RENDER

- HACER CLIC EN https://json-server-data-fpl9.onrender.com
  Y AHI VAN A APARECER TODOS LOS ENDPOINT QUE HABIAN MAS LOS NUEVOS
  hacer clic en el nuevo enpoint, se va a abrir una nueva ventana mostrando el json y en la url
  va a mostrar por ejemplo https://json-server-data-fpl9.onrender.com/profile
  esta url es la que hay que pegar en el front para obtener los datos.

Y ESTE REPOSITORIO ESTA LINKEADO AL SERVIDOR "RENDER" DONDE LEVANTA Y LEE LOS JSON DEL REPOSITORIO json-server-data

Tambien se esta usando https://uptimerobot.com/ que es un sitio que lo que hace es pegarle al endpoint de render para que el servidor render no se apague.

---

ESTE PROYECTO FRONTEND ESTA EN GITHUB PAGES (ACA ESTA ALOJADO TODO EL PROYECTO DE ANGULAR):

ESTOS PASOS SOLO SE HACEN UNA VEZ (YA SE HICIERON)
Nota: uso npx

1. npx ng add angular-cli-ghpages (se ejecuta solo una vez, si ya fue ejecutado no hay que volverlo a hacer)
2. Para cada actualización en github pages: npx ng deploy --base-href=/components/
3. ir a mi repositorio github a settings -> Pages:
   Dejar la configuracion como esta, deberia decir asi:
   BUILD AND DEPLOYMENT
   Source: Deploy from a branch
   Branch: gh-pages /(root)

4. ir al archivo app.config.ts y en providers agregar esta linea:  
   provideRouter(routes, withHashLocation()), // Para github pages
5. Para que se vean las imagenes de assets reemplazar la ruta quitar "/":
   Quitar "/" antes de assets: <img src="/assets/imagen.jpg" alt="Mi Imagen">
   Dejarlo asi: <img src="assets/imagen.jpg" alt="Mi Imagen">
   En .scss lo mismo: background-image: url("assets/background.png");

PARA ACTUALIZAR CAMBIOS EN GITHUB PAGES:

1. Hacer el commit y push normalmente desde visual studio (para subir los cambios al repositorio de git hub)
2. npx ng deploy --base-href=/components/ (actualiza en github pages)

Ver proyecto en github pages: https://claudiocds1987.github.io/components/
