import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NewsService } from './news-details/news.service';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { SlickCarouselModule } from 'ngx-slick-carousel';

@Component({
  standalone: true,
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    SlickCarouselModule,
    CommonModule,
    RouterModule,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule,
    MatButtonModule,
  ],
})
export class HomeComponent implements OnInit {
  topNews: any[] = [];
  otherNews: any[] = [];
  verticalNews: any[] = [];
  displayedVerticalNews: any[] = [];
  isAdmin: boolean = false;
  userName: string = '';
  private readonly maxTiles = 3; // Limit vertical news to 3 tiles

  constructor(private newsService: NewsService, private router: Router) {}

  ngOnInit() {
    this.checkAdminStatus();
    this.newsService.getAllNews().subscribe((news) => {
      // Filtrar Top News
      this.topNews = news.filter((n: any) => n.isTopNews);
  
      // Filtrar Vertical News y Other News según el newsType
      this.verticalNews = news.filter((n: any) => n.newsType === 'Vertical News');
      this.otherNews = news.filter((n: any) => n.newsType === 'Other News');
  
      // Limitar el número de vertical news a mostrar inicialmente
      this.displayedVerticalNews = this.verticalNews.slice(0, this.maxTiles);
    });
  }

  sliderConfig = {
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    dots: true,
    arrows: true,
    infinite: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  checkAdminStatus() {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.isAdmin = payload.isAdmin === true;
      this.userName = payload.username || '';
    } else {
      this.isAdmin = false;
    }
  }

  editNews(news: any) {
    this.router.navigate(['/admin/edit', news.id], { state: { news } });
  }

  deleteNews(id: number) {
    if (confirm('Are you sure you want to delete this news?')) {
      this.newsService.deleteNews(id.toString()).subscribe(() => {
        alert('News deleted');
        this.ngOnInit(); // Refresh news list
      });
    }
  }

  loadMoreNews() {
    const nextIndex = this.displayedVerticalNews.length + this.maxTiles;
    this.displayedVerticalNews = this.verticalNews.slice(0, nextIndex); // Show 3 more each time
  }

  logout() {
    localStorage.removeItem('token');
    this.isAdmin = false;
    window.location.reload();
  }
}
