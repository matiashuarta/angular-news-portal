import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  imports: [FormsModule],
})
export class RegisterComponent {
  username: string = '';
  password: string = '';
  confirmPassword: string = '';

  private get apiBase() {
    return `${window.location.protocol}//${window.location.hostname}:3000/api`;
  }

  constructor(private http: HttpClient, private router: Router) {}

  register() {
    if (this.password !== this.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    this.http.post(`${this.apiBase}/register`, {
      username: this.username,
      password: this.password,
    }).subscribe({
      next: () => {
        this.http.post(`${this.apiBase}/login`, {
          username: this.username,
          password: this.password,
        }).subscribe({
          next: (response: any) => {
            localStorage.setItem('token', response.token);
            alert('Registration successful!');
            this.router.navigate(['/']).then(() => window.location.reload());
          },
          error: () => alert('Login failed after registration'),
        });
      },
      error: (err) => alert('Registration failed: ' + (err.error?.message ?? err.message)),
    });
  }
}
