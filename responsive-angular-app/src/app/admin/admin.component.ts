// admin.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NewsService } from '../news-details/news.service';

@Component({
  standalone: true,
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  imports: [CommonModule, FormsModule],
})
export class AdminComponent implements OnInit {
  title: string = '';
  subtitle: string = '';
  image: string = '';
  fullText: string = '';
  relatedIds: string = '';
  isTopNews: boolean = false;
  isEditMode: boolean = false;
  newsId: string = '';
  newsTypes: string[] = ['Top News', 'Other News', 'Vertical News'];
  newsType: string = 'Other News';

  // <-- Cambios: nueva propiedad
  categories: string[] = ['Multi', 'PC', 'Xbox', 'Playstation', 'Nintendo'];
  category: string = 'Multi';
  // <-- Fin Cambios

  constructor(
    private newsService: NewsService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const state = history.state;
    if (state && state.news) {
      const news = state.news;
      this.newsId = news.id;
      this.title = news.title || '';
      this.subtitle = news.subtitle || '';
      this.image = news.image || '';
      this.fullText = news.fullText || '';
      this.relatedIds = (news.relatedIds || []).join(', ');
      this.isTopNews = !!news.isTopNews;
      this.newsType = news.newsType || 'Other News';
      // <-- Cambios: si la noticia viene con category, asignarla
      this.category = news.category || 'Multi';
      // <-- Fin Cambios
      this.isEditMode = true;
    }
  }

  saveNews() {
    // <-- Cambios: añadir 'category: this.category'
    const payload = {
      title: this.title,
      subtitle: this.subtitle,
      image: this.image,
      fullText: this.fullText,
      relatedIds: this.relatedIds
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id),
      isTopNews: this.isTopNews,
      newsType: this.newsType,
      category: this.category // <-- Cambios
    };
    // <-- Fin Cambios

    if (this.isEditMode) {
      this.newsService.updateNews(this.newsId, payload).subscribe(
        () => {
          alert('News updated successfully');
          this.router.navigate(['/']);
        },
        (error) => {
          console.error('Error updating news:', error);
          alert('Error updating news: ' + (error.error.message || 'Unknown error'));
        }
      );
    } else {
      this.newsService.createNews(payload).subscribe(
        () => {
          alert('News created successfully');
          this.router.navigate(['/']);
        },
        (error) => {
          console.error('Error creating news:', error);
          alert('Error creating news: ' + (error.error.message || 'Unknown error'));
        }
      );
    }
  }
}
