import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ForumService } from '../forum.service';
import { CategoryBarComponent } from '../../category-bar/category-bar.component';

@Component({
  standalone: true,
  selector: 'app-forum-topic',
  templateUrl: './forum-topic.component.html',
  styleUrls: ['./forum-topic.component.scss'],
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule, CategoryBarComponent],
})
export class ForumTopicComponent implements OnInit {
  topicId = 0;
  topic: any = null;
  posts: any[] = [];
  replyText = '';
  loading = true;
  posting = false;
  postError = '';
  isLoggedIn = false;
  isAdmin = false;
  currentUserId: number | null = null;
  currentCategory = localStorage.getItem('selectedCategory') ?? 'All';
  likedPosts = new Set<number>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private forumService: ForumService
  ) {}

  ngOnInit() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const p = JSON.parse(atob(token.split('.')[1]));
        this.isLoggedIn = true;
        this.isAdmin = !!p.isAdmin;
        this.currentUserId = p.id ?? null;
      } catch {}
    }
    this.route.params.subscribe(params => {
      this.topicId = parseInt(params['id']);
      this.load();
    });
  }

  load() {
    this.loading = true;
    this.forumService.getTopic(this.topicId).subscribe({
      next: (d: any) => {
        this.topic = d.topic;
        this.posts = d.posts;
        this.loading = false;
        window.scrollTo(0, 0);
      },
      error: () => { this.loading = false; this.router.navigate(['/forum']); }
    });
  }

  postReply() {
    this.postError = '';
    if (!this.replyText.trim()) return;
    if (!this.isLoggedIn) { this.router.navigate(['/login']); return; }
    this.posting = true;
    this.forumService.createPost(this.topicId, this.replyText).subscribe({
      next: () => {
        this.replyText = '';
        this.posting = false;
        this.load();
      },
      error: (e: any) => {
        this.posting = false;
        this.postError = e.error?.error || 'Could not post reply.';
      }
    });
  }

  toggleLike(post: any) {
    if (!this.isLoggedIn) { this.router.navigate(['/login']); return; }
    this.forumService.toggleLike(post.id).subscribe({
      next: (d: any) => {
        post.like_count += d.liked ? 1 : -1;
        if (d.liked) this.likedPosts.add(post.id);
        else this.likedPosts.delete(post.id);
      }
    });
  }

  deletePost(post: any) {
    if (!confirm('Delete this post?')) return;
    this.forumService.deletePost(post.id).subscribe({ next: () => this.load() });
  }

  canDelete(post: any): boolean {
    return this.isAdmin || post.user_id === this.currentUserId;
  }

  rankLabel(count: number): string {
    if (count >= 200) return 'Legend';
    if (count >= 50)  return 'Veteran';
    if (count >= 10)  return 'Regular';
    if (count >= 1)   return 'Recruit';
    return 'Lurker';
  }

  rankClass(count: number): string {
    return 'rank-' + this.rankLabel(count).toLowerCase();
  }

  goToCategory(cat: string) {
    localStorage.setItem('selectedCategory', cat);
    this.currentCategory = cat;
    this.router.navigate(['/']);
  }

  timeAgo(dateStr: string): string {
    const d = new Date(dateStr);
    const secs = (Date.now() - d.getTime()) / 1000;
    if (secs < 60) return 'just now';
    if (secs < 3600) return Math.floor(secs / 60) + 'm ago';
    if (secs < 86400) return Math.floor(secs / 3600) + 'h ago';
    return Math.floor(secs / 86400) + 'd ago';
  }
}
