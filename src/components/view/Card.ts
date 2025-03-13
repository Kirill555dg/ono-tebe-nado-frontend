import clsx from "clsx";
import { LotStatus } from "../../types";
import { bem, ensureElement, formatNumber } from "../../utils/utils";
import { Component } from "../base/Component";

interface ICardActions {
  onClick: (event: MouseEvent) => void;
}

export interface ICard<T> {
  title: string;
  description?: string | string[];
  image: string;
  status: T;
}

export class Card<T> extends Component<ICard<T>> {
  protected _title: HTMLElement;
  protected _image?: HTMLImageElement;
  protected _description?: HTMLElement;
  protected _button?: HTMLButtonElement;

  constructor(protected blockName: string, container: HTMLElement, actions?: ICardActions) {
    super(container);

    this._title = ensureElement<HTMLElement>(`.${blockName}__title`, container);
    this._image = ensureElement<HTMLImageElement>(`.${blockName}__image`, container);
    this._button = container.querySelector(`.${blockName}__button`);
    this._description = container.querySelector(`.${blockName}__description`);

    if (actions?.onClick) {
      if (this._button) {
        this._button.addEventListener('click', actions.onClick);
      } else {
        container.addEventListener('click', actions.onClick);
      }
    }
  }

  set id(value: string) {
    this.container.dataset.id = value;
  }

  get id(): string {
    return this.container.dataset.id || '';
  }

  set title(value: string) {
    this.setText(this._title, value);
  }

  get title(): string {
    return this._title.textContent || '';
  }

  set image(value: string) {
    this.setImage(this._image, value, this.title)
  }

  set description(value: string | string[]) {
    if (Array.isArray(value)) {
      this._description.replaceWith(...value.map(str => {
        const descTemplate = this._description.cloneNode() as HTMLElement;
        this.setText(descTemplate, str);
        return descTemplate;
      }));
    } else {
      this.setText(this._description, value);
    }
  }
}



export type CatalogItemStatus = {
  status: LotStatus,
  label: string
};

export class CatalogItem extends Card<CatalogItemStatus> {
  protected _status: HTMLElement;

  constructor(container: HTMLElement, actions?: ICardActions) {
    super('card', container, actions);
    this._status = ensureElement<HTMLElement>(`.card__status`, container);
  }

  set status({ status, label }: CatalogItemStatus) {
    this.setText(this._status, label);
    this._status.className = clsx('card__status', {
      [bem(this.blockName, 'status', 'active').name]: status === 'active',
      [bem(this.blockName, 'status', 'closed').name]: status === 'closed'
    });
  }
}



export class AuctionItem extends Card<HTMLElement> {
  protected _status: HTMLElement;

  constructor(container: HTMLElement, actions?: ICardActions) {
    super('lot', container, actions);
    this._status = ensureElement<HTMLElement>(`.lot__status`, container);
  }

  set status(content: HTMLElement) {
    this._status.replaceWith(content);
  }
}



export interface BidStatus {
  amount: number;
  status: boolean;
}

export class BidItem extends Card<BidStatus> {
  protected _amount: HTMLElement;
  protected _status: HTMLElement;
  protected _selector: HTMLInputElement;

  constructor(container: HTMLElement, actions?: ICardActions) {
    super('bid', container, actions);
    this._amount = ensureElement<HTMLElement>(`.bid__amount`, container);
    this._status = ensureElement<HTMLElement>(`.bid__status`, container);
    this._selector = container.querySelector(`.bid__selector-input`);

    if (!this._button && this._selector) {
      this._selector.addEventListener('change', (event: MouseEvent) => {
        actions?.onClick?.(event);
      })
    }
  }

  set status({ amount, status }: BidStatus) {
    this.setText(this._amount, formatNumber(amount));

    if (status) this.setVisible(this._status);
    else this.setHidden(this._status);
  }
}