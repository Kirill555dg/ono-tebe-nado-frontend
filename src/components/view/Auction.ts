import { LotStatus } from "../../types";
import { ensureElement, createElement, formatNumber } from "../../utils/utils";
import { Component } from "../base/Component";

export type AuctionStatus = {
  status: string,
  time: string,
  label: string,
  nextBid: number,
  history: number[]
};

interface IAuctionActions {
  onSubmit: (price: number) => void;
}

export class Auction extends Component<AuctionStatus> {
  protected _time: HTMLElement;
  protected _label: HTMLElement;
  protected _button: HTMLButtonElement;
  protected _input: HTMLInputElement;
  protected _history: HTMLElement;
  protected _bids: HTMLElement
  protected _form: HTMLFormElement;

  constructor(container: HTMLElement, actions?: IAuctionActions) {
    super(container);

    this._time = ensureElement<HTMLElement>(`.lot__auction-timer`, container);
    this._label = ensureElement<HTMLElement>(`.lot__auction-text`, container);
    this._button = ensureElement<HTMLButtonElement>(`.button`, container);
    this._input = ensureElement<HTMLInputElement>(`.form__input`, container);
    this._bids = ensureElement<HTMLElement>(`.lot__history-bids`, container);
    this._history = ensureElement<HTMLElement>('.lot__history', container);
    this._form = ensureElement<HTMLFormElement>(`.lot__bid`, container);

    this._form.addEventListener('submit', (event) => {
      event.preventDefault();
      actions?.onSubmit?.(parseInt(this._input.value));
      return false;
    });
  }

  set time(value: string) {
    this.setText(this._time, value);
  }
  set label(value: string) {
    this.setText(this._label, value);
  }
  set nextBid(value: number) {
    this._input.value = String(value);
  }
  set history(value: number[]) {
    this._bids.replaceChildren(...value.map(item => createElement<HTMLUListElement>('li', {
      className: 'lot__history-item',
      textContent: formatNumber(item)
    })));
  }

  set status(value: LotStatus) {
    if (value !== 'active') {
      this.setHidden(this._history);
      this.setHidden(this._form);
    } else {
      this.setVisible(this._history);
      this.setVisible(this._form);
    }
  }

  focus() {
    this._input.focus();
  }
}