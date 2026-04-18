import { Component, OnInit, SecurityContext } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NewsService } from './news.service';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CategoryBarComponent } from '../category-bar/category-bar.component';

@Component({
  standalone: true,
  selector: 'app-news-details',
  templateUrl: './news-details.component.html',
  styleUrls: ['./news-details.component.scss'],
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, FormsModule, CategoryBarComponent],
})
export class NewsDetailsComponent implements OnInit {
  newsId: string = '';
  newsItem: any;
  relatedNews: any[] = [];
  likeCount = 0;
  dislikeCount = 0;
  isAdmin = false;
  isLoggedIn = false;
  commentsVisible = false;
  newCommentText = '';
  comments: any[] = [];
  currentCategory: string = localStorage.getItem('selectedCategory') ?? 'All';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private newsService: NewsService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (!id) { this.router.navigate(['/']); return; }
      this.loadNews(id);
    });
    this.route.queryParams.subscribe(params => {
      this.isAdmin = params['isAdmin'] === 'true';
    });
    this.isLoggedIn = !!localStorage.getItem('token');
  }

  goToCategory(cat: string) {
    localStorage.setItem('selectedCategory', cat);
    this.currentCategory = cat;
    this.router.navigate(['/']);
  }

  private loadNews(id: string) {
    window.scrollTo(0, 0);
    this.newsService.getNewsById(id).subscribe({
      next: (data: any) => {
        this.newsId = id;
        this.newsItem = data.news;
        this.relatedNews = data.related || [];
        this.likeCount = this.newsItem.likes || 0;
        this.dislikeCount = this.newsItem.dislikes || 0;
      },
      error: () => this.router.navigate(['/'])
    });
  }

  get fullTextWithBreaks(): SafeHtml {
    if (!this.newsItem?.fullText) return '';
    const escaped = this.newsItem.fullText
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
    return this.sanitizer.sanitize(SecurityContext.HTML, escaped) ?? '';
  }

  likeNews() {
    if (!this.isLoggedIn) { alert('You must be logged in to like'); return; }
    this.newsService.voteNews(this.newsId, 'like').subscribe({
      next: () => this.reloadNewsCounts(),
      error: (err) => console.error('like error:', err)
    });
  }

  dislikeNews() {
    if (!this.isLoggedIn) { alert('You must be logged in to dislike'); return; }
    this.newsService.voteNews(this.newsId, 'dislike').subscribe({
      next: () => this.reloadNewsCounts(),
      error: (err) => console.error('dislike error:', err)
    });
  }

  removeVote() {
    if (!this.isLoggedIn) { alert('You must be logged in to remove vote'); return; }
    this.newsService.voteNews(this.newsId, 'none').subscribe({
      next: () => this.reloadNewsCounts(),
      error: (err) => console.error('remove vote error:', err)
    });
  }

  private reloadNewsCounts() {
    this.newsService.getNewsById(this.newsId).subscribe({
      next: (data: any) => {
        this.likeCount = data.news.likes || 0;
        this.dislikeCount = data.news.dislikes || 0;
      },
      error: (err) => console.error('reload counts error:', err)
    });
  }

  toggleComments() {
    this.commentsVisible = !this.commentsVisible;
    if (this.commentsVisible && this.isLoggedIn) this.loadComments();
  }

  loadComments() {
    this.newsService.getCommentsByNewsId(this.newsId).subscribe({
      next: (data: any) => {
        this.comments = data.map((c: any) => ({
          ...c, isEditing: false, replyBoxVisible: false
        }));
      },
      error: (err) => console.error('fetch comments error:', err)
    });
  }

  postComment() {
    if (!this.newCommentText.trim()) return;
    this.newsService.postComment(this.newsId, this.newCommentText).subscribe({
      next: () => { this.newCommentText = ''; this.loadComments(); },
      error: (err) => console.error('post comment error:', err)
    });
  }

  likeComment(id: number) {
    this.newsService.voteComment(id, 'like').subscribe({
      next: () => this.loadComments(),
      error: (err) => console.error('like comment error:', err)
    });
  }

  dislikeComment(id: number) {
    this.newsService.voteComment(id, 'dislike').subscribe({
      next: () => this.loadComments(),
      error: (err) => console.error('dislike comment error:', err)
    });
  }

  enableEditComment(comment: any) { comment.isEditing = true; comment.editText = comment.text; }
  cancelEditComment(comment: any) { comment.isEditing = false; comment.editText = ''; }

  saveEditedComment(comment: any) {
    this.newsService.editComment(comment.id, comment.editText).subscribe({
      next: () => { comment.text = comment.editText; comment.isEditing = false; },
      error: (err) => console.error('edit comment error:', err)
    });
  }

  deleteComment(id: number) {
    this.newsService.deleteComment(id).subscribe({
      next: () => this.loadComments(),
      error: (err) => console.error('delete comment error:', err)
    });
  }

  toggleReplyBox(id: number) {
    const c = this.comments.find(c => c.id === id);
    if (!c) return;
    c.replyBoxVisible = !c.replyBoxVisible;
    if (c.replyBoxVisible) c.newReplyText = '';
  }

  postReply(commentId: number, replyText: string) {
    if (!replyText.trim()) return;
    this.newsService.postReply(this.newsId, commentId, replyText).subscribe({
      next: () => this.loadComments(),
      error: (err) => console.error('post reply error:', err)
    });
  }

  editNews(item: any) {
    this.router.navigate(['/news/edit', item.id], { state: { news: item } });
  }

  deleteNews(id: any) {
    if (!confirm('Are you sure you want to delete this news?')) return;
    this.newsService.deleteNews(id).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err) => console.error('delete news error:', err)
    });
  }

  shareOnFacebook() {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
  }

  shareOnTwitter() {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${this.newsItem?.title}`, '_blank');
  }

  shareOnLinkedIn() {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank');
  }

  goToRelated(id: string) {
    this.router.navigate(['/news', id]);
  }
}
