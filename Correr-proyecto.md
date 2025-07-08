ESTE PROYECTO ESTA EN ANGULAR 17 Y ESTA USANDO LA VERSION DE NODE 20.12.2

NOTA: para paquetes usar "npx i" nombre-libreria, no usar npm i

CADA VEZ QUE ABRA EL PROYECTO HAY QUE INDICAR A NVM (NODE VERSION MANAGEMENT)
LA VERSION DE NODE.JS DE ESTE PROYECTO:

1. Abrir la consola de windows CMD (como Administrador) y tipiar nvm use 20.12.2
2. Abrir mi el proyecto de Angular y volver a indicar la version de node:
   nvm use 20.12.2

3. Arrancar proyecto cualquiera de los dos comandos:
   npm run start
   npx ng serve

CASO DE ERROR:

1. Abrir la consola de windows CMD (como Administrador) y tipiar nvm uninstall 20.12.2
2. nvm install 20.12.2
3. nvm use 20.12.2
4. node -v para corroborar la version, deberia devolver 20.12.2
5. where node (Indica la ruta donde esta apuntando la instalación de nvm-windows "NVM para Windows")
   deberia mostrar esta ruta: C:\nvm4w\nodejs\node.exe
6. nvm ls (Para listar las distintas versiones de node que tiene nvm)
   Tiene que aparecer con un "\*" la version que se esta ejecutando.
    - 20.12.2 (Currently using 64-bit executable)

7. Abrir proyecto de Angular 17 volver a correr nvm use 20.12.2
8. Arrancar el proyecto con cualquiera delos dos comandos:
   npm run start
   npx ng serve

---

PARA EJECUTAR ES-LINT: npm run lint
