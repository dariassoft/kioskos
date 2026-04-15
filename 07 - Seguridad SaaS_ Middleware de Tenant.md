Este es uno de los componentes más importantes para la seguridad y la integridad de tu SaaS. El **Tenant Middleware** se encarga de interceptar cada petición, leer el tenant\_id del token JWT y asegurarse de que esté disponible para que tus servicios y repositorios filtren los datos automáticamente.

### ---

**1\. El Middleware de Extracción (tenant.middleware.ts)**

Este middleware se ejecuta antes de que la petición llegue a tus controladores. Extrae la información del usuario (ya decodificada por el AuthGuard de JWT) y la inyecta en el objeto Request.

TypeScript

import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';  
import { Request, Response, NextFunction } from 'express';

@Injectable()  
export class TenantMiddleware implements NestMiddleware {  
  use(req: Request, res: Response, next: NextFunction) {  
    // El objeto 'user' es inyectado previamente por el AuthGuard de Passport/JWT  
    const user \= req.user as any;

    if (\!user || \!user.tenant\_id) {  
      throw new UnauthorizedException('No se pudo identificar el Tenant (Negocio)');  
    }

    // Adjuntamos el tenant\_id a la request para usarlo en controladores o servicios  
    req\['tenantId'\] \= user.tenant\_id;  
      
    next();  
  }  
}

### ---

**2\. Decorador Personalizado (get-tenant.decorator.ts)**

Para que tu código sea limpio y profesional, crearemos un decorador. Esto te permitirá obtener el ID del negocio directamente en los argumentos de tus funciones en el controlador.

TypeScript

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetTenantId \= createParamDecorator(  
  (data: unknown, ctx: ExecutionContext): string \=\> {  
    const request \= ctx.switchToHttp().getRequest();  
    return request.tenantId; // Extrae lo que inyectamos en el middleware  
  },  
);

### ---

**3\. Ejemplo de Uso en un Controlador**

Así es como se vería tu código al crear un producto, por ejemplo. Observa cómo el tenantId se obtiene automáticamente, evitando que un usuario pueda "mentir" enviando un ID de otro negocio en el cuerpo de la petición.

TypeScript

@Controller('products')  
@UseGuards(JwtAuthGuard) // Primero autenticamos  
export class ProductsController {  
    
  @Post()  
  async create(  
    @Body() createProductDto: any,  
    @GetTenantId() tenantId: string // \<--- Uso del decorador  
  ) {  
    // El servicio siempre recibe el tenantId validado por el sistema  
    return this.productsService.create(createProductDto, tenantId);  
  }  
}

### ---

**4\. Registro Global en app.module.ts**

Debes aplicar este middleware a todas las rutas que no sean públicas (como login o registro).

TypeScript

export class AppModule implements NestModule {  
  configure(consumer: MiddlewareConsumer) {  
    consumer  
      .apply(TenantMiddleware)  
      .exclude('auth/(.\*)') // Excluimos las rutas de login/registro  
      .forRoutes('\*');      // Aplicamos a todo lo demás  
  }  
}

### ---

**💡 ¿Por qué es vital este enfoque?**

Al centralizar la obtención del tenant\_id en el middleware:

* **Seguridad:** Un usuario malintencionado no puede manipular el ID del negocio para ver datos ajenos.  
* **Limpieza:** No tienes que extraer el ID manualmente en cada función.  
* **Portabilidad:** Si mañana decides cambiar a una estrategia de "Base de Datos por Cliente" (en lugar de una sola tabla compartida), solo tendrías que modificar este middleware para que cambie la conexión a la DB dinámicamente.

Este flujo garantiza que tu sistema sea robusto y cumpla con los estándares de seguridad para aplicaciones SaaS multi-cliente.

¿Te gustaría que pasemos ahora a configurar el **Servicio de Inventario** para manejar las alertas automáticas de stock bajo?