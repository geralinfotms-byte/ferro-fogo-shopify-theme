/* ============================================
   FERRO & FOGO - TEMA SHOPIFY - JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Mobile Menu Toggle
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  
  if (mobileMenuToggle && mobileMenu) {
    mobileMenuToggle.addEventListener('click', function() {
      mobileMenu.classList.toggle('active');
      const isOpen = mobileMenu.classList.contains('active');
      this.setAttribute('aria-expanded', isOpen);
      
      // Update icon
      const icon = this.querySelector('svg');
      if (icon) {
        icon.setAttribute('data-lucide', isOpen ? 'x' : 'menu');
        lucide.createIcons();
      }
    });
  }

  // Cart Drawer
  const cartDrawer = document.getElementById('cart-drawer');
  const cartDrawerTriggers = document.querySelectorAll('[data-cart-drawer-trigger]');
  const cartDrawerClose = document.querySelector('.cart-drawer__close');
  const cartDrawerOverlay = document.querySelector('.cart-drawer__overlay');

  function openCartDrawer() {
    if (cartDrawer) {
      cartDrawer.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeCartDrawer() {
    if (cartDrawer) {
      cartDrawer.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  cartDrawerTriggers.forEach(trigger => {
    trigger.addEventListener('click', function(e) {
      e.preventDefault();
      openCartDrawer();
      updateCartDrawer();
    });
  });

  if (cartDrawerClose) {
    cartDrawerClose.addEventListener('click', closeCartDrawer);
  }

  if (cartDrawerOverlay) {
    cartDrawerOverlay.addEventListener('click', closeCartDrawer);
  }

  // Close cart drawer on escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && cartDrawer && cartDrawer.classList.contains('active')) {
      closeCartDrawer();
    }
  });

  // Add to Cart
  const addToCartForms = document.querySelectorAll('form[action="/cart/add"]');
  
  addToCartForms.forEach(form => {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const submitButton = form.querySelector('button[type="submit"]');
      const originalText = submitButton.textContent;
      submitButton.textContent = 'Adicionando...';
      submitButton.disabled = true;

      try {
        const formData = new FormData(form);
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          await updateCartCount();
          openCartDrawer();
          await updateCartDrawer();
          showNotification('Produto adicionado ao carrinho!', 'success');
        } else {
          const error = await response.json();
          showNotification(error.description || 'Erro ao adicionar produto', 'error');
        }
      } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Erro ao adicionar produto', 'error');
      } finally {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
      }
    });
  });

  // Quick Add to Cart
  document.addEventListener('click', async function(e) {
    const quickAddBtn = e.target.closest('[data-quick-add]');
    if (!quickAddBtn) return;

    e.preventDefault();
    const variantId = quickAddBtn.dataset.variantId;
    const originalText = quickAddBtn.textContent;
    quickAddBtn.textContent = 'Adicionando...';
    quickAddBtn.disabled = true;

    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: variantId,
          quantity: 1
        })
      });

      if (response.ok) {
        await updateCartCount();
        openCartDrawer();
        await updateCartDrawer();
        showNotification('Produto adicionado ao carrinho!', 'success');
      } else {
        const error = await response.json();
        showNotification(error.description || 'Erro ao adicionar produto', 'error');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      showNotification('Erro ao adicionar produto', 'error');
    } finally {
      quickAddBtn.textContent = originalText;
      quickAddBtn.disabled = false;
    }
  });

  // Update Cart Count
  async function updateCartCount() {
    try {
      const response = await fetch('/cart.js');
      const cart = await response.json();
      const cartCountElements = document.querySelectorAll('.cart-count');
      
      cartCountElements.forEach(el => {
        el.textContent = cart.item_count;
        el.style.display = cart.item_count > 0 ? 'flex' : 'none';
      });
    } catch (error) {
      console.error('Error updating cart count:', error);
    }
  }

  // Update Cart Drawer Content
  async function updateCartDrawer() {
    const cartDrawerBody = document.getElementById('cart-drawer-body');
    const cartDrawerTotal = document.getElementById('cart-drawer-total');
    
    if (!cartDrawerBody) return;

    try {
      const response = await fetch('/cart.js');
      const cart = await response.json();

      if (cart.item_count === 0) {
        cartDrawerBody.innerHTML = `
          <div class="cart-page__empty">
            <i data-lucide="shopping-cart"></i>
            <p>Seu carrinho está vazio</p>
            <a href="/collections/all" class="btn-primary">Ver Produtos</a>
          </div>
        `;
      } else {
        let itemsHtml = '';
        
        cart.items.forEach(item => {
          itemsHtml += `
            <div class="cart-item" data-line-key="${item.key}">
              <img src="${item.image || '/no-image.png'}" alt="${item.title}" class="cart-item__image">
              <div class="cart-item__content">
                <h4 class="cart-item__title">${item.product_title}</h4>
                <span class="cart-item__sku">${item.sku || ''}</span>
                <div class="cart-item__footer">
                  <div class="quantity-selector">
                    <button type="button" class="quantity-selector__btn" data-change-qty data-line="${item.key}" data-qty="${item.quantity - 1}">
                      <i data-lucide="minus" style="width: 16px; height: 16px;"></i>
                    </button>
                    <input type="text" value="${item.quantity}" class="quantity-selector__input" readonly>
                    <button type="button" class="quantity-selector__btn" data-change-qty data-line="${item.key}" data-qty="${item.quantity + 1}">
                      <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
                    </button>
                  </div>
                  <span class="cart-item__price">${formatMoney(item.line_price)}</span>
                </div>
              </div>
              <button class="cart-item__remove" data-remove-item data-line="${item.key}" aria-label="Remover item">
                <i data-lucide="trash-2" style="width: 20px; height: 20px;"></i>
              </button>
            </div>
          `;
        });

        cartDrawerBody.innerHTML = itemsHtml;
      }

      if (cartDrawerTotal) {
        cartDrawerTotal.textContent = formatMoney(cart.total_price);
      }

      // Re-initialize Lucide icons
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    } catch (error) {
      console.error('Error updating cart drawer:', error);
    }
  }

  // Change Quantity in Cart
  document.addEventListener('click', async function(e) {
    const changeQtyBtn = e.target.closest('[data-change-qty]');
    if (!changeQtyBtn) return;

    const lineKey = changeQtyBtn.dataset.line;
    const newQty = parseInt(changeQtyBtn.dataset.qty);

    try {
      const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: lineKey,
          quantity: newQty
        })
      });

      if (response.ok) {
        await updateCartCount();
        await updateCartDrawer();
      }
    } catch (error) {
      console.error('Error changing quantity:', error);
    }
  });

  // Remove Item from Cart
  document.addEventListener('click', async function(e) {
    const removeBtn = e.target.closest('[data-remove-item]');
    if (!removeBtn) return;

    const lineKey = removeBtn.dataset.line;

    try {
      const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: lineKey,
          quantity: 0
        })
      });

      if (response.ok) {
        await updateCartCount();
        await updateCartDrawer();
        showNotification('Item removido do carrinho', 'success');
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  });

  // Quantity Selector on Product Page
  const quantitySelectors = document.querySelectorAll('.quantity-selector:not([data-cart])');
  
  quantitySelectors.forEach(selector => {
    const input = selector.querySelector('.quantity-selector__input');
    const decreaseBtn = selector.querySelector('[data-decrease]');
    const increaseBtn = selector.querySelector('[data-increase]');
    const maxQty = parseInt(input?.dataset.max) || 999;

    if (decreaseBtn) {
      decreaseBtn.addEventListener('click', function() {
        const currentValue = parseInt(input.value) || 1;
        if (currentValue > 1) {
          input.value = currentValue - 1;
        }
      });
    }

    if (increaseBtn) {
      increaseBtn.addEventListener('click', function() {
        const currentValue = parseInt(input.value) || 1;
        if (currentValue < maxQty) {
          input.value = currentValue + 1;
        }
      });
    }
  });

  // Format Money Helper
  function formatMoney(cents) {
    const value = (cents / 100).toFixed(2);
    return 'R$ ' + value.replace('.', ',');
  }

  // Notification System
  function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.innerHTML = `
      <span>${message}</span>
      <button class="notification__close" aria-label="Fechar">
        <i data-lucide="x" style="width: 16px; height: 16px;"></i>
      </button>
    `;

    // Styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#374151'};
      color: white;
      font-family: var(--font-body);
      font-weight: 500;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Re-initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    // Close button
    notification.querySelector('.notification__close').addEventListener('click', function() {
      notification.remove();
    });

    // Auto remove after 4 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
      }
    }, 4000);
  }

  // Add animation keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

  // Search Form
  const searchForms = document.querySelectorAll('.header__search form');
  searchForms.forEach(form => {
    form.addEventListener('submit', function(e) {
      const input = form.querySelector('input[type="search"], input[type="text"]');
      if (input && !input.value.trim()) {
        e.preventDefault();
      }
    });
  });

  // Lazy Load Images
  if ('IntersectionObserver' in window) {
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    });

    lazyImages.forEach(img => imageObserver.observe(img));
  }

  // Initialize cart count on page load
  updateCartCount();
});
