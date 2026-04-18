import { Component, OnInit } from '@angular/core';
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
  title = '';
  subtitle = '';
  image = '';
  fullText = '';
  isTopNews = false;
  isEditMode = false;
  newsId = '';
  newsTypes = ['Top News', 'Other News', 'Vertical News'];
  newsType = 'Other News';
  categories = ['Multi', 'PC', 'Xbox', 'Playstation', 'Nintendo', 'Mobile', 'Esports'];
  category = 'Multi';

  allNews: any[] = [];
  loadingList = false;
  selectedRelatedIds: Set<number> = new Set();

  // List controls
  searchTerm = '';
  filterCategory = 'All';
  sortMode: 'date-desc' | 'date-asc' | 'alpha-asc' | 'alpha-desc' = 'date-desc';
  displayedCount = 10;

  readonly PAGE_SIZE = 10;

  constructor(private newsService: NewsService) {}

  ngOnInit() {
    const state = history.state;
    if (state?.news) this.loadIntoForm(state.news);
    this.loadArticleList();
  }

  private loadArticleList() {
    this.loadingList = true;
    this.newsService.getAllNews().subscribe({
      next: (news) => { this.allNews = news; this.loadingList = false; },
      error: () => { this.loadingList = false; }
    });
  }

  private loadIntoForm(news: any) {
    this.newsId = String(news.id);
    this.title = news.title || '';
    this.subtitle = news.subtitle || '';
    this.image = news.image || '';
    this.fullText = news.fullText || '';

    let ids: number[] = [];
    try {
      ids = typeof news.relatedIds === 'string'
        ? JSON.parse(news.relatedIds || '[]')
        : (news.relatedIds || []);
    } catch { ids = []; }
    this.selectedRelatedIds = new Set(ids.map(Number));

    this.isTopNews = !!news.isTopNews;
    this.newsType = news.newsType || 'Other News';
    this.category = news.category || 'Multi';
    this.isEditMode = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get filteredNews(): any[] {
    let list = [...this.allNews];

    if (this.filterCategory !== 'All') {
      list = list.filter(n => n.category === this.filterCategory);
    }

    if (this.searchTerm.trim()) {
      const q = this.searchTerm.trim().toLowerCase();
      list = list.filter(n =>
        (n.title || '').toLowerCase().includes(q) ||
        (n.subtitle || '').toLowerCase().includes(q)
      );
    }

    switch (this.sortMode) {
      case 'date-desc': list.sort((a, b) => (b.id ?? 0) - (a.id ?? 0)); break;
      case 'date-asc':  list.sort((a, b) => (a.id ?? 0) - (b.id ?? 0)); break;
      case 'alpha-asc': list.sort((a, b) => (a.title || '').localeCompare(b.title || '')); break;
      case 'alpha-desc':list.sort((a, b) => (b.title || '').localeCompare(a.title || '')); break;
    }

    return list;
  }

  get visibleNews(): any[] {
    return this.filteredNews.slice(0, this.displayedCount);
  }

  get hasMore(): boolean {
    return this.displayedCount < this.filteredNews.length;
  }

  loadMore() { this.displayedCount += this.PAGE_SIZE; }

  onFilterChange() { this.displayedCount = this.PAGE_SIZE; }

  editArticle(news: any) { this.loadIntoForm(news); }

  isRelated(id: number): boolean { return this.selectedRelatedIds.has(id); }

  toggleRelated(id: number) {
    if (this.selectedRelatedIds.has(id)) this.selectedRelatedIds.delete(id);
    else this.selectedRelatedIds.add(id);
  }

  cancelEdit() {
    this.isEditMode = false;
    this.newsId = '';
    this.title = '';
    this.subtitle = '';
    this.image = '';
    this.fullText = '';
    this.selectedRelatedIds = new Set();
    this.isTopNews = false;
    this.newsType = 'Other News';
    this.category = 'Multi';
  }

  deleteArticle(id: any) {
    if (!confirm('Delete this article permanently?')) return;
    this.newsService.deleteNews(String(id)).subscribe({
      next: () => { this.allNews = this.allNews.filter(n => n.id != id); },
      error: () => alert('Failed to delete article.')
    });
  }

  saveNews() {
    const payload = {
      title: this.title,
      subtitle: this.subtitle,
      image: this.image,
      fullText: this.fullText,
      relatedIds: Array.from(this.selectedRelatedIds),
      isTopNews: this.isTopNews,
      newsType: this.newsType,
      category: this.category,
    };

    if (this.isEditMode) {
      this.newsService.updateNews(this.newsId, payload).subscribe({
        next: () => { alert('News updated successfully'); this.cancelEdit(); this.loadArticleList(); },
        error: (err) => alert('Error: ' + (err.error?.message || 'Unknown error'))
      });
    } else {
      this.newsService.createNews(payload).subscribe({
        next: () => { alert('News created successfully'); this.cancelEdit(); this.loadArticleList(); },
        error: (err) => alert('Error: ' + (err.error?.message || 'Unknown error'))
      });
    }
  }
}
