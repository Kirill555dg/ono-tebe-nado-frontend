import dayjs from "dayjs";
import { ILot, LotStatus } from "../../types";
import { Model } from "../base/Model";
import { formatNumber } from "../../utils/utils";

export type CatalogChangeEvent = {
  catalog: LotItem[]
};

export default class LotItem extends Model<ILot> {
  status: LotStatus;
  datetime: string;
  price: number;
  minPrice: number;
  history?: number[];
  id: string;
  title: string;
  about: string;
  description?: string;
  image: string;

  protected myLastBid: number = 0;

  clearBid() {
    this.myLastBid = 0;
  }

  placeBid(price: number): void {
    this.price = price;
    this.history = [...this.history.slice(1), price];
    this.myLastBid = price;

    if (price > (this.minPrice * 10)) {
      this.status = 'closed';
      this.datetime = dayjs(Date.now()).toString();
    }
    this.emitChanges('auction:changed', { id: this.id, price });
    this.emitChanges('items:changed');
  }

  get isMyBid(): boolean {
    return this.myLastBid === this.price;
  }

  get isParticipate(): boolean {
    return this.myLastBid !== 0;
  }

  get statusLabel(): string {
    const remainingTime = dayjs(this.datetime).format('D MMMM [в] HH:mm')
    switch (this.status) {
      case "active":
        return `Открыто до ${remainingTime}`
      case "closed":
        return `Закрыто ${remainingTime}`
      case "wait":
        return `Откроется ${remainingTime}`
      default:
        return this.status;
    }
  }

  get timeStatus(): string {
    if (this.status === 'closed') return 'Аукцион завершен';
    else return dayjs
      .duration(dayjs(this.datetime).valueOf() - Date.now())
      .format('D[д] H[ч] m[ мин] s[ сек]');
  }

  get auctionStatus(): string {
    switch (this.status) {
      case 'closed':
        return `Продано за ${formatNumber(this.price)}₽`;
      case 'wait':
        return 'До начала аукциона';
      case 'active':
        return 'До закрытия лота';
      default:
        return '';
    }
  }

  get nextBid(): number {
    return ~~(this.price * 1.1);
  }
}