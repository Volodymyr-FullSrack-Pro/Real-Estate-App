document.addEventListener('DOMContentLoaded', () => {
  const typingText = document.getElementById('typing-text')
  const searchButton = document.querySelector('.hero__search-btn')
  const dropdownButtons = document.querySelectorAll('.hero__dropdown-btn')
  const dropdownMenus = document.querySelectorAll('.hero__dropdown-menu')
  const houseTemplate = document.getElementById('house-card-template')
  const housesGrid = document.getElementById('houses-grid')
  const emptyElement = document.querySelector('.house-list__empty')
  const housesList = document.querySelector('.house-list__section')

  const mobileToggle = document.querySelector('.header__mobile-toggle')
  const navList = document.querySelector('.header__nav-list')
  const navLinks = document.querySelectorAll('.header__nav-link')

  let housesData = []
  let activeDropdown = null

  // initNavigation()

  const textsToType = ['Your Dream House', 'Your Best Location', 'Your Ideal Property']
  let textIndex = 0, charIndex = 0, isDeleting = false

  const typeText = () => {
    const currentText = textsToType[textIndex]
    const text = isDeleting ? currentText.substring(0, --charIndex) : currentText.substring(0, ++charIndex)
    typingText.innerHTML = `${text}<span class="cursor"></span>`

    if (!isDeleting && charIndex === currentText.length) {
      isDeleting = true
      setTimeout(typeText, 1000)
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false
      textIndex = (textIndex + 1) % textsToType.length
      setTimeout(typeText, 500)
    } else {
      setTimeout(typeText, isDeleting ? 50 : 100)
    }
  }

  if (typingText) typeText()

  async function fetchData() {
    try {
      const response = await fetch('/properties.json')
      const data = await response.json()
      housesData = data.housesData || []
      renderHouseCards(housesData)

      if (document.getElementById('location-dropdown')) {
        initDropdowns(housesData)
        restoreDropdownSelections()
      }
    } catch (e) {
      console.error('Error fetching data:', e)
    }
  }

  function renderHouseCards(houses) {
    if (!housesGrid || !houseTemplate) return

    housesGrid.innerHTML = ''

    if (houses.length === 0) {
      emptyElement.style.display = 'block'
      housesGrid.style.display = 'none'
      return
    }

    emptyElement.style.display = 'none'
    housesGrid.style.display = 'grid'

    houses.forEach(house => {
      const card = houseTemplate.content.cloneNode(true)

      const map = {
        '.house__image': el => {
          el.src = house.imagePath
          el.alt = house.name || house.address
        },
        '.house__tag--type': el => el.textContent = house.type,
        '.house__tag--country': el => el.textContent = house.country,
        '.house__address': el => el.textContent = house.address,
        '.house__icon--bed + .house__feature-text': el => el.textContent = house.bedrooms,
        '.house__icon--bath + .house__feature-text': el => el.textContent = house.bathrooms,
        '.house__icon--area + .house__feature-text': el => el.textContent = house.surface,
        '.house__price': el => el.textContent = `$${parseInt(house.price).toLocaleString()}`,
        '.house-list__link': el => {
          el.href = 'javascript:void(0)'
          el.dataset.houseId = house.id
        }
      }

      for (const selector in map) {
        const el = card.querySelector(selector)
        if (el) map[selector](el)
      }

      // Click to open house-profile
      card.querySelector('.house-list__link')?.addEventListener('click', e => {
        e.preventDefault()
        sessionStorage.setItem('selectedHouse', JSON.stringify(house))
        window.open(`house-profile.html?id=${house.id}`, '_blank')
      })

      housesGrid.appendChild(card)
    })
  }

  function filterProperties(location, type, priceRange) {
    return housesData.filter(property => {
      const price = parseInt(property.price)
      const isLocationValid = location === 'Location (any)' || property.country === location
      const isTypeValid = type === 'Property type (any)' || property.type === type

      let min = 0, max = Infinity
      const priceMatch = priceRange?.match(/\d{1,3}(?:,\d{3})*/g)
      if (priceMatch) {
        min = parseInt(priceMatch[0].replace(/,/g, ''))
        if (priceMatch[1]) {
          max = parseInt(priceMatch[1].replace(/,/g, ''))
        }
      }

      const isPriceValid = price >= min && price <= max
      return isLocationValid && isTypeValid && isPriceValid
    })
  }

  function handleSearch() {
    const location = document.querySelector('.hero__dropdown--location .hero__dropdown-title')?.textContent
    const type = document.querySelector('.hero__dropdown--property .hero__dropdown-title')?.textContent
    const price = document.querySelector('.hero__dropdown--price .hero__dropdown-title')?.textContent

    saveDropdownSelections({ location, type, price })

    const filtered = filterProperties(location, type, price)
    renderHouseCards(filtered)

    const summary = document.querySelector('.hero__results-summary')
    if (summary) {
      summary.innerHTML = filtered.length > 0
        ? `<strong>${filtered.length}</strong> properties found
            <button class="hero__reset-btn">Reset filters</button>`
        : `<span style="color: red">No results found</span>
            <button class="hero__reset-btn">Reset filters</button>`

      summary.querySelector('.hero__reset-btn')?.addEventListener('click', resetFilters)
    }

    housesList?.scrollIntoView({ behavior: 'smooth' })
  }

  function resetFilters() {
    localStorage.removeItem('dropdownSelection')
    updateDropdownTitle('location', 'Location (any)')
    updateDropdownTitle('property', 'Property type (any)')
    updateDropdownTitle('price', 'Price range (any)')
    renderHouseCards(housesData)

    const summary = document.querySelector('.hero__results-summary')
    if (summary) {
      summary.innerHTML = `<strong>All</strong> properties found
          <button class="hero__reset-btn">Reset filters</button>`
      summary.querySelector('.hero__reset-btn')?.addEventListener('click', resetFilters)
    }

    closeAllDropdowns()
  }

  function closeAllDropdowns() {
    dropdownMenus.forEach(menu => {
      menu.classList.remove('active')
      menu.style.maxHeight = null
    })
    dropdownButtons.forEach(btn => {
      const icon = btn.querySelector('.hero__dropdown-icon-secondary')
      if (icon) {
        icon.classList.remove('fa-chevron-up')
        icon.classList.add('fa-chevron-down')
      }
    })
    activeDropdown = null
  }

  dropdownButtons.forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation()
      const type = btn.dataset.dropdown
      const dropdown = document.getElementById(`${type}-dropdown`)
      const icon = btn.querySelector('.hero__dropdown-icon-secondary')

      if (activeDropdown && activeDropdown !== dropdown) closeAllDropdowns()

      dropdown?.classList.toggle('active')
      if (dropdown?.classList.contains('active')) {
        dropdown.style.maxHeight = dropdown.scrollHeight + 'px'
        activeDropdown = dropdown
        icon?.classList.replace('fa-chevron-down', 'fa-chevron-up')
      } else {
        dropdown.style.maxHeight = null
        activeDropdown = null
        icon?.classList.replace('fa-chevron-up', 'fa-chevron-down')
      }
    })
  })

  document.addEventListener('click', e => {
    const item = e.target.closest('.hero__dropdown-item')
    if (item) {
      const menu = item.closest('.hero__dropdown-menu')
      const type = menu.id.replace('-dropdown', '')
      updateDropdownTitle(type, item.textContent)
      closeAllDropdowns()
    } else if (!e.target.closest('.hero__dropdown')) {
      closeAllDropdowns()
    }
  })

  function updateDropdownTitle(type, value) {
    const button = document.querySelector(`[data-dropdown="${type}"]`)
    const title = button?.querySelector('.hero__dropdown-title')
    if (title) title.textContent = value
  }

  function initDropdowns(data) {
    const locationDropdown = document.getElementById('location-dropdown')
    const propertyDropdown = document.getElementById('property-dropdown')
    const priceDropdown = document.getElementById('price-dropdown')

    if (!locationDropdown || !propertyDropdown || !priceDropdown) {
      console.warn('One or more dropdown elements not found in DOM!')
      return
    }

    const locations = [...new Set(data.map(h => h.country))].sort()
    const types = [...new Set(data.map(h => h.type))].sort()
    const prices = [...new Set(data.map(h => parseInt(h.price)))].sort((a, b) => a - b)

    populateDropdown(locationDropdown, locations, 'Location (any)')
    populateDropdown(propertyDropdown, types, 'Property type (any)')
    populateDropdown(priceDropdown, prices.map(p => p.toString()), 'Price range (any)', true)
  }

  function populateDropdown(menu, data, anyLabel, isPrice = false) {
    if (!menu) return
    menu.innerHTML = ''

    const anyOption = document.createElement('li')
    anyOption.textContent = anyLabel
    anyOption.classList.add('hero__dropdown-item')
    anyOption.dataset.value = anyLabel
    menu.appendChild(anyOption)

    if (isPrice) {
      for (let i = 0; i < data.length - 1; i++) {
        const from = parseInt(data[i]).toLocaleString()
        const to = parseInt(data[i + 1]).toLocaleString()
        const li = document.createElement('li')
        li.textContent = `$${from} - $${to}`
        li.classList.add('hero__dropdown-item')
        li.dataset.value = li.textContent
        menu.appendChild(li)
      }
    } else {
      data.forEach(val => {
        const li = document.createElement('li')
        li.textContent = val
        li.classList.add('hero__dropdown-item')
        li.dataset.value = val
        menu.appendChild(li)
      })
    }
  }

  function saveDropdownSelections({ location, type, price }) {
    localStorage.setItem('dropdownSelection', JSON.stringify({ location, type, price }))
  }

  function restoreDropdownSelections() {
    const saved = JSON.parse(localStorage.getItem('dropdownSelection') || '{}')
    if (saved.location) updateDropdownTitle('location', saved.location)
    if (saved.type) updateDropdownTitle('property', saved.type)
    if (saved.price) updateDropdownTitle('price', saved.price)
  }

  fetchData()

  if (searchButton) {
    searchButton.addEventListener('click', handleSearch)
  }
})
