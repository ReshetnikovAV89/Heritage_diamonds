// ==== Preloader (min 2.5s) + Mosaic reveal if #revealGrid exists ====
(function () {
  const pre = document.getElementById('preloader');
  if (!pre) return;

  const grid = document.getElementById('revealGrid');
  const MIN_DISPLAY_TIME = 2500; // минимум 2.5 сек
  const startTime = Date.now();

  function actuallyHide() {
    if (pre.classList.contains('preloader--hide')) return;
    // если использовался класс на <html> — снимем
    document.documentElement.classList.remove('is-preloading');

    // запускаем CSS-анимацию/переход скрытия
    pre.classList.add('preloader--hide');
    pre.setAttribute('aria-hidden', 'true');

    // удаляем из DOM по завершении (и на случай, если transition не сработает)
    const remove = () => pre.remove();
    pre.addEventListener('animationend', remove, { once: true });
    pre.addEventListener('transitionend', remove, { once: true });
    setTimeout(remove, 1000); // хард-фолбэк
  }

  // ВЕТКА 1: есть сетка мозаики — строим и ждём завершения
  if (grid) {
    const rows = Number(grid.dataset.rows || 8);
    const cols = Number(grid.dataset.cols || 12);
    const total = rows * cols;
    const cellW = 100 / cols;
    const cellH = 100 / rows;

    // создаём клетки со случайным порядком появления
    const idx = Array.from({ length: total }, (_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }

    const BASE_DELAY = 30; // интервал между клетками в мс
    idx.forEach((n, order) => {
      const r = Math.floor(n / cols);
      const c = n % cols;
      const el = document.createElement('span');
      el.className = 'reveal-grid__cell';
      el.style.left = (c * cellW) + '%';
      el.style.top = (r * cellH) + '%';
      el.style.width = cellW + '%';
      el.style.height = cellH + '%';
      el.style.setProperty('--d', (order * BASE_DELAY) + 'ms');
      grid.appendChild(el);
    });

    // дождёмся окончания мозаики + минимум отображения
    const lastDelay = (total - 1) * BASE_DELAY;
    const lastDuration = 500; // .5s как в CSS
    const mosaicDoneAt = lastDelay + lastDuration;

    window.addEventListener('load', () => {
      const elapsed = Date.now() - startTime;
      const waitMin = Math.max(0, MIN_DISPLAY_TIME - elapsed);
      setTimeout(actuallyHide, Math.max(waitMin, mosaicDoneAt));
    });

    // страховка, если вдруг load не пришёл
    setTimeout(actuallyHide, MIN_DISPLAY_TIME + mosaicDoneAt + 1500);
  }
  // ВЕТКА 2: сетки нет — обычный прелоадер с минимальной задержкой
  else {
    function hideWithMinDelay() {
      const elapsed = Date.now() - startTime;
      const delay = Math.max(0, MIN_DISPLAY_TIME - elapsed);
      setTimeout(actuallyHide, delay);
    }
    window.addEventListener('load', hideWithMinDelay);
    setTimeout(actuallyHide, MIN_DISPLAY_TIME + 4000); // запасной таймер
  }
})();

/* === Модалка оплаты и видео === */
const modal = document.getElementById("modal");
const videoModal = document.getElementById("videoModal");
const testPaymentModal = document.getElementById("testPaymentModal");
const cartModal = document.getElementById("cartModal");

const openModalBtn = document.querySelector(".cover .button");
if (openModalBtn && modal) {
  openModalBtn.addEventListener("click", () => modal.showModal());
}

const videoElement = videoModal ? videoModal.querySelector("video") : null;
const videoSource = videoElement ? videoElement.querySelector("source") : null;
const lookMoreLink = document.querySelector(".lots__look-more-link");
if (lookMoreLink && videoModal && videoElement && videoSource) {
  lookMoreLink.addEventListener("click", (e) => {
    e.preventDefault();
    if (!videoSource.src) {
      videoSource.src = videoSource.dataset.src;
      videoElement.load();
    }
    lockBody();                 // фикс: не дёргать страницу при открытии
    videoModal.showModal();
    // клик по фону — закрыть
    videoModal.addEventListener('click', (ev) => {
      if (ev.target === videoModal) videoModal.close();
    }, { once: true });
    videoElement.play().catch(() => {});
  });
  videoModal.addEventListener("close", () => {
    videoElement.pause();
    videoSource.src = "";
    videoElement.load();
  });
}

/* === Корзина === */
let cart = [];
const cartItemsList = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const cartCount = document.getElementById("cartCount");

function updateCartDisplay() {
  if (!cartItemsList || !cartTotal || !cartCount) return;
  cartItemsList.innerHTML = "";
  let total = 0;
  cart.forEach((item, index) => {
    const li = document.createElement("li");
    li.textContent = `${item.product} — ${item.amount}₽`;
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.setAttribute("aria-label", `Удалить ${item.product} из корзины`);
    removeBtn.textContent = "❌";
    removeBtn.style.marginLeft = "10px";
    removeBtn.style.cursor = "pointer";
    removeBtn.addEventListener("click", () => {
      cart.splice(index, 1);
      updateCartDisplay();
    });
    li.appendChild(removeBtn);
    cartItemsList.appendChild(li);
    total += item.amount;
  });
  cartTotal.textContent = String(total);
  cartCount.textContent = String(cart.length);
}

document.querySelectorAll(".card__pay-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const product = btn.dataset.product || "Товар";
    const amount = Number(btn.dataset.amount) || 0;
    cart.push({ product, amount });
    updateCartDisplay();
    if (cartModal) cartModal.showModal();
  });
});

const headerCartButton = document.getElementById("cartButton");
if (headerCartButton && cartModal) {
  headerCartButton.addEventListener("click", () => {
    updateCartDisplay();
    cartModal.showModal();
    headerCartButton.setAttribute("aria-expanded", "true");
  });
  cartModal.addEventListener("close", () => {
    headerCartButton.setAttribute("aria-expanded", "false");
  });
}

const checkoutButton = document.getElementById("checkoutButton");
if (checkoutButton && testPaymentModal) {
  checkoutButton.addEventListener("click", () => {
    if (cart.length === 0) {
      alert("Корзина пуста!");
      return;
    }
    console.log("Тестовая оплата товаров:", cart);
    testPaymentModal.showModal();
    cart = [];
    updateCartDisplay();
  });
}

document.querySelectorAll(".button.card__pay-btn-test").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const product = btn.dataset.product || "Товар";
    const amount = Number(btn.dataset.amount) || 0;
    console.log(`Тестовая оплата: ${product} на сумму ${amount}₽`);
    testPaymentModal.showModal();
  });
});

/* === Модалки карточек «Читать более подробно» === */
(function () {
  const openButtons = document.querySelectorAll('.card__more-btn[data-modal-target]');
  openButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-modal-target');
      const dlg = document.getElementById(id);
      if (dlg && typeof dlg.showModal === 'function') dlg.showModal();
    });
  });

  document.addEventListener('click', (e) => {
    const closeBtn = e.target.closest('[data-modal-close]');
    if (!closeBtn) return;
    const dlg = closeBtn.closest('dialog');
    if (dlg) dlg.close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('dialog[open]').forEach(dlg => dlg.close());
    }
  });
})();

/* === Скролл-заголовок, заглушка href="#" === */
const h = document.querySelector('.header');
const t = () => h.classList.toggle('header--compact', scrollY > 20);
t(); addEventListener('scroll', t, { passive: true });
// 1) Глушим все href="#" (чтобы страница не улетала вверх)
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href="#"]');
  if (a) e.preventDefault();
});

// 2) Блокировка скролла боди на время модалки (и восстановление позиции)
let _scrollY = 0;
function lockBody() {
  _scrollY = window.scrollY || document.documentElement.scrollTop;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${_scrollY}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.width = '100%';
}
function unlockBody() {
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  window.scrollTo(0, _scrollY);
}

// 3) Открытие/закрытие диалогов
const dialogs = document.querySelectorAll('dialog');

document.querySelectorAll('[data-open]').forEach(btn => {
  const id = btn.dataset.open;
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const dlg = document.getElementById(id);
    if (dlg) {
      lockBody();
      dlg.showModal();
      // клик по фону — закрыть
      dlg.addEventListener('click', (ev) => {
        if (ev.target === dlg) dlg.close();
      }, { once: true });
    }
  });
});

document.querySelectorAll('[data-close-dialog]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    btn.closest('dialog')?.close();
  });
});

// при любом закрытии — возвращаем скролл
dialogs.forEach(dlg => {
  dlg.addEventListener('close', unlockBody);
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); dlg.close(); });
});

 // Открытие/закрытие модалок «Подробнее» для карточек
  (function () {
    const openButtons = document.querySelectorAll('.card__more-btn[data-modal-target]');
    openButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.getAttribute('data-modal-target');
        const dlg = document.getElementById(id);
        if (dlg && typeof dlg.showModal === 'function') {
          // фикс: блокируем скролл документа и запоминаем позицию
          lockBody();
          dlg.showModal();
          // клик по фону — закрыть
          dlg.addEventListener('click', (ev) => {
            if (ev.target === dlg) dlg.close();
          }, { once: true });
        }
      });
    });

    document.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('[data-modal-close]');
      if (!closeBtn) return;
      const dlg = closeBtn.closest('dialog');
      if (dlg) dlg.close();
    });

    // Закрытие по ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('dialog[open]').forEach(dlg => dlg.close());
      }
    });
  })();