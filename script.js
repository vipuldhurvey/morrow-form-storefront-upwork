const products = [
  { id: "mug", name: "Sunday Stoneware Mug", category: "Ceramics", price: 32, thumb: "mini-mug" },
  { id: "basket", name: "Gather Woven Basket", category: "Storage", price: 58, thumb: "mini-basket" },
  { id: "throw", name: "Soft Morning Throw", category: "Textiles", price: 86, thumb: "mini-textile" },
  { id: "lamp", name: "Little Hour Table Lamp", category: "Lighting", price: 118, thumb: "mini-lamp" },
  { id: "bowl", name: "Daybreak Serving Bowl", category: "Ceramics", price: 64, thumb: "mini-bowl" },
  { id: "cushion", name: "Everywhere Cushion", category: "Textiles", price: 48, thumb: "mini-textile" }
];

const grid = document.querySelector("#product-grid");
const search = document.querySelector("#product-search");
const sort = document.querySelector("#sort-products");
const categoryButtons = [...document.querySelectorAll(".category-button")];
const dialog = document.querySelector("#cart-dialog");
const cartItems = document.querySelector("#cart-items");
const emptyCart = document.querySelector("#cart-empty");
const toast = document.querySelector("#toast");
const cartStorageKey = "morrow-form-demo-cart";
let category = "all";
let toastTimer;

function readCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(cartStorageKey) || "{}");
    return Object.fromEntries(Object.entries(saved).filter(([id, qty]) =>
      products.some((product) => product.id === id) && Number.isInteger(qty) && qty > 0
    ));
  } catch {
    return {};
  }
}

let cart = readCart();

function money(amount) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

function saveCart() {
  try {
    localStorage.setItem(cartStorageKey, JSON.stringify(cart));
  } catch {
    // The cart remains usable for this page view if browser storage is unavailable.
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function renderProducts() {
  const query = search.value.trim().toLowerCase();
  const order = [...products];

  if (sort.value === "price-low") order.sort((a, b) => a.price - b.price);
  if (sort.value === "price-high") order.sort((a, b) => b.price - a.price);
  if (sort.value === "name") order.sort((a, b) => a.name.localeCompare(b.name));

  for (const product of order) {
    const card = grid.querySelector(`[data-product="${product.id}"]`);
    const cardText = `${product.name} ${product.category}`.toLowerCase();
    card.hidden = !(category === "all" || product.category === category) || !cardText.includes(query);
    grid.append(card);
  }

  document.querySelector("#no-products").hidden = [...grid.children].some((card) => !card.hidden);
}

function renderCart() {
  const entries = products.filter((product) => cart[product.id]);
  const count = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const subtotal = entries.reduce((sum, product) => sum + product.price * cart[product.id], 0);

  document.querySelector("#cart-count").textContent = count;
  document.querySelector("#dialog-cart-count").textContent = count;
  document.querySelector("#cart-subtotal").textContent = money(subtotal);
  emptyCart.hidden = entries.length > 0;
  document.querySelector("#checkout").disabled = entries.length === 0;

  cartItems.replaceChildren(...entries.map((product) => {
    const line = document.createElement("article");
    line.className = "cart-line";
    line.innerHTML = `
      <div class="cart-thumb" aria-hidden="true"><span class="${product.thumb}"></span></div>
      <div class="cart-line-main">
        <strong>${product.name}</strong>
        <small>${product.category} · ${money(product.price)} each</small>
        <div class="quantity-controls" aria-label="Quantity controls for ${product.name}">
          <button type="button" data-quantity="${product.id}" data-change="-1" aria-label="Decrease ${product.name} quantity">−</button>
          <span>${cart[product.id]}</span>
          <button type="button" data-quantity="${product.id}" data-change="1" aria-label="Increase ${product.name} quantity">+</button>
        </div>
      </div>
      <div class="cart-line-end"><b>${money(product.price * cart[product.id])}</b><button class="remove-item" type="button" data-remove="${product.id}">Remove</button></div>`;
    return line;
  }));
}

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    category = button.dataset.category;
    categoryButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    renderProducts();
  });
});

search.addEventListener("input", renderProducts);
sort.addEventListener("change", renderProducts);

grid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add]");
  if (!button) return;
  const product = products.find((item) => item.id === button.dataset.add);
  cart[product.id] = (cart[product.id] || 0) + 1;
  saveCart();
  renderCart();
  showToast(`${product.name} added to your bag`);
});

cartItems.addEventListener("click", (event) => {
  const quantityButton = event.target.closest("[data-quantity]");
  const removeButton = event.target.closest("[data-remove]");

  if (quantityButton) {
    const id = quantityButton.dataset.quantity;
    cart[id] += Number(quantityButton.dataset.change);
    if (cart[id] <= 0) delete cart[id];
  } else if (removeButton) {
    delete cart[removeButton.dataset.remove];
  } else {
    return;
  }

  saveCart();
  renderCart();
});

document.querySelector("#open-cart").addEventListener("click", () => dialog.showModal());
document.querySelector("#close-cart").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});
document.querySelector("#checkout").addEventListener("click", () => {
  document.querySelector("#checkout-note").textContent = "Portfolio demo only — checkout and payment are not connected.";
});

document.querySelector("#year").textContent = new Date().getFullYear();
renderProducts();
renderCart();
