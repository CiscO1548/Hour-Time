import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { SocialAuthServiceConfig, GoogleLoginProvider, SOCIAL_AUTH_CONFIG } from '@abacritt/angularx-social-login';

const authConfig: SocialAuthServiceConfig = {
  autoLogin: false,
  providers: [
    {
      id: GoogleLoginProvider.PROVIDER_ID,
      provider: new GoogleLoginProvider(
        '830117223813-a3rjakv2g5j3404k2p9hfva9luu6glcr.apps.googleusercontent.com',
        {
          scopes: 'email profile https://www.googleapis.com/auth/gmail.readonly'
        }
      )
    }
  ],
  onError: (err) => {
    console.error('SocialAuthService Error:', err);
  }
};

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimationsAsync(),
    provideHttpClient(),
    {
      provide: 'SocialAuthServiceConfig',
      useValue: authConfig,
    },
    {
      provide: SOCIAL_AUTH_CONFIG,
      useValue: authConfig,
    }
  ],
}).catch((err) => console.error(err));
