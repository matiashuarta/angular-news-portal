import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from './news-details/auth.service'; // Ensure the path is correct

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
  loggedInUser: string | null = null;
  isAdmin: boolean = false;
  isLoggedIn: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object // Inject PLATFORM_ID here
  ) {}

  ngOnInit() {
    this.checkLoginStatus();
  }

  /**
   * Checks the user's login status by verifying the JWT token.
   * This function runs only in the browser environment.
   */
  checkLoginStatus() {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          this.isLoggedIn = true;
          this.loggedInUser = payload.username || 'User';
          this.isAdmin = payload.isAdmin || false;
          this.authService.setAdminStatus(this.isAdmin); // Update AuthService
        } catch (error) {
          console.error('Error parsing token payload:', error);
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

  /**
   * Logs out the user by removing the JWT token and resetting state.
   */
  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
    }
    this.isLoggedIn = false;
    this.loggedInUser = null;
    this.isAdmin = false;
    this.authService.setAdminStatus(false); // Update AuthService
    this.router.navigate(['/']);
  }

  /**
   * Toggles the visibility of the overlay menu.
   */
  toggleOverlayMenu() {
    this.overlayMenuOpen = !this.overlayMenuOpen;
  }

  /**
   * Closes the overlay menu when clicking outside the menu content.
   * @param event - The click event
   */
  closeOverlayMenu(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.menu-content')) {
      this.overlayMenuOpen = false;
    }
  }

  /**
   * Navigates to the specified route and closes the overlay menu.
   * @param route - The route to navigate to
   */
  navigateTo(route: string) {
    this.overlayMenuOpen = false;
    this.router.navigate([route]);
  }
}
