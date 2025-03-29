import './scss/styles.scss';

import { AuctionAPI } from "./components/AuctionAPI";
import { API_URL, CDN_URL } from "./utils/constants";
import { EventEmitter } from "./components/base/events";
import { cloneTemplate, createElement, ensureElement } from './utils/utils';
import AppState from './components/model/AppState';
import { Modal } from './components/common/Modal';
import Page from './components/view/Page';
import Basket from './components/common/Basket';
import Tabs from './components/common/Tabs';
import Order from './components/view/Order';
import LotItem, { CatalogChangeEvent } from './components/model/LotItem';
import { AuctionItem, BidItem, CatalogItem } from './components/view/Card';
import { Auction } from './components/view/Auction';
import { IOrderForm } from './types';
import Plug from './components/view/Plug';

const events = new EventEmitter();
const api = new AuctionAPI(CDN_URL, API_URL);

// Чтобы мониторить все события, для отладки
events.onAll(({ eventName, data }) => {
  console.log(eventName, data);
})

// Все шаблоны
const cardCatalogTemplate = ensureElement<HTMLTemplateElement>('#card');
const cardPreviewTemplate = ensureElement<HTMLTemplateElement>('#preview');
const auctionTemplate = ensureElement<HTMLTemplateElement>('#auction');
const cardBasketTemplate = ensureElement<HTMLTemplateElement>('#bid');
const bidsTemplate = ensureElement<HTMLTemplateElement>('#bids');
const basketTemplate = ensureElement<HTMLTemplateElement>('#basket');
const tabsTemplate = ensureElement<HTMLTemplateElement>('#tabs');
const soldTemplate = ensureElement<HTMLTemplateElement>('#sold');
const orderTemplate = ensureElement<HTMLTemplateElement>('#order');
const successTemplate = ensureElement<HTMLTemplateElement>('#success');
const emptyTemplate = ensureElement<HTMLTemplateElement>('#empty');
const modalTemplate = ensureElement<HTMLElement>('#modal-container');

// Модель данных приложения
const appData = new AppState({}, events);

// Глобальные контейнеры
const page = new Page(document.body, events);
const modal = new Modal(modalTemplate, events);

// Переиспользуемые части интерфейса
const bids = new Basket(cloneTemplate(bidsTemplate), events);
const basket = new Basket(cloneTemplate(basketTemplate), events);
const tabs = new Tabs(cloneTemplate(tabsTemplate), {
  onClick: (name) => {
    if (name === 'closed') events.emit('basket:open');
    else events.emit('bids:open');
  }
});
const order = new Order(cloneTemplate(orderTemplate), events);

// Дальше идет бизнес-логика
// Поймали событие, сделали что нужно

// Изменились элементы каталога
events.on<CatalogChangeEvent>('items:changed', () => {
  page.catalog = appData.catalog.map(item => {
    const card = new CatalogItem(cloneTemplate(cardCatalogTemplate), {
      onClick: () => events.emit('card:select', item)
    });
    return card.render({
      title: item.title,
      image: item.image,
      description: item.about,
      status: {
        status: item.status,
        label: item.statusLabel
      },
    });
  });

  page.counter = appData.getClosedLots().length;
});

// Открыть лот
events.on('card:select', (item: LotItem) => {
  appData.setPreview(item);
});

// Открыть форму заказа
events.on('order:open', () => {
  modal.render({
    content: order.render({
      phone: '',
      email: '',
      valid: false,
      errors: []
    })
  });
});

// Изменилось одно из полей
events.on(/^order\..*:change/, (data: { field: keyof IOrderForm, value: string }) => {
  appData.setOrderField(data.field, data.value);
});

// Изменилось состояние валидации формы
events.on('formErrors:change', (errors: Partial<IOrderForm>) => {
  const { email, phone } = errors;
  order.valid = !email && !phone;
  order.errors = Object.values({ phone, email }).filter(i => !!i).join('; ');
});

// Отправлена форма заказа
events.on('order:submit', () => {
  api.orderLots(appData.order)
    .then((result) => {
      const success = new Plug(cloneTemplate(successTemplate), {
        onClick: () => {
          modal.close();
          appData.clearBasket();
          events.emit('auction:changed');
        }
      });

      modal.render({
        content: success.render({})
      });
    })
    .catch(err => {
      console.error(err);
    });
});



// Открыть активные лоты
events.on('bids:open', () => {
  modal.render({
    content: createElement<HTMLElement>('div', {}, [
      tabs.render({
        selected: 'active'
      }),
      bids.render()
    ])
  });
});

// Открыть закрытые лоты
events.on('basket:open', () => {
  if (appData.getClosedLots().length === 0) {
    const success = new Plug(cloneTemplate(emptyTemplate), {
      onClick: () => {
        modal.close();
      }
    });

    modal.render({
      content: createElement<HTMLElement>('div', {}, [
        tabs.render({
          selected: 'closed'
        }),
        success.render({})
      ])
    });

    return;
  }

  modal.render({
    content: createElement<HTMLElement>('div', {}, [
      tabs.render({
        selected: 'closed'
      }),
      basket.render()
    ])
  });
});

// Изменения в лоте, пересчёт стоимости
events.on('auction:changed', () => {
  page.counter = appData.getClosedLots().length;
  bids.items = appData.getActiveLots().map(item => {
    const card = new BidItem(cloneTemplate(cardBasketTemplate), {
      onClick: () => events.emit('preview:changed', item)
    });
    return card.render({
      title: item.title,
      image: item.image,
      status: {
        amount: item.price,
        status: item.isMyBid
      }
    });
  });
  let total = 0;
  basket.items = appData.getClosedLots().map(item => {
    const card = new BidItem(cloneTemplate(soldTemplate), {
      onClick: (event) => {
        if (
          event.target instanceof HTMLLabelElement ||
          event.target instanceof HTMLInputElement
        ) {
          const checkbox = event.target as HTMLInputElement;
          appData.toggleOrderedLot(item.id, checkbox.checked);
          basket.total = appData.getTotal();
          basket.selected = appData.order.items;
        } else {
          events.emit('preview:changed', item);
        }
      }
    });
    return card.render({
      title: item.title,
      image: item.image,
      status: {
        amount: item.price,
        status: item.isMyBid
      }
    });
  });
  basket.selected = appData.order.items;
  basket.total = total;
})



// Изменен открытый выбранный лот
events.on('preview:changed', (item: LotItem) => {
  const showItem = (item: LotItem) => {
    const card = new AuctionItem(cloneTemplate(cardPreviewTemplate));
    const auction = new Auction(cloneTemplate(auctionTemplate), {
      onSubmit: (price) => {
        item.placeBid(price);
        auction.render({
          status: item.status,
          time: item.timeStatus,
          label: item.auctionStatus,
          nextBid: item.nextBid,
          history: item.history
        });
      }
    });

    modal.render({
      content: card.render({
        title: item.title,
        image: item.image,
        description: item.description.split("\n"),
        status: auction.render({
          status: item.status,
          time: item.timeStatus,
          label: item.auctionStatus,
          nextBid: item.nextBid,
          history: item.history
        })
      })
    });

    if (item.status === 'active') {
      auction.focus();
    }
  };

  if (item) {
    api.getLotItem(item.id)
      .then((result) => {
        item.description = result.description;
        item.history = result.history;
        showItem(item);
      })
      .catch((err) => {
        console.error(err);
      })
  } else {
    modal.close();
  }
});


// Блокируем прокрутку страницы при открытии модалки
events.on('modal:open', () => {
  page.locked = true;
});

// Разблокируем прокрутку страницы при закрытии модалки
events.on('modal:close', () => {
  page.locked = false;
});


// Получаем лоты с сервера
api.getLotList()
  .then(result => {
    // // вместо лога поместите данные в модель
    // console.log(result);
    appData.setCatalog(result);
  })
  .catch(err => {
    console.error(err);
  });


