import { AppAuthorities } from '../../wms-config/model/app-authorities';

export class MenuGroup {
  public menu: ItemMenu[];
}

export class ItemMenu {
  public authorities: AppAuthorities[];
}

export class CompoundItemMenu extends ItemMenu {
  public children: Array<ItemMenu> = [];
  public icon = 'keyboard_arrow_right';
  public title = '';
}

export class SingleItemMenu extends ItemMenu {
  public name: string;
  public routerName: string;
  public icon = 'keyboard_arrow_right';
}

export class UserItemMenu extends ItemMenu {
  public name: string;
  public action: string;
  public topSeparator: boolean;
  public cssClass: string;
}
