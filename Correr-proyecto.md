SE INSTALÓ NVM PARA WINDOWS
ESTE PROYECTO ESTA EN ANGULAR 17 Y ESTA USANDO LA VERSION DE NODE 20.12.2
Y COMO BASE DE DATOS ESTA USANDO JSON-SERVER archivo "db.json"

PARA CORRER JSON-SERVER:

- Haber instalado json-server version 0.17.4 de forma global: npm install -g json-server@0.17.4
- para correrlo: json-server --watch db.json --port 3000 --cors
- checkeamos data empleados: http://localhost:3000/employees

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
