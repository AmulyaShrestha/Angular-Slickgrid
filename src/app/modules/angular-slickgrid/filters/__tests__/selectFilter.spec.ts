// import 3rd party lib multiple-select for the tests
import '../../../../../assets/lib/multiple-select/multiple-select';

import { TestBed } from '@angular/core/testing';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Column, FilterArguments, GridOption, FieldType, OperatorType } from '../../models';
import { CollectionService } from './../../services/collection.service';
import { Filters } from '..';
import { SelectFilter } from '../selectFilter';
import { of, Subject } from 'rxjs';

const containerId = 'demo-container';

// define a <div> container to simulate the grid container
const template = `<div id="${containerId}"></div>`;

const gridOptionMock = {
  enableFiltering: true,
  enableFilterTrimWhiteSpace: true,
} as GridOption;

const gridStub = {
  getOptions: () => gridOptionMock,
  getColumns: jest.fn(),
  getHeaderRowColumn: jest.fn(),
  render: jest.fn(),
};

describe('SelectFilter', () => {
  let divContainer: HTMLDivElement;
  let filter: SelectFilter;
  let filterArguments: FilterArguments;
  let spyGetHeaderRow;
  let mockColumn: Column;
  let collectionService: CollectionService;
  let translate: TranslateService;

  beforeEach(() => {
    divContainer = document.createElement('div');
    divContainer.innerHTML = template;
    document.body.appendChild(divContainer);
    spyGetHeaderRow = jest.spyOn(gridStub, 'getHeaderRowColumn').mockReturnValue(divContainer);

    mockColumn = {
      id: 'gender', field: 'gender', filterable: true,
      filter: {
        model: Filters.select,
        collection: [{ value: 'male', label: 'male' }, { value: 'female', label: 'female' }]
      }
    };
    filterArguments = {
      grid: gridStub,
      columnDef: mockColumn,
      callback: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [CollectionService],
      imports: [TranslateModule.forRoot()]
    });
    collectionService = TestBed.get(CollectionService);
    translate = TestBed.get(TranslateService);

    translate.setTranslation('en', {
      ALL_SELECTED: 'All Selected',
      FALSE: 'False',
      FEMALE: 'Female',
      MALE: 'Male',
      OK: 'OK',
      OTHER: 'Other',
      TRUE: 'True',
      SELECT_ALL: 'Select All',
      X_OF_Y_SELECTED: '# of % selected',
    });
    translate.setTranslation('fr', {
      ALL_SELECTED: 'Tout sélectionnés',
      FALSE: 'Faux',
      FEMALE: 'Femme',
      MALE: 'Mâle',
      OK: 'Terminé',
      OTHER: 'Autre',
      TRUE: 'Vrai',
      SELECT_ALL: 'Sélectionner tout',
      X_OF_Y_SELECTED: '# de % sélectionnés',
    });
    translate.setDefaultLang('en');

    filter = new SelectFilter(translate, collectionService);
  });

  afterEach(() => {
    filter.destroy();
  });

  it('should throw an error when trying to call init without any arguments', () => {
    expect(() => filter.init(null, true)).toThrowError('[Angular-SlickGrid] A filter must always have an "init()" with valid arguments.');
  });

  it('should throw an error when there is no collection provided in the filter property', (done) => {
    try {
      mockColumn.filter.collection = undefined;
      filter.init(filterArguments, true);
    } catch (e) {
      expect(e.toString()).toContain(`[Angular-SlickGrid] You need to pass a "collection" (or "collectionAsync") for the MultipleSelect/SingleSelect Filter to work correctly.`);
      done();
    }
  });

  it('should throw an error when collection is not a valid array', (done) => {
    try {
      // @ts-ignore
      mockColumn.filter.collection = { hello: 'world' };
      filter.init(filterArguments, true);
    } catch (e) {
      expect(e.toString()).toContain(`The "collection" passed to the Select Filter is not a valid array.`);
      done();
    }
  });

  it('should throw an error when collection is not a valid value/label pair array', (done) => {
    try {
      mockColumn.filter.collection = [{ hello: 'world' }];
      filter.init(filterArguments, true);
    } catch (e) {
      expect(e.toString()).toContain(`[select-filter] A collection with value/label (or value/labelKey when using Locale) is required to populate the Select list`);
      done();
    }
  });

  it('should throw an error when "enableTranslateLabel" is set without a valid TranslateService', (done) => {
    try {
      translate = undefined;
      mockColumn.filter.enableTranslateLabel = true;
      filter = new SelectFilter(translate, collectionService);
      filter.init(filterArguments, true);
    } catch (e) {
      expect(e.toString()).toContain(`[select-editor] The ngx-translate TranslateService is required for the Select Filter to work correctly when "enableTranslateLabel" is set.`);
      done();
    }
  });

  it('should initialize the filter', () => {
    filter.init(filterArguments, true);
    const filterCount = divContainer.querySelectorAll('select.ms-filter.search-filter.filter-gender').length;

    expect(spyGetHeaderRow).toHaveBeenCalled();
    expect(filterCount).toBe(1);
  });

  it('should be a multiple-select filter by default when it is not specified in the constructor', () => {
    filter = new SelectFilter(translate, collectionService);
    filter.init(filterArguments, true);
    const filterCount = divContainer.querySelectorAll('select.ms-filter.search-filter.filter-gender').length;

    expect(spyGetHeaderRow).toHaveBeenCalled();
    expect(filterCount).toBe(1);
    expect(filter.isMultipleSelect).toBe(true);
  });

  it('should have a placeholder when defined in its column definition', () => {
    const testValue = 'test placeholder';
    mockColumn.filter.placeholder = testValue;

    filter.init(filterArguments, true);
    const filterElm = divContainer.querySelector<HTMLSpanElement>('.ms-filter.search-filter.filter-gender .placeholder');

    expect(filterElm.innerHTML).toBe(testValue);
  });

  it('should trigger multiple select change event and expect the callback to be called with the search terms we select from dropdown list', () => {
    const spyCallback = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments, true);
    const filterBtnElm = divContainer.querySelector<HTMLButtonElement>('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice');
    const filterListElm = divContainer.querySelectorAll<HTMLInputElement>(`[name=filter-gender].ms-drop ul>li input[type=checkbox]`);
    const filterOkElm = divContainer.querySelector<HTMLButtonElement>(`[name=filter-gender].ms-drop .ms-ok-button`);
    filterBtnElm.click();

    filterListElm[0].checked = true;
    filterOkElm.click();

    const filterFilledElms = divContainer.querySelectorAll<HTMLDivElement>('.ms-parent.ms-filter.search-filter.filter-gender.filled');
    expect(filterListElm.length).toBe(2);
    expect(filterFilledElms.length).toBe(1);
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, operator: 'IN', searchTerms: ['male'], shouldTriggerQuery: true });
  });

  it('should trigger multiple select change event and expect this to work with a regular array of strings', () => {
    const spyCallback = jest.spyOn(filterArguments, 'callback');

    mockColumn.filter.collection = ['male', 'female'];
    filter.init(filterArguments, true);
    const filterBtnElm = divContainer.querySelector<HTMLButtonElement>('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice');
    const filterListElm = divContainer.querySelectorAll<HTMLInputElement>(`[name=filter-gender].ms-drop ul>li input[type=checkbox]`);
    const filterOkElm = divContainer.querySelector<HTMLButtonElement>(`[name=filter-gender].ms-drop .ms-ok-button`);
    filterBtnElm.click();

    filterListElm[0].checked = true;
    filterOkElm.click();

    const filterFilledElms = divContainer.querySelectorAll<HTMLDivElement>('.ms-parent.ms-filter.search-filter.filter-gender.filled');
    expect(filterListElm.length).toBe(2);
    expect(filterFilledElms.length).toBe(1);
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, operator: 'IN', searchTerms: ['male'], shouldTriggerQuery: true });
  });

  it('should pass a different operator then trigger an input change event and expect the callback to be called with the search terms we select from dropdown list', () => {
    mockColumn.filter.operator = 'NIN';
    const spyCallback = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments, true);
    const filterBtnElm = divContainer.querySelector<HTMLButtonElement>('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice');
    const filterListElm = divContainer.querySelectorAll<HTMLInputElement>(`[name=filter-gender].ms-drop ul>li input[type=checkbox]`);
    const filterOkElm = divContainer.querySelector<HTMLButtonElement>(`[name=filter-gender].ms-drop .ms-ok-button`);
    filterBtnElm.click();

    filterListElm[0].checked = true;
    filterOkElm.click();

    const filterFilledElms = divContainer.querySelectorAll<HTMLDivElement>('.ms-parent.ms-filter.search-filter.filter-gender.filled');
    expect(filterListElm.length).toBe(2);
    expect(filterFilledElms.length).toBe(1);
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, operator: 'NIN', searchTerms: ['male'], shouldTriggerQuery: true });
  });

  it('should have same value in "getValues" after being set in "setValues"', () => {
    filter.init(filterArguments, true);
    filter.setValues('female');
    const values = filter.getValues();

    expect(values).toEqual(['female']);
    expect(values.length).toBe(1);
  });

  it('should have empty array returned from "getValues" when nothing is set', () => {
    filter.init(filterArguments, true);
    const values = filter.getValues();

    expect(values).toEqual([]);
    expect(values.length).toBe(0);
  });

  it('should have empty array returned from "getValues" even when filter is not yet created', () => {
    const values = filter.getValues();

    expect(values).toEqual([]);
    expect(values.length).toBe(0);
  });

  it('should create the multi-select filter with a default search term when passed as a filter argument', () => {
    const spyCallback = jest.spyOn(filterArguments, 'callback');

    filterArguments.searchTerms = ['female'];
    filter.init(filterArguments, true);
    const filterBtnElm = divContainer.querySelector<HTMLButtonElement>('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice');
    const filterListElm = divContainer.querySelectorAll<HTMLInputElement>(`[name=filter-gender].ms-drop ul>li input[type=checkbox]`);
    const filterFilledElms = divContainer.querySelectorAll<HTMLDivElement>('.ms-parent.ms-filter.search-filter.filter-gender.filled');
    const filterOkElm = divContainer.querySelector<HTMLButtonElement>(`[name=filter-gender].ms-drop .ms-ok-button`);
    filterBtnElm.click();
    filterOkElm.click();

    expect(filterListElm.length).toBe(2);
    expect(filterFilledElms.length).toBe(1);
    expect(filterListElm[1].checked).toBe(true);
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, operator: 'IN', searchTerms: ['female'], shouldTriggerQuery: true });
  });

  it('should create the multi-select filter with a default search term when passed as a filter argument even with collection an array of strings', () => {
    const spyCallback = jest.spyOn(filterArguments, 'callback');
    mockColumn.filter.collection = ['male', 'female'];

    filterArguments.searchTerms = ['female'];
    filter.init(filterArguments, true);
    const filterBtnElm = divContainer.querySelector<HTMLButtonElement>('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice');
    const filterListElm = divContainer.querySelectorAll<HTMLInputElement>(`[name=filter-gender].ms-drop ul>li input[type=checkbox]`);
    const filterFilledElms = divContainer.querySelectorAll<HTMLDivElement>('.ms-parent.ms-filter.search-filter.filter-gender.filled');
    const filterOkElm = divContainer.querySelector<HTMLButtonElement>(`[name=filter-gender].ms-drop .ms-ok-button`);
    filterBtnElm.click();
    filterOkElm.click();

    expect(filterListElm.length).toBe(2);
    expect(filterFilledElms.length).toBe(1);
    expect(filterListElm[1].checked).toBe(true);
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, operator: 'IN', searchTerms: ['female'], shouldTriggerQuery: true });
  });

  it('should create the multi-select filter and sort the string collection when "collectionSortBy" is set', () => {
    mockColumn.filter = {
      collection: ['other', 'male', 'female'],
      collectionSortBy: {
        property: 'value', // REMOVE property
        sortDesc: true,
        fieldType: FieldType.string
      }
    };

    filter.init(filterArguments, true);
    const filterBtnElm = divContainer.querySelector<HTMLButtonElement>('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice');
    const filterListElm = divContainer.querySelectorAll<HTMLSpanElement>(`[name=filter-gender].ms-drop ul>li span`);
    filterBtnElm.click();

    expect(filterListElm.length).toBe(3);
    expect(filterListElm[0].textContent).toBe('other');
    expect(filterListElm[1].textContent).toBe('male');
    expect(filterListElm[2].textContent).toBe('female');
  });

  it('should create the multi-select filter and sort the value/label pair collection when "collectionSortBy" is set', () => {
    mockColumn.filter = {
      collection: [{ value: 'other', description: 'other' }, { value: 'male', description: 'male' }, { value: 'female', description: 'female' }],
      collectionSortBy: {
        property: 'value',
        sortDesc: false,
        fieldType: FieldType.string
      },
      customStructure: {
        value: 'value',
        label: 'description',
      },
    };

    filter.init(filterArguments, true);
    const filterBtnElm = divContainer.querySelector<HTMLButtonElement>('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice');
    const filterListElm = divContainer.querySelectorAll<HTMLSpanElement>(`[name=filter-gender].ms-drop ul>li span`);
    filterBtnElm.click();

    expect(filterListElm.length).toBe(3);
    expect(filterListElm[0].textContent).toBe('female');
    expect(filterListElm[1].textContent).toBe('male');
    expect(filterListElm[2].textContent).toBe('other');
  });

  xit('should create the multi-select filter and filter the string collection when "collectionFilterBy" is set', () => {
    mockColumn.filter = {
      collection: ['other', 'male', 'female'],
      collectionFilterBy: {
        property: 'value', // REMOVE property
        operator: OperatorType.equal,
        value: 'other'
      }
    };

    filter.init(filterArguments, true);
    const filterBtnElm = divContainer.querySelector<HTMLButtonElement>('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice');
    const filterListElm = divContainer.querySelectorAll<HTMLSpanElement>(`[name=filter-gender].ms-drop ul>li span`);
    filterBtnElm.click();

    expect(filterListElm.length).toBe(1);
    expect(filterListElm[0].textContent).toBe('other');
  });

  it('should create the multi-select filter and filter the value/label pair collection when "collectionFilterBy" is set', () => {
    mockColumn.filter = {
      collection: [{ value: 'other', description: 'other' }, { value: 'male', description: 'male' }, { value: 'female', description: 'female' }],
      collectionFilterBy: [
        { property: 'value', operator: OperatorType.notEqual, value: 'other' },
        { property: 'value', operator: OperatorType.notEqual, value: 'male' }
      ],
      customStructure: {
        value: 'value',
        label: 'description',
      },
    };

    filter.init(filterArguments, true);
    const filterBtnElm = divContainer.querySelector<HTMLButtonElement>('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice');
    const filterListElm = divContainer.querySelectorAll<HTMLSpanElement>(`[name=filter-gender].ms-drop ul>li span`);
    filterBtnElm.click();

    expect(filterListElm.length).toBe(1);
    expect(filterListElm[0].textContent).toBe('female');
  });

  it('should create the multi-select filter with a default search term when using "collectionAsync" as an Observable', () => {
    const spyCallback = jest.spyOn(filterArguments, 'callback');
    mockColumn.filter.collectionAsync = of(['male', 'female']);

    filterArguments.searchTerms = ['female'];
    filter.init(filterArguments, true);
    const filterBtnElm = divContainer.querySelector<HTMLButtonElement>('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice');
    const filterListElm = divContainer.querySelectorAll<HTMLInputElement>(`[name=filter-gender].ms-drop ul>li input[type=checkbox]`);
    const filterFilledElms = divContainer.querySelectorAll<HTMLDivElement>('.ms-parent.ms-filter.search-filter.filter-gender.filled');
    const filterOkElm = divContainer.querySelector<HTMLButtonElement>(`[name=filter-gender].ms-drop .ms-ok-button`);
    filterBtnElm.click();
    filterOkElm.click();

    expect(filterListElm.length).toBe(2);
    expect(filterFilledElms.length).toBe(1);
    expect(filterListElm[1].checked).toBe(true);
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, operator: 'IN', searchTerms: ['female'], shouldTriggerQuery: true });
  });

  it('should create the multi-select filter with a "collectionAsync" as an Observable and be able to call next on it', (done) => {
    const mockCollection = ['male', 'female'];
    mockColumn.filter.collectionAsync = of(mockCollection);

    filterArguments.searchTerms = ['female'];
    filter.init(filterArguments, true);
    const filterBtnElm = divContainer.querySelector<HTMLButtonElement>('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice');
    const filterListElm = divContainer.querySelectorAll<HTMLInputElement>(`[name=filter-gender].ms-drop ul>li input[type=checkbox]`);
    filterBtnElm.click();

    mockCollection.push('other');
    (mockColumn.filter.collectionAsync as Subject<any[]>).next(mockCollection);

    // before await
    expect(filterListElm.length).toBe(2);
    expect(filterListElm[1].checked).toBe(true);

    setTimeout(() => {
      // after await of Subject
      const filterUpdatedListElm = divContainer.querySelectorAll<HTMLInputElement>(`[name=filter-gender].ms-drop ul>li input[type=checkbox]`);
      expect(filterUpdatedListElm.length).toBe(3);
      done();
    });
  });

  xit('should create the multi-select filter with a "collectionAsync" as an Observable and thrown an error when collectionAsync does not return a valid array', (done) => {
    const mockCollection = ['male', 'female'];
    mockColumn.filter.collectionAsync = of(mockCollection);

    filterArguments.searchTerms = ['female'];
    filter.init(filterArguments, true);
    const filterBtnElm = divContainer.querySelector<HTMLButtonElement>('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice');
    filterBtnElm.click();

    try {
      (mockColumn.filter.collectionAsync as Subject<any>).next({ hello: 'world' });
    } catch (e) {
      expect(e.toString()).toContain(`Something went wrong while trying to pull the collection from the "collectionAsync" call in the Select Filter, the collection is not a valid array.`);
      done();
    }
  });

  xit('should throw an error when "collectionAsync" Observable does not return a valid array', (done) => {
    try {
      mockColumn.filter.collectionAsync = of({ hello: 'world' });
      filter.init(filterArguments, true);
    } catch (e) {
      expect(e.toString()).toContain(`Something went wrong while trying to pull the collection from the "collectionAsync" call in the Select Filter, the collection is not a valid array.`);
      done();
    }
  });

  it('should create the multi-select filter with a default search term and have the HTML rendered when "enableRenderHtml" is set', () => {
    mockColumn.filter = {
      enableRenderHtml: true,
      collection: [{ value: true, label: 'True', labelPrefix: `<i class="fa fa-check"></i> ` }, { value: false, label: 'False' }],
      customStructure: {
        value: 'isEffort',
        label: 'label',
        labelPrefix: 'labelPrefix',
      },
    };

    filter.init(filterArguments, true);
    const filterBtnElm = divContainer.querySelector<HTMLButtonElement>('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice');
    const filterListElm = divContainer.querySelectorAll<HTMLSpanElement>(`[name=filter-gender].ms-drop ul>li span`);
    filterBtnElm.click();

    expect(filterListElm.length).toBe(2);
    expect(filterListElm[0].innerHTML).toBe('<i class="fa fa-check"></i> True');
  });

  it('should create the multi-select filter with a default search term and have the HTML rendered and sanitized when "enableRenderHtml" is set and has <script> tag', () => {
    mockColumn.filter = {
      enableRenderHtml: true,
      collection: [{ value: true, label: 'True', labelPrefix: `<script>alert('test')></script><i class="fa fa-check"></i> ` }, { value: false, label: 'False' }],
      customStructure: {
        value: 'isEffort',
        label: 'label',
        labelPrefix: 'labelPrefix',
      },
    };

    filter.init(filterArguments, true);
    const filterBtnElm = divContainer.querySelector<HTMLButtonElement>('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice');
    const filterListElm = divContainer.querySelectorAll<HTMLSpanElement>(`[name=filter-gender].ms-drop ul>li span`);
    filterBtnElm.click();

    expect(filterListElm.length).toBe(2);
    expect(filterListElm[0].innerHTML).toBe('<i class="fa fa-check"></i> True');
  });

  it('should create the multi-select filter with a blank entry at the beginning of the collection when "addBlankEntry" is set in the "collectionOptions" property', () => {
    filterArguments.searchTerms = ['female'];
    mockColumn.filter.collectionOptions = { addBlankEntry: true };
    const spyCallback = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments, true);
    const filterBtnElm = divContainer.querySelector<HTMLButtonElement>('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice');
    const filterListElm = divContainer.querySelectorAll<HTMLInputElement>(`[name=filter-gender].ms-drop ul>li input[type=checkbox]`);
    const filterFilledElms = divContainer.querySelectorAll<HTMLDivElement>('.ms-parent.ms-filter.search-filter.filter-gender.filled');
    const filterOkElm = divContainer.querySelector<HTMLButtonElement>(`[name=filter-gender].ms-drop .ms-ok-button`);
    filterBtnElm.click();
    filterOkElm.click();

    expect(filterListElm.length).toBe(3);
    expect(filterFilledElms.length).toBe(1);
    expect(filterListElm[2].checked).toBe(true);
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, operator: 'IN', searchTerms: ['female'], shouldTriggerQuery: true });
  });

  it('should trigger a callback with the clear filter set when calling the "clear" method', () => {
    filterArguments.searchTerms = ['female'];
    const spyCallback = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments, true);
    filter.clear();
    const filterFilledElms = divContainer.querySelectorAll<HTMLDivElement>('.ms-parent.ms-filter.search-filter.filter-gender.filled');

    expect(filter.searchTerms.length).toBe(0);
    expect(filterFilledElms.length).toBe(0);
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, clearFilterTriggered: true, shouldTriggerQuery: true });
  });

  it('should trigger a callback with the clear filter but without querying when when calling the "clear" method with False as argument', () => {
    filterArguments.searchTerms = ['female'];
    const spyCallback = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments, true);
    filter.clear(false);
    const filterFilledElms = divContainer.querySelectorAll<HTMLDivElement>('.ms-parent.ms-filter.search-filter.filter-gender.filled');

    expect(filter.searchTerms.length).toBe(0);
    expect(filterFilledElms.length).toBe(0);
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, clearFilterTriggered: true, shouldTriggerQuery: false });
  });

  it('should work with English locale when locale is changed', (done) => {
    translate.use('en');
    gridOptionMock.enableTranslate = true;
    mockColumn.filter = {
      enableTranslateLabel: true,
      collection: [
        { value: 'other', labelKey: 'OTHER' },
        { value: 'male', labelKey: 'MALE' },
        { value: 'female', labelKey: 'FEMALE' }
      ],
      filterOptions: { minimumCountSelected: 1 }
    };

    filterArguments.searchTerms = ['male', 'female'];
    filter.init(filterArguments, true);

    setTimeout(() => {
      const filterSelectAllElm = divContainer.querySelector<HTMLSpanElement>('.filter-gender .ms-select-all label span');
      const filterBtnElm = divContainer.querySelector<HTMLButtonElement>('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice');
      const filterListElm = divContainer.querySelectorAll<HTMLSpanElement>(`[name=filter-gender].ms-drop ul>li span`);
      const filterOkElm = divContainer.querySelector<HTMLButtonElement>(`[name=filter-gender].ms-drop .ms-ok-button`);
      const filterParentElm = divContainer.querySelector<HTMLButtonElement>(`.ms-parent.ms-filter.search-filter.filter-gender button`);
      filterBtnElm.click();

      expect(filterListElm.length).toBe(3);
      expect(filterListElm[0].textContent).toBe('Other');
      expect(filterListElm[1].textContent).toBe('Male');
      expect(filterListElm[2].textContent).toBe('Female');
      expect(filterOkElm.textContent).toBe('OK');
      expect(filterSelectAllElm.textContent).toBe('Select All');
      expect(filterParentElm.textContent).toBe('2 of 3 selected');
      done();
    });
  });

  it('should work with French locale when locale is changed', (done) => {
    translate.use('fr');
    gridOptionMock.enableTranslate = true;
    mockColumn.filter = {
      enableTranslateLabel: true,
      collection: [
        { value: 'other', labelKey: 'OTHER' },
        { value: 'male', labelKey: 'MALE' },
        { value: 'female', labelKey: 'FEMALE' }
      ],
      filterOptions: { minimumCountSelected: 1 }
    };

    filterArguments.searchTerms = ['male', 'female'];
    filter.init(filterArguments, true);
    setTimeout(() => {
      const filterSelectAllElm = divContainer.querySelector<HTMLSpanElement>('.filter-gender .ms-select-all label span');
      const filterBtnElm = divContainer.querySelector<HTMLButtonElement>('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice');
      const filterListElm = divContainer.querySelectorAll<HTMLSpanElement>(`[name=filter-gender].ms-drop ul>li span`);
      const filterOkElm = divContainer.querySelector<HTMLButtonElement>(`[name=filter-gender].ms-drop .ms-ok-button`);
      const filterParentElm = divContainer.querySelector<HTMLButtonElement>(`.ms-parent.ms-filter.search-filter.filter-gender button`);
      filterBtnElm.click();

      expect(filterListElm.length).toBe(3);
      expect(filterListElm[0].textContent).toBe('Autre');
      expect(filterListElm[1].textContent).toBe('Mâle');
      expect(filterListElm[2].textContent).toBe('Femme');
      expect(filterOkElm.textContent).toBe('Terminé');
      expect(filterSelectAllElm.textContent).toBe('Sélectionner tout');
      expect(filterParentElm.textContent).toBe('2 de 3 sélectionnés');
      done();
    });
  });
});
