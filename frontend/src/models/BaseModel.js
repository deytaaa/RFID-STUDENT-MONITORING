// Base Model class
export class BaseModel {
  constructor() {
    this.observers = []
  }

  // Observer pattern for notifying views of data changes
  addObserver(observer) {
    this.observers.push(observer)
  }

  removeObserver(observer) {
    this.observers = this.observers.filter(obs => obs !== observer)
  }

  notifyObservers(data) {
    this.observers.forEach(observer => observer.update(data))
  }
}

// Validation utilities
export const ValidationRules = {
  required: (value) => value && value.toString().trim() !== '',
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  rfid: (value) => /^RF\d{6}$/.test(value),
  minLength: (min) => (value) => value && value.length >= min,
  maxLength: (max) => (value) => value && value.length <= max
}

export const validate = (value, rules) => {
  for (const rule of rules) {
    if (!rule(value)) {
      return false
    }
  }
  return true
}
