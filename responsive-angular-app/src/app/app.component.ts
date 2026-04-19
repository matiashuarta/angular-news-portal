import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from './news-details/auth.service';
import { AvatarService } from './avatar.service';
import { CategoryService } from './category.service';

@Component({
  standalone: true,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
  ],
})
export class AppComponent implements OnInit {
  overlayMenuOpen = false;
  private scrollY = 0;
  loggedInUser: string | null = null;
  isAdmin = false;
  isLoggedIn = false;
  drawerCategory: string = localStorage.getItem('selectedCategory') ?? 'All';

  constructor(
    private router: Router,
    private authService: AuthService,
    public avatarService: AvatarService,
    private categoryService: CategoryService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.checkLoginStatus();
  }

  get currentAvatar() {
    return this.avatarService.find(this.avatarService.get());
  }

  checkLoginStatus() {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const expired = payload.exp && (Date.now() / 1000) > payload.exp;
          if (expired) {
            localStorage.removeItem('token');
            this.isLoggedIn = false;
            this.loggedInUser = null;
            this.isAdmin = false;
            this.authService.setAdminStatus(false);
            return;
          }
          this.isLoggedIn = true;
          this.loggedInUser = payload.username || 'User';
          this.isAdmin = payload.isAdmin || false;
          this.authService.setAdminStatus(this.isAdmin);
        } catch {
          this.isLoggedIn = false;
          this.loggedInUser = null;
          this.isAdmin = false;
          this.authService.setAdminStatus(false);
        }
      } else {
        this.isLoggedIn = false;
        this.loggedInUser = null;
        this.isAdmin = false;
        this.authService.setAdminStatus(false);
      }
    }
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
    }
    this.avatarService.clear();
    this.isLoggedIn = false;
    this.loggedInUser = null;
    this.isAdmin = false;
    this.authService.setAdminStatus(false);
    this.router.navigate(['/']);
  }

  toggleOverlayMenu() {
    this.overlayMenuOpen = !this.overlayMenuOpen;
    if (this.overlayMenuOpen) {
      this.scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${this.scrollY}px`;
      document.body.style.width = '100%';
    } else {
      this.unlockScroll();
    }
  }

  private unlockScroll() {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, this.scrollY);
  }

  closeOverlayMenu(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.drawer')) {
      this.overlayMenuOpen = false;
      this.unlockScroll();
    }
  }

  goHome() {
    this.drawerCategory = 'All';
    this.categoryService.select('All');
  }

  navigateTo(route: string, category?: string) {
    this.overlayMenuOpen = false;
    this.unlockScroll();
    if (category !== undefined) {
      this.drawerCategory = category;
      this.categoryService.select(category);
    }
    this.router.navigate([route]);
  }
}
