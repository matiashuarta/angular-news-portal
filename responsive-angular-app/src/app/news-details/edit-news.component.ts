// edit-news.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NewsService } from './news.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-edit-news',
  templateUrl: './edit-news.component.html',
  styleUrls: ['./edit-news.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class EditNewsComponent implements OnInit {
  newsItem: any = {
    title: '',
    subtitle: '',
    fullText: '',
    image: '',
    isTopNews: false,
    relatedIds: [],
    newsType: 'Other News',
    // <-- Cambios: propiedad category
    category: 'Multi'
  };
  newsId: string = '';
  newsTypes: string[] = ['Top News', 'Other News', 'Vertical News'];
  // <-- Cambios: array de categorías
  categories: string[] = ['Multi', 'PC', 'Xbox', 'Playstation', 'Nintendo']; 
  isAdmin: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private newsService: NewsService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const idFromRoute = this.route.snapshot.paramMap.get('id');
    if (idFromRoute) {
      this.newsId = idFromRoute;
    } else {
      console.error('News ID is not provided');
      this.router.navigate(['/']);
      return;
    }

    this.authService.getAdminStatus().subscribe(status => {
      this.isAdmin = status;
    });

    this.route.data.subscribe(data => {
      if (data['news']) {
        this.newsItem = data['news'];
      } else {
        this.newsService.getNewsById(this.newsId).subscribe(
          (data: any) => {
            this.newsItem = data.news;
            // <-- Cambios: si data.news.category existe, guardarlo
            if (!this.newsItem.category) {
              this.newsItem.category = 'Multi';
            }
            // <-- Fin Cambios
          },
          (err: any) => {
            console.error('Error fetching news:', err);
            this.router.navigate(['/']);
          }
        );
      }
    });
  }

  saveChanges() {
    console.log('Attempting to save changes with:', this.newsItem);
    this.newsService.updateNews(this.newsId, this.newsItem).subscribe(
      () => {
        console.log('News updated successfully');
        alert('News updated successfully');
        this.router.navigate(['/news', this.newsId], { queryParams: { isAdmin: this.isAdmin } });
      },
      (err: any) => {
        console.error('Error updating news:', err);
        alert('Failed to update news: ' + err.message);
      }
    );
  }

  cancelEdit() {
    console.log('Canceling edit for news ID:', this.newsId);
    this.router.navigate(['/news', this.newsId], { queryParams: { isAdmin: this.isAdmin } });
  }
}
