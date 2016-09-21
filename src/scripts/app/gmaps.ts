import config from '../config.ts';
import * as $ from 'jquery';
import loadGoogleMapsApi from 'load-google-maps-api';
import {Location} from './app.ts';
import {IMapOptions, Map} from './map.ts';
import {IBeehiveOptions, Beehive} from './beehive.ts';

export class GMaps {
    private map: Map;
    private gmap: google.maps.Map;

    constructor() {
        loadGoogleMapsApi({
            key: config.googleMapsKey,
            libraries: ['places', 'geometry']
        }).then((googleMaps) => {
            this.initMap();
            this.map = new Map(<IMapOptions>{ gmap: this.gmap });
        });
    }

    private initMap(): void {
        this.gmap = new google.maps.Map(document.getElementById('map'), {
            zoom: config.zoom,
            center: new google.maps.LatLng(config.latitude, config.longitude),
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: false
        });

        let input = document.getElementById('pac-input') as HTMLInputElement;
        this.gmap.controls[google.maps.ControlPosition.TOP_CENTER].push(document.getElementById('custom-map-controls'));

        this.gmap.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(document.getElementById('generate-trigger'));

        let autocomplete = new google.maps.places.Autocomplete(input);
        autocomplete.bindTo('bounds', this.gmap);

        autocomplete.addListener('place_changed', () => {
            let place = autocomplete.getPlace();
            if (place.geometry) {
                this.gmap.setCenter(place.geometry.location);
                this.gmap.setZoom(config.zoom);
            }
        });

        this.gmap.addListener('click', (event: google.maps.MouseEvent) => {
            this.map.addBeehive(new Location(event.latLng.lat(), event.latLng.lng()));
        });


        google.maps.event.addListenerOnce(this.gmap, 'idle', () => {
            this.map.handleCustomControls();
        });
    }
}
