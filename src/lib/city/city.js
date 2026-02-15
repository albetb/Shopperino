import Shop from '../shop';

class City {
  constructor(name = '', playerLevel = 1) {
    this.Name = name;
    this.Level = 0;
    this.PlayerLevel = playerLevel;
    this.SelectedShopIndex = 0;
    this.Shops = [];
  }

  addShop(name, cityLevel, playerLevel) {
    if (this.shopNameExist(name)) return;
    const s = new Shop(name, cityLevel, playerLevel);
    this.Shops.push(s);
    this.SelectedShopIndex = this.Shops.length - 1;
  }

  shopNameExist(name) {
    return this.Shops.some(s => s.Name === name);
  }

  getShopName(index) {
    return this.Shops[index]?.Name ?? null;
  }

  getShopIndex(name) {
    const i = this.Shops.findIndex(s => s.Name === name);
    return i >= 0 ? i : null;
  }

  selectShopByIndex(index) {
    if (index >= 0 && index < this.Shops.length) this.SelectedShopIndex = index;
  }

  selectShopByName(name) {
    const i = this.getShopIndex(name);
    if (i != null) this.SelectedShopIndex = i;
  }

  deleteShopByIndex(index) {
    if (index < 0 || index >= this.Shops.length) return;
    this.Shops.splice(index, 1);
    if (this.SelectedShopIndex >= this.Shops.length) this.SelectedShopIndex = Math.max(0, this.Shops.length - 1);
  }

  setPlayerLevel(lv) {
    this.PlayerLevel = Math.max(1, Math.min(99, parseInt(lv, 10)));
    this.Shops.forEach(s => s.setPlayerLevel(lv));
  }

  setCityLevel(lv) {
    this.Level = Math.max(0, Math.min(5, lv));
    this.Shops.forEach(s => s.setCityLevel(lv));
  }
}

export default City;
