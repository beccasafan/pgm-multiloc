import {config} from '../config.ts';
import {Util, Location} from './app.ts';
import {IBeehiveOptions, Beehive} from './beehive.ts';
import * as $ from 'jquery';
import {ViewModel} from './viewModel.ts';
import {Hive} from './hive.ts';

import * as ko from 'knockout';
import * as _ from 'lodash';

export interface IMapOptions {
  gmap: google.maps.Map;
}

export class Map {
  private options: IMapOptions;
  private beehives: KnockoutObservableArray<Beehive>;
  private activeBeehive: Beehive;
  private isEditingHives: boolean;
  private steps: number;
  public activeHives: KnockoutComputed<Hive[]>;

  constructor () {
    this.beehives = ko.observableArray([]);
    this.activeBeehive = null;

    this.steps = config.steps;

    this.activeHives = ko.computed(() => this.getActiveHives());
  }

  public initMap(options: IMapOptions): void {
    this.options = options;
    let sliderOptions = $('#beehive-control .slider').data('zfPlugin').options;
    sliderOptions.end = config.maxSteps;
    sliderOptions.initialStart = config.steps;

    $('#custom-map-controls').show();
    $('#github-buttons').show();
    Foundation.reInit(['slider']);

    $('#beehive-control .slider').on('moved.zf.slider', (e) => this.changeSteps(e));
    $('#remove').on('click', () => this.removeActiveHive());
    $('#edit-hives').on('click', () => this.editHives());
    $('#generate-ui-wrapper').on('open.zf.reveal', () => {
      _.forEach($('input,select,textarea', '#generate-ui'), (e) => $('#generate-ui').foundation('validateInput', $(e)));
    });
    let vm = new ViewModel({map: this});
    ko.applyBindings(vm, document.getElementsByTagName('body')[0]);
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

      if (this.beehives().length === 0) {
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

  private getActiveHives(): Hive[] {
    return _.flatten(_.map(this.beehives(), (b) => b.activeHives()));
  }
}
