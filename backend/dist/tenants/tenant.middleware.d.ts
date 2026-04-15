import { NestMiddleware } from '@nestjs/common';
import { Response, NextFunction } from 'express';
interface RequestWithTenant extends Request {
    tenantId: string | null;
    user?: any;
}
export declare class TenantMiddleware implements NestMiddleware {
    use(req: RequestWithTenant, res: Response, next: NextFunction): void;
}
export {};
