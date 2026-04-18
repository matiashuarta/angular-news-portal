// app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { LoginComponent } from './login.component';
import { RegisterComponent } from './register.component';
import { AdminComponent } from './admin/admin.component';
import { NewsDetailsComponent } from './news-details/news-details.component';
import { EditNewsComponent } from './news-details/edit-news.component';
import { ProfileComponent } from './profile/profile.component';
import { ForumComponent } from './forum/forum.component';
import { ForumCategoryComponent } from './forum/forum-category/forum-category.component';
import { ForumTopicComponent } from './forum/forum-topic/forum-topic.component';

export const appRoutes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'admin', component: AdminComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'forum', component: ForumComponent },
  { path: 'forum/category/:slug', component: ForumCategoryComponent },
  { path: 'forum/topic/:id', component: ForumTopicComponent },
  { path: 'news/edit/:id', component: EditNewsComponent },
  { path: 'news/:id', component: NewsDetailsComponent }
];
