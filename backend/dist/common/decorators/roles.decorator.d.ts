export declare enum UserRole {
    SUPERADMIN = "superadmin",
    ADMIN = "admin",
    MANAGER = "manager",
    CASHIER = "cashier"
}
export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: UserRole[]) => import("@nestjs/common").CustomDecorator<string>;
