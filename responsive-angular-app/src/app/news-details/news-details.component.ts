// news-details.component.ts
import { Component, OnInit, SecurityContext } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NewsService } from './news.service';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-news-details',
  templateUrl: './news-details.component.html',
  styleUrls: ['./news-details.component.scss'],
  imports: [CommonModule, RouterModule, MatButtonModule, FormsModule],
})
export class NewsDetailsComponent implements OnInit {
  newsId: string = '';
  newsItem: any;
  relatedNews: any[] = [];
  likeCount = 0;
  dislikeCount = 0;
  isAdmin: boolean = false;
  isLoggedIn: boolean = false; // <-- CHANGES: Tracking login status
  commentsVisible: boolean = false;
  newCommentText: string = '';
  comments: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private newsService: NewsService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const newId = params['id'];
      if (!newId) {
        console.error('News ID is not provided');
        this.router.navigate(['/']);
        return;
      }
      this.loadNews(newId);
    });

    this.route.queryParams.subscribe((params) => {
      this.isAdmin = params['isAdmin'] === 'true';
    });

    // Check logged-in status (simplified)
    this.isLoggedIn = !!localStorage.getItem('token');
  }

  private loadNews(id: string) {
    window.scrollTo(0, 0);
    this.newsService.getNewsById(id).subscribe(
      (data: any) => {
        console.log('Data from Node: ', data);
        this.newsId = id;
        this.newsItem = data.news;
        this.relatedNews = data.related || [];
        this.likeCount = this.newsItem.likes || 0;
        this.dislikeCount = this.newsItem.dislikes || 0;
      },
      (err: any) => {
        console.error('Error fetching news:', err);
        this.router.navigate(['/']);
      }
    );
  }

  get fullTextWithBreaks(): SafeHtml {
    if (!this.newsItem?.fullText) return '';
    const escaped = this.newsItem.fullText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
    return this.sanitizer.sanitize(SecurityContext.HTML, escaped) ?? '';
  }

  likeNews() {
    if (!this.isLoggedIn) {
      alert('You must be logged in to like');
      return;
    }
    this.newsService.voteNews(this.newsId, 'like').subscribe(
      (res) => {
        console.log('like response:', res);
        this.reloadNewsCounts();
      },
      (err) => console.error('like error:', err)
    );
  }

  dislikeNews() {
    if (!this.isLoggedIn) {
      alert('You must be logged in to dislike');
      return;
    }
    this.newsService.voteNews(this.newsId, 'dislike').subscribe(
      (res) => {
        console.log('dislike response:', res);
        this.reloadNewsCounts();
      },
      (err) => console.error('dislike error:', err)
    );
  }

  removeVote() {
    if (!this.isLoggedIn) {
      alert('You must be logged in to remove vote');
      return;
    }
    this.newsService.voteNews(this.newsId, 'none').subscribe(
      (res) => {
        console.log('remove vote response:', res);
        this.reloadNewsCounts();
      },
      (err) => console.error('remove vote error:', err)
    );
  }

  private reloadNewsCounts() {
    this.newsService.getNewsById(this.newsId).subscribe(
      (data: any) => {
        this.likeCount = data.news.likes || 0;
        this.dislikeCount = data.news.dislikes || 0;
      },
      (err: any) => {
        console.error('Error reloading news counts:', err);
      }
    );
  }

  toggleComments() {
    this.commentsVisible = !this.commentsVisible;
    if (this.commentsVisible && this.isLoggedIn) {
      this.loadComments();
    }
  }

  loadComments() {
    this.newsService.getCommentsByNewsId(this.newsId).subscribe(
      (data: any) => {
        console.log('Fetched comments:', data);
        this.comments = data.map((comment: any) => ({
          ...comment,
          isEditing: false,
          replyBoxVisible: false,
        }));
        console.log('Comments array:', this.comments);
      },
      (err: any) => console.error('Error fetching comments:', err)
    );
  }

  postComment() {
    if (!this.newCommentText.trim()) return;
    this.newsService.postComment(this.newsId, this.newCommentText).subscribe(
      () => {
        this.newCommentText = '';
        this.loadComments();
      },
      (err) => console.error('Error posting comment:', err)
    );
  }

  likeComment(commentId: number) {
    this.newsService.voteComment(commentId, 'like').subscribe(
      () => this.loadComments(),
      (err) => console.error('Error liking comment:', err)
    );
  }

  dislikeComment(commentId: number) {
    this.newsService.voteComment(commentId, 'dislike').subscribe(
      () => this.loadComments(),
      (err) => console.error('Error disliking comment:', err)
    );
  }

  enableEditComment(comment: any) {
    comment.isEditing = true;
    comment.editText = comment.text;
  }

  cancelEditComment(comment: any) {
    comment.isEditing = false;
    comment.editText = '';
  }

  saveEditedComment(comment: any) {
    this.newsService.editComment(comment.id, comment.editText).subscribe(
      () => {
        comment.text = comment.editText;
        comment.isEditing = false;
      },
      (err: any) => console.error('Error editing comment:', err)
    );
  }

  deleteComment(commentId: number) {
    this.newsService.deleteComment(commentId).subscribe(
      () => {
        this.loadComments();
      },
      (err: any) => console.error('Error deleting comment:', err)
    );
  }

  toggleReplyBox(commentId: number) {
    const comment = this.comments.find((c) => c.id === commentId);
    if (!comment) return;
    comment.replyBoxVisible = !comment.replyBoxVisible;
    if (comment.replyBoxVisible) comment.newReplyText = '';
  }

  postReply(commentId: number, replyText: string) {
    if (!replyText.trim()) return;
    this.newsService.postReply(this.newsId, commentId, replyText).subscribe(
      () => {
        this.loadComments(); // Reload comments after posting reply
      },
      (err) => console.error('Error posting reply:', err)
    );
  }
  

  shareOnFacebook() {
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      '_blank'
    );
  }

  shareOnTwitter() {
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://twitter.com/intent/tweet?url=${url}&text=${this.newsItem?.title}`,
      '_blank'
    );
  }

  shareOnLinkedIn() {
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      '_blank'
    );
  }

  goToRelated(relatedId: string) {
    this.router.navigate(['/news', relatedId]);
  }

  editNews(item: any) {
    this.router.navigate(['/news/edit', item.id], { state: { news: item } });
  }

  deleteNews(id: any) {
    if (confirm('Are you sure you want to delete this news?')) {
      this.newsService.deleteNews(id).subscribe(
        () => this.router.navigate(['/']),
        (err) => console.error('Error deleting news:', err)
      );
    }
  }
}
