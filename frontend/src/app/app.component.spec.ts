import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  it('renders the real application route outlet', async () => {
    await TestBed.configureTestingModule({imports: [AppComponent], providers: [provideRouter([])]}).compileComponents();
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.title).toBe('Travel Expense Manager');
    expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
  });
});
