import { UserRole } from '../../common/decorators/roles.decorator';
export declare class RegisterDto {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    branch_id?: string;
}
