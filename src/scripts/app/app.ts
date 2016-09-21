import * as $ from 'jquery';
import 'jquery-migrate';
import 'foundation-sites';

import {IMapOptions, Map} from './map.ts';
import {GMaps} from './gmaps.ts';

import config from '../config.ts';

export class Location {
  private latLng: google.maps.LatLng;

  constructor(latitude: number, longitude: number) {
    this.latLng = new google.maps.LatLng(latitude, longitude);
  }

  public toString(): string {
    return `${this.latLng.lat()}, ${this.latLng.lng()}`;
  }

  public getLatLng(): google.maps.LatLng {
    return this.latLng;
  }
}

export class Util {
  public static getHiveRadius(steps: number): number {
    return ((steps - 1) * Math.sqrt(3) * 70) + 70;
  }

  public static getStepsToCoverRadius(radius: number): number {
    return Math.ceil(((radius - 70) / 70 / Math.sqrt(3)) + 1);
  }

  public static getBeehiveRadius(leaps: number, steps: number): number {
    return Math.floor((3 * leaps / 2) - 0.5) * Util.getHiveRadius(steps);
  }

  public static getLeapsToCoverRadius(radius: number, steps: number): number {
    return Math.ceil(((radius / Util.getHiveRadius(steps)) + 0.5) * 2 / 3);
  }
}

export class App {
  private map: Map;

  constructor() {
    let gmaps = new GMaps();

    $(document).foundation();
  }
}
