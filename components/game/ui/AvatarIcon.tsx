import React from 'react';
import { Gem, Crown, Briefcase, Ship, Plane, Building2, Watch, ShieldCheck, User } from 'lucide-react';

export const AvatarIcon = ({ name, size, className }: { name: string, size?: number, className?: string }) => {
    switch (name) {
        case 'Crown': return <Crown size={size} className={className} />;
        case 'Gem': return <Gem size={size} className={className} />;
        case 'Briefcase': return <Briefcase size={size} className={className} />;
        case 'Ship': return <Ship size={size} className={className} />;
        case 'Plane': return <Plane size={size} className={className} />;
        case 'Building2': return <Building2 size={size} className={className} />;
        case 'Watch': return <Watch size={size} className={className} />;
        case 'ShieldCheck': return <ShieldCheck size={size} className={className} />;
        default: return <User size={size} className={className} />;
    }
};
