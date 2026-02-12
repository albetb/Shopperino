import * as db from '../storage';
import { newGuid } from '../utils';

const REQUIRED_KEYS = ['Id', 'Name', 'Level', 'SelectedCity', 'Cities'];

class World {
  constructor(name = '') {
    this.Id = newGuid();
    this.Name = name;
    this.Level = 1;
    this.SelectedCity = { Id: null, Name: null };
    this.Cities = [];
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

    // Clone nested objects/arrays to ensure they're extensible
    this.SelectedCity = {
      Id: data.SelectedCity.Id,
      Name: data.SelectedCity.Name,
    };
    this.Cities = data.Cities.map(city => ({
      Id: city.Id,
      Name: city.Name,
    }));

    return this;
  }

  addCity(id, name) {
    if (this.cityIdExist(id) || this.cityNameExist(name)) {
      return;
    }

    // Safe to push now, as this.Cities is a fresh array
    this.Cities.push({ Id: id, Name: name });
    this.SelectedCity = { Id: id, Name: name };
  }

  cityNameExist(name) {
    return this.Cities.some(city => city.Name === name);
  }

  cityIdExist(id) {
    return this.Cities.some(city => city.Id === id);
  }

  getCityName(id) {
    return this.Cities.find(city => city.Id === id)?.Name;
  }

  getCityId(name) {
    return this.Cities.find(city => city.Name === name)?.Id;
  }

  selectCity(value) {
    let city = this.Cities.find(city => city.Name === value) ||
      this.Cities.find(city => city.Id === value);
    this.SelectedCity = { Id: city?.Id, Name: city?.Name };
  }

  deleteCity(value) {
    this.Cities = this.Cities.filter(
      city => city.Id !== value && city.Name !== value
    );
  }

  setPlayerLevel(lv) {
    this.Level = Math.max(1, Math.min(40, parseInt(lv, 10)));

    this.Cities.forEach(shop => {
      const cityDb = db.getCity(shop.Id);
      cityDb.setPlayerLevel(lv);
      db.setCity(cityDb);
    });
  }

  serialize() {
    return {
      Id: this.Id,
      Name: this.Name,
      Level: this.Level,
      SelectedCity: {
        Id: this.SelectedCity.Id,
        Name: this.SelectedCity.Name,
      },
      Cities: this.Cities.map(city => ({
        Id: city.Id,
        Name: city.Name,
      })),
    };
  }
}

export default World;
