import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ForumService {
  private base: string;

  constructor(private http: HttpClient) {
    this.base = `${window.location.protocol}//${window.location.hostname}:3000/api/forum`;
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });
  }

  getCategories(): Observable<any>  { return this.http.get(`${this.base}/categories`); }
  getStats(): Observable<any>        { return this.http.get(`${this.base}/stats`); }
  getHotTopics(): Observable<any>    { return this.http.get(`${this.base}/topics/hot`); }
  getMyRank(): Observable<any>       { return this.http.get(`${this.base}/me/rank`, { headers: this.authHeaders() }); }

  getTopics(category?: string, page = 1): Observable<any> {
    const params: any = { page };
    if (category) params['category'] = category;
    return this.http.get(`${this.base}/topics`, { params });
  }

  getTopic(id: number): Observable<any> { return this.http.get(`${this.base}/topics/${id}`); }

  createTopic(category: string, title: string, body: string): Observable<any> {
    return this.http.post(`${this.base}/topics`, { category, title, body }, { headers: this.authHeaders() });
  }

  createPost(topicId: number, body: string): Observable<any> {
    return this.http.post(`${this.base}/topics/${topicId}/posts`, { body }, { headers: this.authHeaders() });
  }

  toggleLike(postId: number): Observable<any> {
    return this.http.post(`${this.base}/posts/${postId}/like`, {}, { headers: this.authHeaders() });
  }

  deletePost(postId: number): Observable<any> {
    return this.http.delete(`${this.base}/posts/${postId}`, { headers: this.authHeaders() });
  }

  deleteTopic(topicId: number): Observable<any> {
    return this.http.delete(`${this.base}/topics/${topicId}`, { headers: this.authHeaders() });
  }
}
