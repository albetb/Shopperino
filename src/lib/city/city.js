import * as db from '../storage';
import { newGuid } from '../utils';

const REQUIRED_KEYS = ['Id', 'Name', 'Level', 'PlayerLevel', 'SelectedShop', 'Shops'];

class City {
  constructor(name = '', playerLevel = 1) {
    this.Id = newGuid();
    this.Name = name;
    this.Level = 1;
    this.PlayerLevel = playerLevel;
    this.SelectedShop = { Id: null, Name: null };
    this.Shops = [];
  }

  load(data) {
    if (
      data === null ||
      !REQUIRED_KEYS.every(key => Object.prototype.hasOwnProperty.call(data, key))
    ) {
      return null;
    }

    this.Id = data.Id;
    this.Name = data.Name;
    this.Level = data.Level;
    this.PlayerLevel = data.PlayerLevel;

    // Clone nested objects/arrays to ensure they're extensible
    this.SelectedShop = {
      Id: data.SelectedShop.Id,
      Name: data.SelectedShop.Name,
    };
    this.Shops = data.Shops.map(shop => ({
      Id: shop.Id,
      Name: shop.Name,
    }));

    return this;
  }

  addShop(id, name) {
    if (this.shopIdExist(id) || this.shopNameExist(name)) {
      return;
    }

    this.Shops.push({ Id: id, Name: name });
    this.SelectedShop = { Id: id, Name: name };
  }

  shopNameExist(name) {
    return this.Shops.some(shop => shop.Name === name);
  }

  shopIdExist(id) {
    return this.Shops.some(shop => shop.Id === id);
  }

  getShopName(id) {
    return this.Shops.find(shop => shop.Id === id)?.Name;
  }

  getShopId(name) {
    return this.Shops.find(shop => shop.Name === name)?.Id;
  }

  selectShop(value) {
    let shop = this.Shops.find(shop => shop.Name === value) ||
      this.Shops.find(shop => shop.Id === value);
    this.SelectedShop = { Id: shop?.Id, Name: shop?.Name };
  }

  deleteShop(value) {
    this.Shops = this.Shops.filter(
      shop => shop.Id !== value && shop.Name !== value
    );
  }

  setPlayerLevel(lv) {
    this.PlayerLevel = Math.max(1, Math.min(99, parseInt(lv, 10)));

    this.Shops.forEach(shop => {
      const shopDb = db.getShop(shop.Id);
      shopDb.setPlayerLevel(lv);
      db.setShop(shopDb);
    });
  }

  setCityLevel(lv) {
    this.Level = Math.max(0, Math.min(5, lv));

    this.Shops.forEach(shop => {
      const shopDb = db.getShop(shop.Id);
      shopDb.setCityLevel(lv);
      db.setShop(shopDb);
    });
  }
  
  serialize() {
    return {
      Id: this.Id,
      Name: this.Name,
      Level: this.Level,
      PlayerLevel: this.PlayerLevel,
      SelectedShop: {
        Id: this.SelectedShop.Id,
        Name: this.SelectedShop.Name,
      },
      Shops: this.Shops.map(shop => ({
        Id: shop.Id,
        Name: shop.Name,
      })),
    };
  }
}

export default City;
