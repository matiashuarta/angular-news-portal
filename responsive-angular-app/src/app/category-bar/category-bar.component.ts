import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface CatDef { id: string; icon: string; label: string; }

export const CATEGORIES: CatDef[] = [
  { id: 'All',        icon: 'apps',             label: 'All'        },
  { id: 'Multi',      icon: 'public',           label: 'Multi'      },
  { id: 'PC',         icon: 'desktop_windows',  label: 'PC'         },
  { id: 'Xbox',       icon: 'sports_esports',   label: 'Xbox'       },
  { id: 'Playstation',icon: 'videogame_asset',  label: 'Playstation'},
  { id: 'Nintendo',   icon: 'gamepad',          label: 'Nintendo'   },
  { id: 'Mobile',     icon: 'smartphone',       label: 'Mobile'     },
  { id: 'Esports',    icon: 'emoji_events',     label: 'Esports'    },
];

@Component({
  standalone: true,
  selector: 'app-category-bar',
  templateUrl: './category-bar.component.html',
  styleUrls: ['./category-bar.component.scss'],
  imports: [CommonModule, MatIconModule],
})
export class CategoryBarComponent {
  @Input() selected: string = localStorage.getItem('selectedCategory') ?? 'All';
  @Output() categorySelect = new EventEmitter<string>();

  categories = CATEGORIES;

  select(id: string) {
    this.selected = id;
    this.categorySelect.emit(id);
  }
}
