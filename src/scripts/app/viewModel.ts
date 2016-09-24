import {Map} from './map.ts';
import {Hive} from './hive.ts';
import {ICommandTemplate, config} from '../config.ts';

import * as $ from 'jquery';
import * as ko from 'knockout';
import * as _ from 'lodash';

export interface IViewModelOptions {
    map: Map;
}
export class ViewModel {
    private options: IViewModelOptions;
    public activeHives: KnockoutObservable<Hive[]>;
    public os: KnockoutObservable<string>;
    public accountsPerHive: KnockoutObservable<number>;
    public accountColumns: KnockoutObservable<string>;
    public accounts: KnockoutObservable<string>;
    public pogomapDirectory: KnockoutObservable<string>;
    public filename: KnockoutObservable<string>;

    private windowsTemplates: Templates;
    private linuxTemplates: Templates;

    public activeTemplates: KnockoutObservable<Templates>;
    public generateScriptPreview: KnockoutComputed<string>;

    private invalidFields: KnockoutObservableArray<string>;
    private isValid: KnockoutComputed<boolean>;

    constructor(options: IViewModelOptions) {
        this.options = options;
        this.activeHives = ko.computed(() => this.getActiveHives());
        this.pogomapDirectory = ko.observable('');

        this.os = ko.observable(config.os);
        this.os.subscribe((newValue) => {
            this.invalidFields([]);

            if (this.os() === 'windows') {
                $('#pogomap-directory').removeAttr('data-abide-ignore');
            }
            else {
                $('#pogomap-directory').attr('data-abide-ignore', '');
            }

            _.forEach($('input,select,textarea', '#generate-ui'), (e) => $('#generate-ui').foundation('validateInput', $(e)));
        });
        this.accountsPerHive = ko.observable(config.workers);
        this.accountColumns = ko.observable(config.accountColumns);
        this.accountColumns.subscribe((newValue) => $('#generate-ui').foundation('validateInput', $('#accounts')));
        this.accounts = ko.observable('');

        this.windowsTemplates = new Templates(config.windowsTemplates);
        this.linuxTemplates = new Templates(config.linuxTemplates);
        this.activeTemplates = ko.computed(() => this.getActiveTemplates());

        this.generateScriptPreview = ko.computed(() => this.generateScriptOutput(true).replace(/\n/g, '<br />'));

        this.invalidFields = ko.observableArray([]);
        this.isValid = ko.computed(() => this.invalidFields().length === 0);
        this.isValid.subscribe((newValue) => {
            newValue ? $('#download').show() : $('#download').hide();
        });

        $(document).on('valid.zf.abide invalid.zf.abide', ((e) => this.handleFormInputValidation(e)));
        $(document).on('formvalid.zf.abide forminvalid.zf.abide', ((e) => this.handleFormValidation(e)));
    }

    private handleFormInputValidation(e: JQueryEventObject): void {
        let name = $(e.target).attr('name');
        let existingIndex = this.invalidFields.indexOf(name);
        if (e.type === 'valid') {
            if (existingIndex >= 0) {
                this.invalidFields.splice(existingIndex, 1);
            }
        }
        else {
            if (existingIndex < 0) {
                this.invalidFields.push(name);
            }
        }
    }
    private handleFormValidation(e: JQueryEventObject): void {
        if (e.type === 'valid') {
            this.invalidFields([]);
        }
    }

    private getActiveHives(): Hive[] {
        return this.options.map.activeHives();
    }

    private getActiveTemplates(): Templates {
        return this.os() === 'windows' ? this.windowsTemplates : this.linuxTemplates;
    }

    public generateScriptOutput(isPreview: boolean = true): string {
        let templates = this.activeTemplates();
        let hives = this.activeHives();
        let accounts = this.accounts().split('\n');
        if (hives.length <= 0) { return ''; }

        let preAccount = `
${templates.setup.value()}
${this.replaceVariables(templates.server.value(), { 
    'pogomap-directory': this.pogomapDirectory(),
    location: hives[0].getCenter().toString() 
})}
${templates.delay.value()}
        `;
        let workers = '';
        let currentAccountIndex = 0;
        let accountColumns = _.map(this.accountColumns().split(','), (x) => _.trim(x));

        for (let i = 0; i < (isPreview ? 1 : hives.length); i++) {
            let accountValues = [];

            for (let a = 0; a < this.accountsPerHive(); a++) {
                let accountParams: any = {};
                if (accounts.length > currentAccountIndex) {
                    let accountParts = _.map(accounts[currentAccountIndex].split(','), (acc) => _.trim(acc));
                    for (let j = 0; j < accountColumns.length; j++) {
                        accountParams[accountColumns[j]] = accountParts[j];
                    }
                }
                currentAccountIndex++;
                accountValues.push(this.replaceVariables(templates.auth.value(), accountParams));
            }
            workers += `
${this.replaceVariables(templates.worker.value(), { 
    'pogomap-directory': this.pogomapDirectory(),
    index: i + 1,
    location: hives[i].getCenter().toString(), 
    steps: hives[i].steps,
    'auth-template': _.join(accountValues, ' ') 
})}
${templates.delay.value()}
            `;
        }

        return preAccount + workers;
    }

    private replaceVariables(text: string, variables: any): string {
        _.forOwn(variables, (value, key) => text = text.replace(`{${key}}`, value));

        return text;
    }

    public downloadFile (): void {
        let script = this.generateScriptOutput(false);
        let blob = new Blob([script], { type: 'text/plain' });
        let url = window.URL.createObjectURL(blob);
        let a = $('<a>', { style: 'display: block;', download: this.activeTemplates().filename.value(), href: url }).text('DL');

        a.on('click', () => {
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                a.remove();
            }, 50);
        });

        $('#generate-ui').append(a);
        a[0].dispatchEvent(new MouseEvent('click'));
    }
}

export class Template {
    public value: KnockoutObservable<string>;
    public isDirty: KnockoutObservable<boolean>;

    constructor(public defaultValue: string) {
        this.value = ko.observable(defaultValue);
        this.isDirty = ko.observable(false);

        this.value.subscribe((newValue) => this.isDirty(true));
    }
}

export class Templates {
  public setup: Template;
  public server: Template;
  public worker: Template;
  public auth: Template;
  public delay: Template;
  public filename: Template;

  constructor(defaults: ICommandTemplate) {
      this.setup = new Template(defaults.setup);
      this.server = new Template(defaults.server);
      this.worker = new Template(defaults.worker);
      this.auth = new Template(defaults.auth);
      this.delay = new Template(defaults.delay);
      this.filename = new Template(defaults.filename);
  }
}
