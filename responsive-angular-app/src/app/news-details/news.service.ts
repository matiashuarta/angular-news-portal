import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NewsService {
  private baseUrl: string;

  constructor(private http: HttpClient) {
    this.baseUrl = `${window.location.protocol}//${window.location.hostname}:3000/api/news`;
  }

  getNewsById(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  getAllNews(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  postComment(newsId: string, commentText: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    return this.http.post<any>(
      `${this.baseUrl}/${newsId}/comments`,
      { text: commentText },
      { headers }
    );
  }

  getCommentsByNewsId(newsId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${newsId}/comments`);
  }

  postReply(newsId: string, parentCommentId: number, replyText: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    return this.http.post<any>(
      `${this.baseUrl}/${newsId}/comments`,
      { text: replyText, parentCommentId },
      { headers }
    );
  }

  editComment(commentId: number, editText: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    const apiBase = `${window.location.protocol}//${window.location.hostname}:3000/api`;
    return this.http.put<any>(
      `${apiBase}/comments/${commentId}`,
      { text: editText },
      { headers }
    );
  }

  deleteComment(commentId: number): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const apiBase = `${window.location.protocol}//${window.location.hostname}:3000/api`;
    return this.http.delete<any>(`${apiBase}/comments/${commentId}`, { headers });
  }

  voteNews(id: string, voteType: 'like' | 'dislike' | 'none'): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    return this.http.post<any>(
      `${this.baseUrl}/${id}/vote`,
      { voteType },
      { headers }
    );
  }

  // <-- New method to vote on a comment -->
  voteComment(
    commentId: number,
    voteType: 'like' | 'dislike'
  ): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    const apiBase = `${window.location.protocol}//${window.location.hostname}:3000/api`;
    return this.http.post<any>(
      `${apiBase}/comments/${commentId}/vote`,
      { voteType },
      { headers }
    );
  }
  // <-- End of new method -->

  createNews(payload: any): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    return this.http.post<any>(this.baseUrl, payload, { headers });
  }

  deleteNews(id: string): Observable<void> {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { headers });
  }

  updateNews(id: string, payload: any): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    return this.http.put<any>(`${this.baseUrl}/${id}`, payload, { headers });
  }
}
