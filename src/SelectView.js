// @flow

import ViewBase from './ViewBase';
import List, { type ListColumn } from './List';
import Menu from './Menu';
import MenuItem from './MenuItem';
import Tab from './Tab';

export type SelectViewItem = {
  label: string,
  execute?: () => Promise<void>,
}

export default class SelectView extends ViewBase {
  _tab: Tab
  _items: Array<SelectViewItem>
  _list: List<SelectViewItem>
  _menu: Menu

  constructor(tab: Tab, title: string, items: SelectViewItem[]) {
    super(title);
    this._tab = tab;
    this._items = items;

    this._menu = new Menu(tab, [
      new MenuItem('O', 'OK', 'Continue with selected item', this.onOk.bind(this)),
    ]);

    const longestItemLabel = items
      .reduce((oldMax, item) => {
        let newMax;
        if (item.label.length > oldMax) {
          newMax = item.label.length;
        } else {
          newMax = oldMax;
        }
        return newMax;
      }, 0);

    const columns: Array<ListColumn<SelectViewItem>> = [{
      heading: 'Option',
      width: longestItemLabel,
      value: item => item.label,
      menu: this._menu,
    }];


    this._list = new List(tab, columns, items, {
      menu: this._menu,
      rowSelection: true,
      onEnter: this.onListEnter.bind(this),
      showHeadings: false,
    });
  }

  async onListEnter(listIndex: number) {
    const item = this._items[listIndex];
    if (item.execute) {
      await item.execute();
    } else {
      this._tab.setWarning(`Sorry, the '${item.label}' option hasn't been implemented yet.`);
    }
  }

  async onOk() {
    this.onListEnter(this._list.selectedRowIndex);
  }

  render(inactive: boolean) {
    this._list.render();
    this._menu.render(inactive);
  }

  async handle(key: string): Promise<boolean> {
    let handled = await this._menu.handle(key);
    if (!handled) {
      handled = this._list.handle(key);
    }
    return handled;
  }
}
