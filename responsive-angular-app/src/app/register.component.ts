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

  constructor(private http: HttpClient, private router: Router) {}

  register() {
    if (this.password !== this.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
  
    this.http
      .post('http://192.168.1.5:3000/api/register', {
        username: this.username,
        password: this.password,
      })
      .subscribe(
        () => {
          this.http
            .post('http://192.168.1.5:3000/api/login', {
              username: this.username,
              password: this.password,
            })
            .subscribe(
              (response: any) => {
                localStorage.setItem('token', response.token);
                console.log('Token stored:', localStorage.getItem('token'));
                alert('Registration successful, logged in!');
                this.router.navigate(['/']).then(() => {
                  window.location.reload(); // Force a full page reload to update the login state
                });
              },
              (error) => {
                alert('Login failed after registration');
              }
            );
        },
        (error) => {
          alert('Registration failed: ' + error.error.message);
        }
      );
  }
}