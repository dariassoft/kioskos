export declare class Plan {
    id: string;
    name: string;
    description: string;
    price_monthly: number;
    max_branches: number;
    max_users: number;
    features: Record<string, boolean>;
    is_active: boolean;
    created_at: Date;
}
