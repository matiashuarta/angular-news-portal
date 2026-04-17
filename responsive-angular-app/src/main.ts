import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';
import { LoggingInterceptor } from './app/logging.interceptor'; // Ensure this path is correct

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([LoggingInterceptor])), // Use the updated interceptor
    provideAnimations(),
    FormsModule, // Add this to resolve ngModel issues
  ],
}).catch((err) => console.error(err));
