import {config} from '../config.ts';
import {Util, Location} from './app.ts';
import {Map} from './map.ts';
import {IHiveOptions, Hive} from './hive.ts';

import * as ko from 'knockout';
import * as _ from 'lodash';

export interface IBeehiveOptions {
  map: Map;
  center: Location;
  steps: number;
  leaps: number;
}
export class Beehive {
  private options: IBeehiveOptions;
  private lastHiveCenter: google.maps.LatLng;
  private hives: KnockoutObservableArray<Hive>;
  private mapObject: google.maps.Circle;
  private isActive: boolean;
  private isEditingHives: boolean;
  private coveringRadius: number;
  public activeHives: KnockoutComputed<Hive[]>;

  constructor (options: IBeehiveOptions) {
    this.options = options;
    this.hives = ko.observableArray([]);
    this.isEditingHives = false;
    this.coveringRadius = Util.getBeehiveRadius(this.options.leaps, this.options.steps);

    this.activeHives = ko.computed(() => this.getActiveHives(), this, { deferEvaluation: true });

    this.mapObject = new google.maps.Circle({
      radius: this.coveringRadius,
      fillColor: '#0000FF',
      fillOpacity: 0.0,
      strokeWeight: 1,
      clickable: true,
      center: this.options.center.getLatLng(),
      editable: true,
      draggable: true,
      zIndex: 3
    });

    this.options.map.addMapObject(this.mapObject);

    this.generateHives();
    this.toggleActive();

    this.options.map.addListener(this.mapObject, 'click', () => this.toggleActive());

    this.options.map.addListener(this.mapObject, 'radius_changed', () => {
      this.coveringRadius = this.mapObject.getRadius();

      let newLeaps = Util.getLeapsToCoverRadius(this.coveringRadius, this.options.steps);
      if (this.options.leaps !== newLeaps) {
        this.options.leaps = newLeaps;
        this.generateHives();
      }

    });

    this.options.map.addListener(this.mapObject, 'center_changed', () => {
      let center = this.mapObject.getCenter();
      this.options.center = new Location(center.lat(), center.lng());
      this.generateHives();
    });
  }

  public getHives(): Hive[] {
    console.log(`getting hives for ${this.options.center.toString()}`);
    return this.hives();
  }

  public reset(dispose: boolean = false): void {
    // cleanup old hives
    for (let i = 0; i < this.hives().length; i++) {
      this.hives()[i].reset();
    }

    this.hives([]);

    if (dispose) {
      this.mapObject = this.options.map.removeMapObject(this.mapObject) as google.maps.Circle;
    }
  }

  private generateHives(): Hive[] {
    this.reset();

    let locations: Hive[] = [];
    let distanceBetweenHiveCenters = Util.distanceBetweenHiveCenters(this.options.steps);

    let getNextPoint = (p, heading, distance = distanceBetweenHiveCenters, adjust = true) => {
      let nextPoint = google.maps.geometry.spherical.computeOffset(p, distance, heading);
      if (adjust) {
        nextPoint = google.maps.geometry.spherical.computeOffset(nextPoint, Util.locationAdjustment, heading + 90);
      }
      locations.push(new Hive(<IHiveOptions>{ center: new Location(nextPoint.lat(), nextPoint.lng()), steps: this.options.steps, map: this.options.map }));
      return nextPoint;
    };

    let point: google.maps.LatLng = this.options.center.getLatLng();
    point = getNextPoint(point, 0, 0, false);
    this.lastHiveCenter = point;

    for (let leap = 2; leap <= this.options.leaps; leap++) {
      point = getNextPoint(this.lastHiveCenter, 0, distanceBetweenHiveCenters);

      this.lastHiveCenter = point;

      for (let se = 1; se < leap; se++) {
        point = getNextPoint(point, 120);
      }

      for (let s = 1; s < leap; s++) {
        point = getNextPoint(point, 180);
      }

      for (let sw = 1; sw < leap; sw++) {
        point = getNextPoint(point, 240);
      }

      for (let nw = 1; nw < leap; nw++) {
        point = getNextPoint(point, 300);
      }

      for (let n = 1; n < leap; n++) {
        point = getNextPoint(point, 0);
      }

      for (let ne = 2; ne < leap; ne++) {
        point = getNextPoint(point, 60);
      }
    }

    this.hives(locations);
    return this.hives();
  }

  public resize(steps: number): void {
    this.options.steps = steps;
    this.options.leaps = Util.getLeapsToCoverRadius(this.coveringRadius, this.options.steps);
    this.generateHives();
  }

  public disableActive(): void {
    this.isActive = false;
    if (this.isEditingHives) {
      this.editHives();
    }
    this.mapObject.set('fillOpacity', 0);
  }

  public toggleActive(fromMap: boolean = false): void {
    this.isActive = !this.isActive;
    this.mapObject.set('fillOpacity', this.isActive ? 0.3 : 0);

    this.options.map.setActiveBeehive(this.isActive ? this : null);
  }

  public editHives(): void {
    this.isEditingHives = !this.isEditingHives;

    for (let i = 0; i < this.hives().length; i++) {
      this.isEditingHives ? this.hives()[i].addListener() : this.hives()[i].removeListener();
    }

    this.mapObject.set('zIndex', this.isEditingHives ? 1 : 3);
    this.mapObject.set('fillOpacity', this.isEditingHives ? 0 : 0.3);
  }

  private getActiveHives(): Hive[] {
    return _.filter(this.hives(), (h) => h.isActive());
  }
}
