import os

# Project folder structure
folders = [
    "src",
    "src/app",
    "src/app/components",
    "src/app/services",
    "src/assets",
]

# File contents
files_content = {
    "angular.json": """{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "projects": {
    "my-app": {
      "projectType": "application",
      "schematics": {},
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {},
        "serve": {},
        "test": {}
      }
    }
  }
}""",
    "src/main.ts": """import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));""",
    "src/index.html": """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>MyApp</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <app-root></app-root>
</body>
</html>""",
    "src/styles.css": """body {
  margin: 0;
  font-family: Roboto, sans-serif;
}""",
    "src/app/app.module.ts": """import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatButtonModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}""",
    "src/app/app.component.html": """<mat-sidenav-container class="sidenav-container">
  <mat-sidenav #drawer mode="side" class="sidenav" fixedInViewport>
    <mat-nav-list>
      <mat-list-item routerLink="/">Home</mat-list-item>
      <mat-list-item routerLink="/about">About</mat-list-item>
      <mat-list-item routerLink="/contact">Contact</mat-list-item>
    </mat-nav-list>
  </mat-sidenav>

  <mat-sidenav-content>
    <mat-toolbar color="primary">
      <button mat-icon-button (click)="drawer.toggle()">
        <mat-icon>menu</mat-icon>
      </button>
      <span>My Application</span>
    </mat-toolbar>
    <div class="content">
      <router-outlet></router-outlet>
    </div>
  </mat-sidenav-content>
</mat-sidenav-container>""",
    "src/app/app.component.css": """.sidenav-container {
  height: 100vh;
}

.sidenav {
  width: 250px;
  background: #f4f4f4;
}

mat-toolbar {
  position: sticky;
  top: 0;
  z-index: 1000;
}

.content {
  padding: 20px;
}""",
    "src/app/app.component.ts": """import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'my-app';
}""",
}

# Create folders
for folder in folders:
    os.makedirs(folder, exist_ok=True)

# Create files with content
for filepath, content in files_content.items():
    with open(filepath, 'w') as file:
        file.write(content)

print("Angular project structure created successfully!")
