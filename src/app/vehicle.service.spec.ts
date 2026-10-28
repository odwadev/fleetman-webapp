import { TestBed, inject } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { StompService } from '@stomp/ng2-stompjs';
import { NEVER } from 'rxjs';

import { VehicleService } from './vehicle.service';
import { Vehicle } from './vehicle';

describe('VehicleService', () => {
  let service: VehicleService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        VehicleService,
        { provide: StompService, useValue: { subscribe: jasmine.createSpy('subscribe').and.returnValue(NEVER) } }
      ]
    });
    service = TestBed.get(VehicleService);
    http = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('should be created', inject([VehicleService], (service: VehicleService) => {
    expect(service).toBeTruthy();
  }));

  it('should emit the history response for the selected vehicle', () => {
    const history = [{ lat: 51, longitude: -1 }];
    service.updateCenterVehicle(new Vehicle('A', 51, -1, '', 0));

    const request = http.expectOne(req => req.url.endsWith('/api/history/A'));
    expect(request.request.method).toBe('GET');
    request.flush(history);

    expect(service.centerVehicleHistory.getValue()).toEqual(history);
  });

  it('should clear the previous history and handle a 404 for the next vehicle', () => {
    const history = [{ lat: 51, longitude: -1 }];
    service.updateCenterVehicle(new Vehicle('A', 51, -1, '', 0));
    http.expectOne(req => req.url.endsWith('/api/history/A')).flush(history);
    expect(service.centerVehicleHistory.getValue()).toEqual(history);

    service.updateCenterVehicle(new Vehicle('B', 52, -2, '', 0));
    const request = http.expectOne(req => req.url.endsWith('/api/history/B'));
    expect(() => request.flush('Not found', { status: 404, statusText: 'Not Found' })).not.toThrow();

    expect(service.centerVehicleHistory.getValue()).toBeNull();
  });

  it('should clear history without an HTTP request when the selection is null', () => {
    service.centerVehicleHistory.next([{ lat: 51, longitude: -1 }]);

    service.updateCenterVehicle(null);

    expect(service.centerVehicleHistory.getValue()).toBeNull();
    http.expectNone(() => true);
  });
});
