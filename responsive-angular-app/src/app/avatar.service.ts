import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Avatar {
  id: string;
  icon: string;
  bg: string;
  border: string;
  label: string;
}

export const AVATARS: Avatar[] = [
  { id: 'gamepad',  icon: 'sports_esports',       bg: '#1a0800', border: '#ff9800', label: 'Gamer'     },
  { id: 'fire',     icon: 'local_fire_department', bg: '#1a0005', border: '#ff3333', label: 'Blaze'     },
  { id: 'star',     icon: 'star',                  bg: '#08001a', border: '#7c5cff', label: 'Star'      },
  { id: 'bolt',     icon: 'bolt',                  bg: '#181a00', border: '#e8e800', label: 'Bolt'      },
  { id: 'shield',   icon: 'shield',                bg: '#001a08', border: '#00cc66', label: 'Guardian'  },
  { id: 'rocket',   icon: 'rocket_launch',         bg: '#0e001a', border: '#cc44ff', label: 'Rocket'    },
  { id: 'trophy',   icon: 'emoji_events',          bg: '#1a1200', border: '#ffd700', label: 'Champion'  },
  { id: 'robot',    icon: 'smart_toy',             bg: '#001616', border: '#00d4d4', label: 'Bot'       },
  { id: 'skull',    icon: 'whatshot',              bg: '#0d0d00', border: '#ff6600', label: 'Ghost'     },
  { id: 'planet',   icon: 'public',                bg: '#001018', border: '#4499ff', label: 'Explorer'  },
  { id: 'sword',    icon: 'security',              bg: '#1a0010', border: '#ff44aa', label: 'Knight'    },
  { id: 'dragon',   icon: 'auto_awesome',          bg: '#0a1800', border: '#88ff44', label: 'Dragon'    },
];

@Injectable({ providedIn: 'root' })
export class AvatarService {
  private current = new BehaviorSubject<string>(
    localStorage.getItem('userAvatar') ?? 'gamepad'
  );

  avatar$ = this.current.asObservable();

  get(): string { return this.current.value; }

  set(id: string) {
    localStorage.setItem('userAvatar', id);
    this.current.next(id);
  }

  find(id: string): Avatar {
    return AVATARS.find(a => a.id === id) ?? AVATARS[0];
  }

  clear() {
    localStorage.removeItem('userAvatar');
    this.current.next('gamepad');
  }
}
