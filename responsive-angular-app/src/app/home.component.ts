import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { CategoryService } from './category.service';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NewsService } from './news-details/news.service';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { SlickCarouselModule } from 'ngx-slick-carousel';
import { CategoryBarComponent } from './category-bar/category-bar.component';

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
    CategoryBarComponent,
  ],
})
export class HomeComponent implements OnInit, OnDestroy {
  private catSub!: Subscription;
  topNews: any[] = [];
  otherNews: any[] = [];
  verticalNews: any[] = [];
  displayedVerticalNews: any[] = [];
  isAdmin: boolean = false;
  userName: string = '';
  private readonly maxTiles = 3;
  mobileOtherLimit = 6;

  allNewsRaw: any[] = [];
  categories = ['All', 'Multi', 'PC', 'Xbox', 'Playstation', 'Nintendo', 'Mobile', 'Esports'];
  selectedCategory = localStorage.getItem('selectedCategory') ?? 'All';

  @ViewChild('carousel') carouselRef!: ElementRef<HTMLElement>;

  constructor(
    private newsService: NewsService,
    private router: Router,
    private categoryService: CategoryService
  ) {}

  scrollCarousel(dir: number) {
    this.carouselRef?.nativeElement.scrollBy({ left: dir * 300, behavior: 'smooth' });
  }

  ngOnInit() {
    this.checkAdminStatus();
    this.newsService.getAllNews().subscribe((news) => {
      this.allNewsRaw = news;
      this.applyFilters();
    });
    this.catSub = this.categoryService.selected$.subscribe(cat => {
      this.selectedCategory = cat;
      this.applyFilters();
    });
  }

  ngOnDestroy() {
    this.catSub?.unsubscribe();
  }

  selectCategory(cat: string) {
    this.categoryService.select(cat);
  }

  private applyFilters() {
    const news = this.selectedCategory === 'All'
      ? this.allNewsRaw
      : this.allNewsRaw.filter((n: any) => n.category === this.selectedCategory);

    this.topNews = news.filter((n: any) => n.isTopNews);
    this.verticalNews = news.filter((n: any) => n.newsType === 'Vertical News');
    this.otherNews = news.filter((n: any) => n.newsType === 'Other News');
    this.displayedVerticalNews = this.verticalNews.slice(0, this.maxTiles);
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

  get mobileOtherNews() { return this.otherNews.slice(0, this.mobileOtherLimit); }

  loadMoreMobileOther() { this.mobileOtherLimit += 6; }

  loadMoreNews() {
    const nextIndex = this.displayedVerticalNews.length + this.maxTiles;
    this.displayedVerticalNews = this.verticalNews.slice(0, nextIndex);
  }

  logout() {
    localStorage.removeItem('token');
    this.isAdmin = false;
    window.location.reload();
  }
}
