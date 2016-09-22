import {Map} from './map.ts';
import {Hive} from './hive.ts';

import * as ko from 'knockout';

export interface IViewModelOptions {
    map: Map;
}
export class ViewModel {
    private options: IViewModelOptions;
    public activeHives: KnockoutObservable<Hive[]>;

    constructor(options: IViewModelOptions) {
        this.options = options;
        this.activeHives = ko.computed(() => this.getActiveHives());
    }

    private getActiveHives(): Hive[] {
        return this.options.map.activeHives();
    }
}
