import { ensureElement } from "../../utils/utils";
import { Component } from "../base/Component";

interface IPlug {
  total: number;
}

interface IPlugActions {
  onClick: () => void;
}

export default class Plug extends Component<IPlug> {
  protected _close: HTMLElement;

  constructor(container: HTMLElement, actions: IPlugActions) {
    super(container);

    this._close = ensureElement<HTMLElement>('.state__action', this.container);

    if (actions?.onClick) {
      this._close.addEventListener('click', actions.onClick);
    }
  }
}