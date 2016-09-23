import * as $ from 'jquery';
import 'jquery-migrate';
import 'foundation-sites';
import * as _ from 'lodash';

import {IMapOptions, Map} from './map.ts';
import {GMaps} from './gmaps.ts';

import {config} from '../config.ts';

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
  private static scanRadius: number = 70;
  public static locationAdjustment: number = Math.sqrt(3) * Util.scanRadius / 2;
  public static hiveOverlap: number = (Util.scanRadius / 2) - ((Util.scanRadius - Util.locationAdjustment) * 2);

  public static getHiveRadius(steps: number): number {
    return ((steps - 1) * Math.sqrt(3) * this.scanRadius) + this.scanRadius;
  }

  public static getStepsToCoverRadius(radius: number): number {
    return Math.ceil(((radius - this.scanRadius) / this.scanRadius / Math.sqrt(3)) + 1);
  }

  public static getBeehiveRadius(leaps: number, steps: number): number {
    return Math.floor((3 * (leaps - 1) / 2) - 0.5) * (Util.getHiveRadius(steps) - Util.hiveOverlap) + Util.getHiveRadius(steps);
  }

  public static getLeapsToCoverRadius(radius: number, steps: number): number {
    return Math.ceil((((radius - Util.getHiveRadius(steps)) / (Util.getHiveRadius(steps) - Util.hiveOverlap) + 0.5) * 2 / 3) + 1);
  }
  public static distanceBetweenHiveCenters(steps: number): number {
    let hexInnerRadius = (steps - 1) * (3 * this.scanRadius / 2) + Util.locationAdjustment;
    return (hexInnerRadius * 2 - Util.hiveOverlap);
  }
}

export class App {

  constructor() {
    let gmaps = new GMaps();
    $(document).foundation();

    Foundation.Abide['defaults'].validators['accountColumns'] = ($el, required, parent) => {
      let accountText = $('#accounts').val();
      if (!required) return true;
      if (required && _.isEmpty(accountText)) {
        return false;
      }

      let accountColumns: Number = Number($('#accountColumns').val().split(',').length);
      let accounts: string[] = accountText.split('\n');

      let anyWrong = _.some(accounts, (a) => {
        let columns: Number = a.split(',').length;
        return accountColumns !== columns;
      });

      return !anyWrong;
    };

    Foundation.Abide['defaults'].validators['enoughAccounts'] = ($el, required, parent) => {
      let requiredWorkers = Number($('#workers').val()) * Number($('#hives').val());
      let accountText = $('#accounts').val();
      if (_.isEmpty(accountText)) {
        return false;
      }

      let accounts = accountText.split('\n').length;

      return accounts >= requiredWorkers;
    };
  }
}
