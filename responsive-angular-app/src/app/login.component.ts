import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [FormsModule, RouterModule],
})
export class LoginComponent {
  username: string = '';
  password: string = '';

  private get apiBase() {
    return `${window.location.protocol}//${window.location.hostname}:3000/api`;
  }

  constructor(private http: HttpClient, private router: Router) {}

  login() {
    this.http.post(`${this.apiBase}/login`, {
      username: this.username,
      password: this.password,
    }).subscribe({
      next: (response: any) => {
        localStorage.setItem('token', response.token);
        alert('Login successful!');
        this.router.navigate(['/']).then(() => window.location.reload());
      },
      error: (err) => alert('Login failed: ' + (err.error?.message ?? err.message)),
    });
  }
}
