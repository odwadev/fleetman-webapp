import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { BehaviorSubject } from 'rxjs';
import { VehicleService } from '../vehicle.service';

import { MapComponent } from './map.component';

describe('MapComponent', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MapComponent ],
      imports: [LeafletModule.forRoot()],
      providers: [{
        provide: VehicleService,
        useValue: {
          subscription: new BehaviorSubject(null),
          centerVehicle: new BehaviorSubject(null),
          centerVehicleHistory: new BehaviorSubject(null)
        }
      }]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
    // Keep Leaflet initialization local without requesting external map tiles.
    component.options.layers = [];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
