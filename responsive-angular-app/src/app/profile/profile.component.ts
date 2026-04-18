import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { AvatarService, AVATARS, Avatar } from '../avatar.service';

@Component({
  standalone: true,
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  imports: [CommonModule, FormsModule, MatIconModule],
})
export class ProfileComponent implements OnInit {
  avatars: Avatar[] = AVATARS;
  selectedAvatar: string = 'gamepad';
  username: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  saving = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  private get apiBase() {
    return `${window.location.protocol}//${window.location.hostname}:3000/api`;
  }

  constructor(
    private http: HttpClient,
    public router: Router,
    private avatarService: AvatarService
  ) {}

  ngOnInit() {
    const token = localStorage.getItem('token');
    if (!token) { this.router.navigate(['/login']); return; }

    this.selectedAvatar = this.avatarService.get();

    const headers = { Authorization: `Bearer ${token}` };
    this.http.get<any>(`${this.apiBase}/profile`, { headers }).subscribe({
      next: (profile) => {
        this.username = profile.username;
        if (profile.avatar) {
          this.selectedAvatar = profile.avatar;
          this.avatarService.set(profile.avatar);
        }
      },
      error: () => this.showMessage('Could not load profile', 'error'),
    });
  }

  selectAvatar(id: string) {
    this.selectedAvatar = id;
  }

  getAvatar(id: string): Avatar {
    return this.avatarService.find(id);
  }

  save() {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (this.newPassword && this.newPassword !== this.confirmPassword) {
      this.showMessage('Passwords do not match', 'error');
      return;
    }

    this.saving = true;
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const body: any = { avatar: this.selectedAvatar };
    if (this.newPassword) body.password = this.newPassword;

    this.http.put(`${this.apiBase}/profile`, body, { headers }).subscribe({
      next: () => {
        this.avatarService.set(this.selectedAvatar);
        this.newPassword = '';
        this.confirmPassword = '';
        this.saving = false;
        this.showMessage('Profile saved!', 'success');
      },
      error: (err) => {
        this.saving = false;
        const msg = err?.error?.error ?? err?.message ?? 'Failed to save profile';
        this.showMessage(msg, 'error');
      },
    });
  }

  private showMessage(msg: string, type: 'success' | 'error') {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => this.message = '', type === 'error' ? 6000 : 3000);
  }
}
