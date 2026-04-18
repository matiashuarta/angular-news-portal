import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private _selected = new BehaviorSubject<string>(
    localStorage.getItem('selectedCategory') ?? 'All'
  );

  readonly selected$ = this._selected.asObservable();

  select(cat: string) {
    localStorage.setItem('selectedCategory', cat);
    this._selected.next(cat);
  }
}
