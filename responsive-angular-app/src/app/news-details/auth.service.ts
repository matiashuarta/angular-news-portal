// auth.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAdminSource = new BehaviorSubject<boolean>(false);
  currentIsAdmin = this.isAdminSource.asObservable();

  constructor() { }

  setAdminStatus(isAdmin: boolean) {
    this.isAdminSource.next(isAdmin);
  }

  getAdminStatus(): Observable<boolean> {
    return this.currentIsAdmin;
  }
}
