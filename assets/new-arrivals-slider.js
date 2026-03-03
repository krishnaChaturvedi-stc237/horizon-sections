/**
 * New Arrivals Slider – Swiper.js
 * - Category switcher (Men / Women)
 * - Swiper for product slider: prev/next, keyboard, touch
 * - Syncs left panel (main + grid images) and product info card on slide change
 */

(function () {
  'use strict';

  const SECTION_SELECTOR = '.new-arrivals-section2-wrapper';
  const DATA_ATTR_GENDER = 'data-gender';
  const ACTIVE_CLASS = 'active';
  const TAG_CLASS_PREFIX = 'tag';

  function parseProductsDataOnce(wrapper) {
    const sectionId = wrapper.getAttribute('data-section-id');
    const script = sectionId && document.getElementById('new-arrivals-products-' + sectionId);
    if (!script || !script.textContent || script.textContent.trim() === '') {
      return { men: [], women: [] };
    }
    try {
      return JSON.parse(script.textContent.trim());
    } catch (e) {
      return { men: [], women: [] };
    }
  }

  function updateLeftPanel(container, product) {
    if (!container || !product) return;
    const mainContainer = container.querySelector('.main-image-container');
    const imgOut = mainContainer && mainContainer.querySelector('.main-product-img.img-out');
    const imgIn = mainContainer && mainContainer.querySelector('.main-product-img.img-in');
    const photos = container.querySelectorAll('.photo-grid .photo img');
    const newSrc = product.main_image || '';
    const newAlt = (product.title && String(product.title).trim()) ? String(product.title) : '';
    if (imgOut && imgIn) {
      const currentSrc = imgIn.src || imgIn.getAttribute('src') || '';
      const hasCurrent = currentSrc && currentSrc.length > 0;
      if (hasCurrent && currentSrc !== newSrc) {
        imgOut.src = currentSrc;
        imgOut.alt = imgIn.alt || '';
        imgOut.classList.add('old-img');
        imgIn.src = newSrc;
        imgIn.alt = newAlt;
        imgIn.classList.remove('animate-in');
        imgIn.offsetHeight;
        imgIn.classList.add('animate-in');
        setTimeout(function () {
          imgOut.classList.remove('old-img');
          imgOut.src = '';
          imgIn.classList.remove('animate-in');
        }, 1300);
      } else {
        imgOut.classList.remove('old-img');
        imgOut.src = '';
        imgIn.src = newSrc;
        imgIn.alt = newAlt;
        imgIn.classList.remove('animate-in');
      }
    }
    const gridImages = product.grid_images || [];
    photos.forEach((img, i) => {
      const photo = img.closest('.photo');
      if (gridImages[i]) {
        img.src = gridImages[i];
        img.alt = (product.title && String(product.title).trim()) ? String(product.title) + ' view ' + (i + 1) : '';
        if (photo) photo.style.display = '';
      } else {
        if (photo) photo.style.display = 'none';
      }
    });
  }

  function updateProductCard(card, product, productUrl) {
    if (!card || !product) return;
    const styleNo = card.querySelector('.style-no');
    const titleEl = card.querySelector('.info-title .prdct-title');
    const priceEl = card.querySelector('.price-info');
    const exploreBtn = card.querySelector('.explore-btn');
    const addToCartBtn = card.querySelector('.add-to-cart-btn');
    const specsContainer = card.querySelector('.product-specs');
    var u = product.uniqueness;
    console.log("u=",u)
    if (typeof u === 'object' && u && u.value != null) u = u.value;
    var uniquenessStr = (u && String(u).trim()) ? String(u).trim() : '';
    if (styleNo) {
      styleNo.textContent = uniquenessStr;
      styleNo.style.display = uniquenessStr ? '' : 'none';
    }
    if (addToCartBtn && product.variant_id) {
      addToCartBtn.setAttribute('data-variant-id', String(product.variant_id));
      addToCartBtn.disabled = false;
    } else if (addToCartBtn) {
      addToCartBtn.disabled = true;
    }
    if (titleEl) titleEl.textContent = product.title || '';
    if (priceEl) priceEl.textContent = product.price || '';
    if (exploreBtn) exploreBtn.href = productUrl || product.url || '#';
    if (!specsContainer) return;
    specsContainer.innerHTML = '';
    var qualities = product.product_qualities;
    console.log("qualities=",qualities)
    if (!Array.isArray(qualities)) qualities = [];
    qualities.forEach(function (item) {
      var itemObj = item && typeof item === 'object' ? item : {};
      var icon = itemObj.icon || '';
      var feature = (itemObj.feature && String(itemObj.feature).trim()) || '';
      var detail = (itemObj.detail && String(itemObj.detail).trim()) || '';
      if (!feature && !detail) return;
      var div = document.createElement('div');
      div.className = 'spec-container';
      div.innerHTML = '<div class="spec-icon" aria-hidden="true"></div><div class="spec-details"><h3></h3><p></p></div>';
      var iconEl = div.querySelector('.spec-icon');
      var h3 = div.querySelector('.spec-details h3');
      var p = div.querySelector('.spec-details p');
      if (iconEl && icon) {
        var img = document.createElement('img');
        img.src = icon;
        img.alt = feature || '';
        img.loading = 'lazy';
        iconEl.appendChild(img);
      }
      if (h3) h3.textContent = feature;
      if (p) p.textContent = detail;
      specsContainer.appendChild(div);
    });
  }

  function addToCartAndOpenDrawer(variantId) {
    if (!variantId) return;
    var cartAddUrl = (typeof Theme !== 'undefined' && Theme.routes && Theme.routes.cart_add_url)
      ? Theme.routes.cart_add_url
      : (typeof window.Shopify !== 'undefined' && window.Shopify.routes && window.Shopify.routes.root)
        ? window.Shopify.routes.root + 'cart/add.js'
        : '/cart/add.js';
    var sectionIds = [];
    var cartItems = document.querySelectorAll('cart-items-component');
    cartItems.forEach(function (el) {
      if (el && el.dataset && el.dataset.sectionId) {
        sectionIds.push(el.dataset.sectionId);
      }
    });
    var payload = {
      items: [{ id: parseInt(variantId, 10), quantity: 1 }]
    };
    if (sectionIds.length > 0) {
      payload.sections = sectionIds.join(',');
    }
    fetch(cartAddUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      return r.json();
    }).then(function (data) {
      if (data.status && (data.status === 422 || data.status >= 400)) {
        if (data.description) console.warn('Add to cart:', data.description);
        return;
      }
      document.dispatchEvent(new CustomEvent('cart:update', {
        bubbles: true,
        detail: {
          resource: data,
          sourceId: 'new-arrivals-slider',
          data: {
            source: 'product-form-component',
            itemCount: 1,
            sections: data.sections || {}
          }
        }
      }));
      var drawer = document.querySelector('cart-drawer-component');
      if (drawer && typeof drawer.open === 'function') {
        drawer.open();
      }
    }).catch(function (err) {
      console.warn('Add to cart error:', err);
    });
  }

  function syncCardFromSlider(wrapper, products, gender, index, leftContainer, card) {
    const product = products && products[index];
    const productUrl = product && (product.url || product.handle)
      ? (product.url || '/products/' + product.handle)
      : '#';
    updateLeftPanel(leftContainer, product);
    updateProductCard(card, product, productUrl);
  }

  function initSwiperSlider(sliderEl, wrapper, gender, products) {
    const wrapperEl = sliderEl.querySelector('.swiper-wrapper.products-slider');
    if (!wrapperEl) return null;
    const slides = wrapperEl.querySelectorAll('.swiper-slide');
    if (slides.length === 0) return null;

    const prevBtn = sliderEl.querySelector('.swiper-button-prev');
    const nextBtn = sliderEl.querySelector('.swiper-button-next');
    const leftContainer = wrapper.querySelector('.left-product-container');
    const card = wrapper.querySelector('.product-info-card');

    if (typeof window.Swiper === 'undefined') return null;

    const swiper = new window.Swiper(sliderEl, {
      loop: true,
      slidesPerView: 3,
      spaceBetween: 12,
      slideToClickedSlide: true,
      keyboard: { enabled: true },
      breakpoints: {
        320: { slidesPerView: 1.5 },
        640: { slidesPerView: 2 },
        990: { slidesPerView: 3 }
      },
      navigation: {
        nextEl: nextBtn,
        prevEl: prevBtn
      },
      on: {
        init: function () {
          syncCardFromSlider(wrapper, products, gender, 0, leftContainer, card);
        },
        slideChange: function () {
          if (!sliderEl.classList.contains(ACTIVE_CLASS)) return;
          const idx = this.realIndex;
          syncCardFromSlider(wrapper, products, gender, idx, leftContainer, card);
        }
      }
    });

    return swiper;
  }

  function initCategorySwitcher(sectionEl, wrapper, productsData) {
    const defaultGender = (wrapper.getAttribute('data-default-gender') || 'women').toLowerCase();
    const filters = sectionEl.querySelectorAll('.filter-tab');
    const menSlider = sectionEl.querySelector('.men-slider');
    const womenSlider = sectionEl.querySelector('.women-slider');
    const leftContainer = wrapper.querySelector('.left-product-container');
    const card = wrapper.querySelector('.product-info-card');

    function setActiveGender(gender) {
      filters.forEach((btn) => {
        const g = btn.getAttribute(DATA_ATTR_GENDER);
        btn.classList.toggle('button-active', g === gender);
        btn.setAttribute('aria-pressed', g === gender ? 'true' : 'false');
      });
      if (menSlider) {
        menSlider.classList.toggle(ACTIVE_CLASS, gender === 'men');
        menSlider.style.display = gender === 'men' ? '' : 'none';
      }
      if (womenSlider) {
        womenSlider.classList.toggle(ACTIVE_CLASS, gender === 'women');
        womenSlider.style.display = gender === 'women' ? '' : 'none';
      }
      sectionEl.classList.remove(TAG_CLASS_PREFIX + 'Men', TAG_CLASS_PREFIX + 'Women');
      sectionEl.classList.add(TAG_CLASS_PREFIX + gender.charAt(0).toUpperCase() + gender.slice(1));
      const products = productsData[gender] || [];
      const slider = gender === 'men' ? menSlider : womenSlider;
      if (slider && products.length > 0) {
        const swiper = slider._naSwiper;
        if (swiper) {
          swiper.slideTo(0, 0);
          swiper.update();
        }
        syncCardFromSlider(wrapper, products, gender, 0, leftContainer, card);
      }
    }

    filters.forEach((btn) => {
      btn.addEventListener('click', function () {
        if (this.disabled || this.getAttribute('aria-disabled') === 'true') return;
        const g = this.getAttribute(DATA_ATTR_GENDER);
        setActiveGender(g);
      });
    });

    setActiveGender(defaultGender);
  }

  function onSectionKeydown(e, wrapper, sectionEl) {
    if (e.target.closest(SECTION_SELECTOR) !== wrapper) return;
    const activeSlider = sectionEl.querySelector('.scrollable-slider.active');
    if (!activeSlider) return;
    const swiper = activeSlider._naSwiper;
    if (!swiper) return;
    const gender = activeSlider.getAttribute(DATA_ATTR_GENDER);
    const productsData = parseProductsDataOnce(wrapper);
    console.log("productsData=",productsData)
    const products = productsData[gender] || [];
    const leftContainer = wrapper.querySelector('.left-product-container');
    const card = wrapper.querySelector('.product-info-card');
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      swiper.slidePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      swiper.slideNext();
    }
  }

  function initSection(sectionEl) {
    const wrapper = sectionEl.closest(SECTION_SELECTOR);
    if (!wrapper) return;

    const productsData = parseProductsDataOnce(wrapper);

    initCategorySwitcher(sectionEl, wrapper, productsData);

    const menSlider = sectionEl.querySelector('.men-slider');
    const womenSlider = sectionEl.querySelector('.women-slider');

    if (menSlider && (productsData.men || []).length > 0) {
      const swiper = initSwiperSlider(menSlider, wrapper, 'men', productsData.men || []);
      if (swiper) menSlider._naSwiper = swiper;
    }
    if (womenSlider && (productsData.women || []).length > 0) {
      const swiper = initSwiperSlider(womenSlider, wrapper, 'women', productsData.women || []);
      if (swiper) womenSlider._naSwiper = swiper;
    }

    const defaultGender = (wrapper.getAttribute('data-default-gender') || 'women').toLowerCase();
    const defaultProducts = productsData[defaultGender] || [];
    const leftContainer = wrapper.querySelector('.left-product-container');
    const card = wrapper.querySelector('.product-info-card');
    if (defaultProducts.length > 0) {
      syncCardFromSlider(wrapper, defaultProducts, defaultGender, 0, leftContainer, card);
    }

    const keydownHandler = (e) => onSectionKeydown(e, wrapper, sectionEl);
    wrapper._naKeydown = keydownHandler;
    wrapper.addEventListener('keydown', keydownHandler);

    wrapper.addEventListener('click', function (e) {
      var btn = e.target.closest('.add-to-cart-btn');
      if (!btn || btn.disabled) return;
      var variantId = btn.getAttribute('data-variant-id');
      if (variantId) addToCartAndOpenDrawer(variantId);
    });
  }

  function init() {
    if (typeof window.Swiper === 'undefined') {
      setTimeout(init, 50);
      return;
    }
    document.querySelectorAll(SECTION_SELECTOR).forEach((wrapper) => {
      const section = wrapper.querySelector('.new-arrivals-section-2');
      if (section) initSection(section);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('shopify:section:load', function (e) {
    var target = e.target;
    var wrapper = (target && target.nodeType === 1 && target.classList && target.classList.contains('new-arrivals-section2-wrapper'))
      ? target
      : (target && target.nodeType === 1 && target.closest ? target.closest(SECTION_SELECTOR) : null);
    if (!wrapper) return;
    if (typeof window.Swiper === 'undefined') return;
    var section = wrapper.querySelector('.new-arrivals-section-2');
    if (section) initSection(section);
  });
})();
