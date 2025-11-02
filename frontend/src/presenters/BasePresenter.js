// Base Presenter class
export class BasePresenter {
  constructor(model) {
    this.model = model
    this.view = null
    this.isLoading = false
    this.error = null
  }

  setView(view) {
    this.view = view
    // Subscribe to model changes
    if (this.model && this.model.addObserver) {
      this.model.addObserver(this)
    }
  }

  // Observer pattern - called when model changes
  update(data) {
    if (this.view && this.view.updateView) {
      this.view.updateView(data)
    }
  }

  // Common state management
  setLoading(isLoading) {
    this.isLoading = isLoading
    if (this.view && this.view.setLoading) {
      this.view.setLoading(isLoading)
    }
  }

  setError(error) {
    this.error = error
    if (this.view && this.view.setError) {
      this.view.setError(error)
    }
  }

  clearError() {
    this.error = null
    if (this.view && this.view.setError) {
      this.view.setError(null)
    }
  }

  // Async operation wrapper
  async executeAsync(operation) {
    try {
      this.setLoading(true)
      this.clearError()
      
      const result = await operation()
      
      this.setLoading(false)
      return result
    } catch (error) {
      this.setLoading(false)
      this.setError(error.message || 'An error occurred')
      throw error
    }
  }

  // Cleanup
  destroy() {
    if (this.model && this.model.removeObserver) {
      this.model.removeObserver(this)
    }
    this.view = null
  }
}

export default BasePresenter
