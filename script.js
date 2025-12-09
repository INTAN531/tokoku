/* Loopline script: slider, products, cart, WA order */
const WA_NUMBER = "62812XXXXXXXX"; // <-- ganti nomor WhatsApp (contoh: 62812...)
const IMAGES_PREFIX = "images/";

/* Product data */
const products = [
  { id: "pearly", title: "Pearly Glow Belt", price: 115000, img: `${IMAGES_PREFIX}pearly.jpg`, desc: "Sabuk mutiara aksen, cocok untuk dress." },
  { id: "heart", title: "Sweet Heart Belt", price: 75000, img: `${IMAGES_PREFIX}heart.jpg`, desc: "Sabuk hitam dengan buckle berbentuk hati." },
  { id: "tan", title: "Tan Vintage Belt", price: 89000, img: `${IMAGES_PREFIX}tan.jpg`, desc: "Sabuk kulit warna tan, vintage look." },
  { id: "trooper", title: "Trooper Strap Belt", price: 65000, img: `${IMAGES_PREFIX}trooper.jpg`, desc: "Sabuk canvas tactical, kuat dan casual." },
  // bisa tambah lagi di sini
];

/* cart persistence */
let cart = JSON.parse(localStorage.getItem("loopline_cart") || "[]");

/* utils */
const qs = sel => document.querySelector(sel);
const qsa = sel => document.querySelectorAll(sel);
const formatRp = num => "Rp " + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/* RENDER PRODUCTS (used on home preview + products page) */
function renderProductsGrid(containerId = "#product-grid", list = products, limit = null) {
  const grid = qs(containerId);
  if(!grid) return;
  grid.innerHTML = "";
  const items = limit ? list.slice(0, limit) : list;
  items.forEach(p => {
    const el = document.createElement("div");
    el.className = "product-card";
    el.innerHTML = `
      <img src="${p.img}" alt="${p.title}" />
      <h3 id="${p.id}">${p.title}</h3>
      <p class="muted small">${p.desc}</p>
      <div class="price">${formatRp(p.price)}</div>
      <div style="display:flex;gap:10px;margin-top:12px">
        <button class="btn add-cart" data-id="${p.id}">Tambah</button>
        <button class="btn btn-ghost view-detail" data-id="${p.id}">Detail</button>
      </div>
    `;
    grid.appendChild(el);
  });
}

/* CART FUNCTIONS */
function saveCart(){ localStorage.setItem("loopline_cart", JSON.stringify(cart)); }
function cartCount(){ return cart.reduce((s,i)=>s+i.qty,0); }
function cartSubtotal(){ return cart.reduce((s,i)=>s+i.qty*i.price,0); }

function updateCartUI(){
  const countEls = qsa("#cart-count, #cart-count-2");
  countEls.forEach(el=>el.textContent = cartCount());
  const subtotalEls = qsa("#cart-subtotal");
  subtotalEls.forEach(el=> el.textContent = formatRp(cartSubtotal()));
  renderCartItems();
  renderHomePreview();
}

/* render cart drawer items */
function renderCartItems(){
  const container = qs("#cart-items");
  if(!container) return;
  container.innerHTML = "";
  if(cart.length === 0){
    container.innerHTML = `<div style="padding:12px;color:#666">Keranjang kosong.</div>`;
    return;
  }
  cart.forEach(item=>{
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <img src="${item.img}" alt="${item.title}" />
      <div class="item-info">
        <div style="font-weight:700">${item.title}</div>
        <div style="color:#888">${formatRp(item.price)}</div>
        <div class="qty-controls">
          <button class="qty-decr" data-id="${item.id}">-</button>
          <div style="min-width:30px;text-align:center">${item.qty}</div>
          <button class="qty-incr" data-id="${item.id}">+</button>
          <button class="remove-item" data-id="${item.id}" style="margin-left:8px;color:#c33">Hapus</button>
        </div>
      </div>
    `;
    container.appendChild(row);
  });
}

/* add to cart */
function addToCart(id, qty=1){
  const prod = products.find(p=>p.id===id);
  if(!prod) return;
  const found = cart.find(i=>i.id===id);
  if(found) found.qty += qty;
  else cart.push({ id: prod.id, title: prod.title, price: prod.price, img: prod.img, qty });
  saveCart();
  updateCartUI();
  openCart();
}

/* change qty / remove */
function changeQty(id, delta){
  const i = cart.findIndex(x=>x.id===id);
  if(i===-1) return;
  cart[i].qty += delta;
  if(cart[i].qty <= 0) cart.splice(i,1);
  saveCart();
  updateCartUI();
}
function removeItem(id){
  cart = cart.filter(x=>x.id!==id);
  saveCart();
  updateCartUI();
}

/* drawer open/close */
function openCart(){ qs("#cart-drawer")?.classList.add("open"); }
function closeCart(){ qs("#cart-drawer")?.classList.remove("open"); }

/* build WA message */
function buildWAOrderMessage(name = "", address = ""){
  if(cart.length === 0) return "";
  let msg = `Halo Loopline,%0ASaya ingin order:%0A`;
  cart.forEach(i => {
    msg += `- ${i.title} x ${i.qty} = ${i.price*i.qty}%0A`;
  });
  msg += `%0ATotal: ${cartSubtotal()}%0A`;
  if(name) msg += `%0ANama: ${encodeURIComponent(name)}%0A`;
  if(address) msg += `%0AAlamat: ${encodeURIComponent(address)}%0A`;
  msg += `%0AThanks`;
  return msg;
}

/* HOME preview (few products) */
function renderHomePreview(){
  renderProductsGrid("#home-product-grid", products, 4);
}

/* SLIDER logic */
function initSlider(){
  const slides = Array.from(qsa(".slide"));
  if(slides.length === 0) return;
  let idx = 0;
  const dots = qs("#dots");
  slides.forEach((s,i)=>{
    const b = document.createElement("button");
    if(i===0) b.classList.add("active");
    b.addEventListener("click", ()=> goTo(i));
    dots.appendChild(b);
  });
  function goTo(i){
    slides[idx].classList.remove("active");
    qsAllDots()[idx]?.classList.remove("active");
    idx = i;
    slides[idx].classList.add("active");
    qsAllDots()[idx]?.classList.add("active");
  }
  function qsAllDots(){ return Array.from(qsa("#dots button")); }
  qs("#next-slide")?.addEventListener("click", ()=> goTo((idx+1)%slides.length));
  qs("#prev-slide")?.addEventListener("click", ()=> goTo((idx-1+slides.length)%slides.length));
  // auto rotate
  setInterval(()=> goTo((idx+1)%slides.length), 6000);
}

/* init global events */
function initEvents(){
  // product buttons, cart operations via delegation
  document.body.addEventListener("click", e=>{
    if(e.target.matches(".add-cart")) addToCart(e.target.dataset.id);
    else if(e.target.matches(".view-detail")) {
      const id = e.target.dataset.id;
      const p = products.find(x=>x.id===id);
      if(p) alert(`${p.title}\n\n${p.desc}\n\nHarga: ${formatRp(p.price)}`);
    } else if(e.target.matches("#open-cart") || e.target.matches("#open-cart-2")) openCart();
    else if(e.target.matches("#close-cart")) closeCart();
    else if(e.target.matches(".qty-incr")) changeQty(e.target.dataset.id, 1);
    else if(e.target.matches(".qty-decr")) changeQty(e.target.dataset.id, -1);
    else if(e.target.matches(".remove-item")) removeItem(e.target.dataset.id);
    else if(e.target.matches("#checkout-whatsapp")) {
      const msg = buildWAOrderMessage();
      if(!msg){ alert("Keranjang kosong."); return; }
      window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
    } else if(e.target.matches(".hamburger")) {
      qs(".nav-links").classList.toggle("open");
    }
  });

  // search input (if present)
  const s = qs("#search");
  if(s) s.addEventListener("input", ev=>{
    const q = ev.target.value.trim().toLowerCase();
    const filtered = products.filter(p=> p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
    renderProductsGrid("#product-grid", filtered);
  });

  // multiple hamburger instances
  qsa(".hamburger").forEach(btn=>{
    btn.addEventListener("click", ()=> {
      const nav = btn.parentElement.querySelector(".nav-links");
      nav.classList.toggle("open");
    });
  });

}

/* init */
function init(){
  renderHomePreview();
  renderProductsGrid("#product-grid", products); // for pages with that id
  initSlider();
  initEvents();
  updateCartUI();
}
init();
