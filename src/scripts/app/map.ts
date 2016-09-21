import config from '../config.ts';
import {Util, Location} from './app.ts';
import {IBeehiveOptions, Beehive} from './beehive.ts';
import * as $ from 'jquery';

export interface IMapOptions {
  gmap: google.maps.Map;
}

export class Map {
  private options: IMapOptions;
  private beehives: Beehive[];
  private activeBeehive: Beehive;
  private isEditingHives: boolean;
  private steps: number;

  constructor (options: IMapOptions) {
    this.options = options;
    this.beehives = [];
    this.activeBeehive = null;

    this.steps = config.steps;
  }

  public handleCustomControls(): void {
    let options = $('#beehive-control .slider').data('zfPlugin').options;
    options.end = config.maxSteps;
    options.initialStart = config.steps;

    $('#custom-map-controls').show();
    Foundation.reInit(['slider']);

    $('#beehive-control .slider').on('moved.zf.slider', (e) => this.changeSteps(e));
    $('#remove').on('click', () => this.removeActiveHive());
    $('#edit-hives').on('click', () => this.editHives());
    $('#generate-trigger').on('click', () => this.generateCoordsContent());
  }

  public addBeehive(location: Location): void {
    let beehive = new Beehive(<IBeehiveOptions>{ map: this, steps: config.steps, leaps: config.leaps, center: location });
    this.beehives.push(beehive);
    $('#generate-trigger').show();
  }

  public addMapObject(mapObject: google.maps.MVCObject): void {
      mapObject.set('map', this.options.gmap);
  }

  public removeMapObject(mapObject: google.maps.MVCObject): google.maps.MVCObject {
      mapObject.set('map', null);
      mapObject = null;
      return mapObject;
  }

  public addListener(mapObject: google.maps.MVCObject, eventName: string, handler: (...args: any[]) => void): void {
    google.maps.event.addListener(mapObject, eventName, handler);
  }

  private changeSteps(event: JQueryEventObject): void {
    this.steps = Number($('#steps').val());

    if (this.activeBeehive !== null) {
      this.activeBeehive.resize(this.steps);
    }
  }
  private removeActiveHive(): void {
    if (this.activeBeehive !== null) {
      this.activeBeehive.reset(true);
      this.beehives.splice(this.beehives.indexOf(this.activeBeehive), 1);
      this.activeBeehive = null;
      $('#remove').hide();

      if (this.beehives.length === 0) {
        $('#generate-trigger').hide();
      }
    }
  }

  public setActiveBeehive(beehive: Beehive): void {
    if (this.activeBeehive !== null) {
      this.activeBeehive.disableActive();
    }
    if (beehive !== null) {
      $('#remove').show();
      $('#edit-hives').show();
    } else {
      $('#remove').hide();
      $('#edit-hives').hide();
    }
    this.activeBeehive = beehive;
  }

  public editHives(): void {
    this.activeBeehive.editHives();
  }

  private generateCoordsContent(): void {
    console.log('coords');
    let coords: string = '';
    for (let b = 0; b < this.beehives.length; b++) {
      let hives = this.beehives[b].getHives();
      for (let h = 0; h < hives.length; h++) {
        let hive = hives[h];
        if (hive.isActive) {
          let center = hive.getCenter().toString();
          coords += `<br />${center}`;
        }
      }
    }
    console.log(coords);
    $('#coords-list').empty().append($('<pre>').html(coords));
  }
}
