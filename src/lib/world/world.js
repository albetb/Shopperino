import City from '../city';

class World {
  constructor(name = '') {
    this.Name = name;
    this.Level = 1;
    this.SelectedCityIndex = 0;
    this.Cities = [];
  }

  addCity(name, playerLevel = 1) {
    if (this.cityNameExist(name)) return;
    const c = new City(name, playerLevel);
    c.Level = 0;
    this.Cities.push(c);
    this.SelectedCityIndex = this.Cities.length - 1;
  }

  cityNameExist(name) {
    return this.Cities.some(c => c.Name === name);
  }

  getCityName(index) {
    return this.Cities[index]?.Name ?? null;
  }

  getCityIndex(name) {
    const i = this.Cities.findIndex(c => c.Name === name);
    return i >= 0 ? i : null;
  }

  selectCityByIndex(index) {
    if (index >= 0 && index < this.Cities.length) this.SelectedCityIndex = index;
  }

  selectCityByName(name) {
    const i = this.getCityIndex(name);
    if (i != null) this.SelectedCityIndex = i;
  }

  deleteCityByIndex(index) {
    if (index < 0 || index >= this.Cities.length) return;
    this.Cities.splice(index, 1);
    if (this.SelectedCityIndex >= this.Cities.length) this.SelectedCityIndex = Math.max(0, this.Cities.length - 1);
  }

  setPlayerLevel(lv) {
    this.Level = Math.max(1, Math.min(40, parseInt(lv, 10)));
    this.Cities.forEach(c => c.setPlayerLevel(lv));
  }
}

export default World;
