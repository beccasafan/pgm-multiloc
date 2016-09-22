import {Util, Location} from './app.ts';
import {Map} from './map.ts';

import * as ko from 'knockout';

export interface IHiveOptions {
  map: Map;
  center: Location;
  steps: number;
  index: number;
}
export class Hive {
  private options: IHiveOptions;
  private mapObject: google.maps.Polygon;
  public isActive: KnockoutObservable<boolean>;
  private activeListener: google.maps.MapsEventListener;

  get steps(): number {
    return this.options.steps;
  }

  constructor(options: IHiveOptions) {
    this.options = options;
    this.isActive = ko.observable(false);

    let center = this.options.center.getLatLng();
    let radius = Util.getHiveRadius(this.options.steps);

    let computeOffset = google.maps.geometry.spherical.computeOffset;

    let hexPoints: google.maps.LatLng[] = [
      computeOffset(center, radius, 30),
      computeOffset(center, radius, 90),
      computeOffset(center, radius, 150),
      computeOffset(center, radius, 210),
      computeOffset(center, radius, 270),
      computeOffset(center, radius, 330)
    ];

    let hex = new google.maps.Polygon({
      paths: hexPoints,
      fillOpacity: 0.3,
      strokeWeight: 1,
      zIndex: 2,
    });

    this.mapObject = hex;
    this.toggleActive();
    this.options.map.addMapObject(hex);
  }

  public reset(): void {
    this.mapObject = this.options.map.removeMapObject(this.mapObject) as google.maps.Polygon;
  }

  public toggleActive(): void {
    this.isActive(!this.isActive());
    this.mapObject.set('fillColor', this.isActive() ? '#0F0' : '#F00');
  }

  public addListener(): void {
    this.activeListener = google.maps.event.addListener(this.mapObject, 'click', () => this.toggleActive());
  }

  public removeListener(): void {
    this.activeListener.remove();
  }

  public getCenter(): Location {
    return this.options.center;
  }
}
