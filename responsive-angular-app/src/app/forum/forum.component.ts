import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ForumService } from './forum.service';
import { CategoryBarComponent } from '../category-bar/category-bar.component';

@Component({
  standalone: true,
  selector: 'app-forum',
  templateUrl: './forum.component.html',
  styleUrls: ['./forum.component.scss'],
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule, CategoryBarComponent],
})
export class ForumComponent implements OnInit {
  categories: any[] = [];
  recentTopics: any[] = [];
  hotTopics: any[] = [];
  stats = { members: 0, topics: 0, posts: 0 };
  myRank = { rank: 'Lurker', post_count: 0 };
  isLoggedIn = false;
  isAdmin = false;
  currentCategory = localStorage.getItem('selectedCategory') ?? 'All';

  showNewTopic = false;
  newTitle = '';
  newBody = '';
  newCat = '';
  newTopicError = '';
  submitting = false;

  constructor(private forumService: ForumService, private router: Router) {}

  ngOnInit() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const p = JSON.parse(atob(token.split('.')[1]));
        this.isLoggedIn = true;
        this.isAdmin = !!p.isAdmin;
      } catch {}
    }

    this.forumService.getCategories().subscribe({ next: (d: any) => this.categories = d.categories });
    this.forumService.getStats().subscribe({ next: (d: any) => this.stats = d });
    this.forumService.getHotTopics().subscribe({ next: (d: any) => this.hotTopics = d.topics });
    this.forumService.getTopics(undefined, 1).subscribe({ next: (d: any) => this.recentTopics = d.topics });
    if (this.isLoggedIn) {
      this.forumService.getMyRank().subscribe({ next: (d: any) => this.myRank = d });
    }
  }

  topicsForCategory(catId: number) {
    return this.recentTopics.filter(t => t.category_id === catId).slice(0, 3);
  }

  openNewTopic() {
    if (!this.isLoggedIn) { this.router.navigate(['/login']); return; }
    if (this.categories.length) this.newCat = this.categories[0].slug;
    this.showNewTopic = true;
  }

  closeNewTopic() { this.showNewTopic = false; this.newTopicError = ''; }

  submitTopic() {
    this.newTopicError = '';
    if (!this.newTitle.trim()) { this.newTopicError = 'Title is required.'; return; }
    if (!this.newBody.trim())  { this.newTopicError = 'Post body is required.'; return; }
    this.submitting = true;
    this.forumService.createTopic(this.newCat, this.newTitle, this.newBody).subscribe({
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

  rankClass(rank: string) {
    return 'rank-' + rank.toLowerCase();
  }

  goToCategory(cat: string) {
    localStorage.setItem('selectedCategory', cat);
    this.currentCategory = cat;
    this.router.navigate(['/']);
  }
}
