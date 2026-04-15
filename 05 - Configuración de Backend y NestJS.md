Aquí tienes la configuración completa del archivo .env, estructurada para ser utilizada tanto por **Docker Compose** como por el **ConfigService** de NestJS.

Este archivo es la pieza que une el backend con la infraestructura que definimos anteriormente.

### ---

**📄 Archivo .env (Raíz del Proyecto)**

Copia este contenido en un archivo llamado .env en la carpeta principal de tu backend.

Fragmento de código

\# \==========================================  
\# CONFIGURACIÓN DE LA APLICACIÓN  
\# \==========================================  
NODE\_ENV=development  
APP\_PORT=3000  
APP\_NAME="KioskosDespenzas\_API"  
APP\_URL=http://localhost:3000

\# \==========================================  
\# BASE DE DATOS (DOCKER/LOCAL)  
\# \==========================================  
\# Si usas Docker, el host debe ser el nombre del servicio en docker-compose (db)  
DB\_TYPE=mysql  
DB\_HOST=db  
DB\_PORT=3306  
DB\_USERNAME=dev\_user  
DB\_PASSWORD=dev\_password  
DB\_DATABASE=KioskosDespenzas\_db

\# Sincronización de TypeORM (¡Cuidado\! Desactivar en producción)  
DB\_SYNCHRONIZE=true  
DB\_LOGGING=true

\# \==========================================  
\# SEGURIDAD Y AUTENTICACIÓN  
\# \==========================================  
JWT\_SECRET=clavesecreta\_2026\_para\_desarrollo\_local  
JWT\_EXPIRES\_IN=8h

\# \==========================================  
\# CONFIGURACIÓN DE CORREO (SMTP)  
\# \==========================================  
\# Para alertas de stock y reportes  
MAIL\_HOST=smtp.mailtrap.io  
MAIL\_PORT=2525  
MAIL\_USER=tu\_usuario  
MAIL\_PASS=tu\_password  
MAIL\_FROM="noreply@KioskosDespenzas.com"

\# \==========================================  
\# INTEGRACIONES (OPCIONAL)  
\# \==========================================  
\# Para almacenamiento de logos de clientes en AWS S3  
S3\_ACCESS\_KEY=tus\_credenciales  
S3\_SECRET\_KEY=tus\_credenciales  
S3\_BUCKET=KioskosDespenzas-assets

### ---

**🛠️ Cómo integrar esto en NestJS**

Para que NestJS pueda leer estas variables de forma segura y tipada, te recomiendo seguir estos pasos en tu código:

1. **Instalar dependencias:**  
   Bash  
   npm install @nestjs/config

2. **Configurar el módulo en app.module.ts:**  
   TypeScript  
   import { ConfigModule } from '@nestjs/config';

   @Module({  
     imports: \[  
       ConfigModule.forRoot({  
         isGlobal: true, // Hace que las variables estén disponibles en toda la app  
       }),  
       // ... otros módulos  
     \],  
   })  
   export class AppModule {}

3. **Inyectar en el proveedor de base de datos:**  
   TypeScript  
   // database.provider.ts (ejemplo simplificado)  
   TypeOrmModule.forRootAsync({  
     inject: \[ConfigService\],  
     useFactory: (config: ConfigService) \=\> ({  
       type: config.get\<'mysql' | 'postgres'\>('DB\_TYPE'),  
       host: config.get\<string\>('DB\_HOST'),  
       port: config.get\<number\>('DB\_PORT'),  
       username: config.get\<string\>('DB\_USERNAME'),  
       password: config.get\<string\>('DB\_PASSWORD'),  
       database: config.get\<string\>('DB\_DATABASE'),  
       autoLoadEntities: true,  
       synchronize: config.get\<boolean\>('DB\_SYNCHRONIZE'),  
     }),  
   })

### ---

**⚠️ Notas importantes para tu desarrollo**

* **CORS:** Dado que en el pasado has tenido problemas con las políticas de CORS, asegúrate de que el backend use el valor de APP\_URL o el origen de tu frontend (ej. http://localhost:5173) para habilitar los permisos en el main.ts.  
* **Docker vs Local:** Si intentas ejecutar el backend fuera de Docker pero con la DB dentro de Docker, el DB\_HOST debe cambiar de db a localhost.  
* **Seguridad:** Nunca subas este archivo .env a tu repositorio de GitHub. Agrégalo inmediatamente a tu .gitignore.

¿Te gustaría que implementemos ahora el **Middleware de extracción de Tenant**? Es el encargado de leer el tenant\_id del token JWT y asegurarse de que cada consulta a la base de datos esté filtrada automáticamente por ese ID.