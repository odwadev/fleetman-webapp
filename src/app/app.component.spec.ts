import { TestBed, async } from '@angular/core/testing';
import { Component } from '@angular/core';
import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';

@Component({ selector: 'app-vehicles', template: '' })
class VehiclesStubComponent {}

@Component({ selector: 'app-map', template: '' })
class MapStubComponent {}

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        HeaderComponent,
        VehiclesStubComponent,
        MapStubComponent
      ],
    }).compileComponents();
  }));
  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));
  it(`should have as title 'Fleetman Live Tracking'`, async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('Fleetman Live Tracking');
  }));
  it('should render the Fleetman header in the navbar brand', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('app-header .navbar-brand').textContent).toContain('Fleet Management System R2');
  }));
});
