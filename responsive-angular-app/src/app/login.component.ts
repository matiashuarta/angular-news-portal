import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [FormsModule, HttpClientModule, RouterModule],
})
export class LoginComponent {
  username: string = '';
  password: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  login() {
    this.http.post('http://192.168.1.5:3000/api/login', {
      username: this.username,
      password: this.password,
    }).subscribe(
      (response: any) => {
        localStorage.setItem('token', response.token);
        alert('Login successful!');
        this.router.navigate(['/']).then(() => {
          window.location.reload(); // Reload to update login state
        });
      },
      (error) => {
        alert('Login failed: ' + error.error.message);
      }
    );
  }
}
