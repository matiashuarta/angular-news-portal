import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ForumService } from '../forum.service';
import { CategoryBarComponent } from '../../category-bar/category-bar.component';

@Component({
  standalone: true,
  selector: 'app-forum-category',
  templateUrl: './forum-category.component.html',
  styleUrls: ['./forum-category.component.scss'],
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule, CategoryBarComponent],
})
export class ForumCategoryComponent implements OnInit {
  slug = '';
  category: any = null;
  topics: any[] = [];
  total = 0;
  page = 1;
  perPage = 20;
  sort = 'latest';
  loading = true;
  isLoggedIn = false;
  isAdmin = false;
  currentCategory = localStorage.getItem('selectedCategory') ?? 'All';

  showNewTopic = false;
  newTitle = '';
  newBody = '';
  newTopicError = '';
  submitting = false;

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
      } catch {}
    }
    this.route.params.subscribe(params => {
      this.slug = params['slug'];
      this.page = 1;
      this.load();
    });
  }

  load() {
    this.loading = true;
    this.forumService.getCategories().subscribe({
      next: (d: any) => {
        this.category = d.categories.find((c: any) => c.slug === this.slug) || null;
      }
    });
    this.forumService.getTopics(this.slug, this.page).subscribe({
      next: (d: any) => {
        let topics = d.topics || [];
        if (this.sort === 'popular') topics = [...topics].sort((a, b) => b.post_count - a.post_count);
        this.topics = topics;
        this.total = d.total;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applySort(s: string) { this.sort = s; this.load(); }

  get totalPages() { return Math.max(1, Math.ceil(this.total / this.perPage)); }

  prevPage() { if (this.page > 1) { this.page--; this.load(); } }
  nextPage() { if (this.page < this.totalPages) { this.page++; this.load(); } }

  openNewTopic() {
    if (!this.isLoggedIn) { this.router.navigate(['/login']); return; }
    this.showNewTopic = true;
  }

  closeNewTopic() { this.showNewTopic = false; this.newTopicError = ''; }

  submitTopic() {
    this.newTopicError = '';
    if (!this.newTitle.trim()) { this.newTopicError = 'Title is required.'; return; }
    if (!this.newBody.trim())  { this.newTopicError = 'Post body is required.'; return; }
    this.submitting = true;
    this.forumService.createTopic(this.slug, this.newTitle, this.newBody).subscribe({
      next: (d: any) => {
        this.submitting = false;
        this.closeNewTopic();
        this.router.navigate(['/forum/topic', d.topic.id]);
      },
      error: (e: any) => {
        this.submitting = false;
        this.newTopicError = e.error?.error || 'Could not create topic.';
      }
    });
  }

  deleteTopic(topicId: number) {
    if (!confirm('Delete this topic?')) return;
    this.forumService.deleteTopic(topicId).subscribe({ next: () => this.load() });
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
