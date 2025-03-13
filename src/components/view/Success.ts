import { ensureElement } from "../../utils/utils";
import { Component } from "../base/Component";

interface ISuccess {
  total: number;
}

interface ISuccessActions {
  onClick: () => void;
}

export default class Success extends Component<ISuccess> {
  protected _close: HTMLElement;

  constructor(container: HTMLElement, actions: ISuccessActions) {
    super(container);

    this._close = ensureElement<HTMLElement>('.state__action', this.container);

    if (actions?.onClick) {
      this._close.addEventListener('click', actions.onClick);
    }
  }
}