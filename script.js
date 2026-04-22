/* ---------------- GLOBAL STATE ---------------- */
let allProducts = [];
let selectedProducts = [];
let chatHistory = [];

/* ---------------- DOM REFERENCES ---------------- */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const selectedContainer = document.getElementById("selectedProductsList");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const generateBtn = document.getElementById("generateRoutine");

/* ---------------- LOAD PRODUCTS ---------------- */
async function loadProducts() {
  const res = await fetch("products.json");
  const data = await res.json();
  allProducts = data.products;
}

/* ---------------- DISPLAY PRODUCTS ---------------- */
function displayProducts(products) {
  productsContainer.innerHTML = "";

  products.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p>${product.brand}</p>
    `;

    card.addEventListener("click", () => {
      const exists = selectedProducts.find((p) => p.name === product.name);

      if (exists) {
        selectedProducts = selectedProducts.filter(
          (p) => p.name !== product.name,
        );
        card.classList.remove("selected");
      } else {
        selectedProducts.push(product);
        card.classList.add("selected");
      }

      saveProducts();
      updateSelectedUI();
    });

    /* DESCRIPTION ON HOVER */
    const desc = document.createElement("p");
    desc.innerText = product.description;
    desc.style.display = "none";

    card.appendChild(desc);

    card.onmouseenter = () => (desc.style.display = "block");
    card.onmouseleave = () => (desc.style.display = "none");

    productsContainer.appendChild(card);
  });
}

/* ---------------- FILTER ---------------- */
categoryFilter.addEventListener("change", () => {
  const category = categoryFilter.value;
  const filtered = allProducts.filter((p) => p.category === category);
  displayProducts(filtered);
});

/* ---------------- SELECTED PRODUCTS UI ---------------- */
function updateSelectedUI() {
  selectedContainer.innerHTML = "";

  selectedProducts.forEach((product) => {
    const div = document.createElement("div");
    div.className = "selected-item";

    div.innerText = product.name;

    const btn = document.createElement("button");
    btn.innerText = "Remove";

    btn.onclick = () => {
      selectedProducts = selectedProducts.filter(
        (p) => p.name !== product.name,
      );
      saveProducts();
      updateSelectedUI();
    };

    div.appendChild(btn);
    selectedContainer.appendChild(div);
  });
}

/* ---------------- LOCAL STORAGE ---------------- */
function saveProducts() {
  localStorage.setItem("products", JSON.stringify(selectedProducts));
}

function loadSavedProducts() {
  const saved = JSON.parse(localStorage.getItem("products"));
  if (saved) {
    selectedProducts = saved;
    updateSelectedUI();
  }
}

/* ---------------- FORMAT AI RESPONSE ---------------- */
function formatAIResponse(text) {
  return text
    .replace(/### (.*?)/g, "<h3>$1</h3>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}

/* ---------------- CHAT UI ---------------- */
function addMessage(sender, text) {
  const msg = document.createElement("div");
  msg.classList.add("chat-message");

  if (sender === "AI") {
    msg.innerHTML = `<strong>${sender}:</strong> ${formatAIResponse(text)}`;
  } else {
    msg.innerText = `${sender}: ${text}`;
  }

  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* ---------------- GENERATE ROUTINE ---------------- */
generateBtn.addEventListener("click", async () => {
  if (selectedProducts.length === 0) {
    alert("Select products first");
    return;
  }

  const res = await fetch(
    "https://restless-sea-2426.cgoyal6-910.workers.dev/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        products: selectedProducts,
        history: chatHistory,
      }),
    },
  );

  const data = await res.json();

  chatHistory.push({
    role: "assistant",
    content: data.reply,
  });

  addMessage("AI", data.reply);
});

/* ---------------- CHAT SUBMIT ---------------- */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const input = document.getElementById("userInput");
  const text = input.value;

  addMessage("You", text);

  chatHistory.push({
    role: "user",
    content: text,
  });

  const res = await fetch(
    "https://restless-sea-2426.cgoyal6-910.workers.dev/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: text,
        history: chatHistory,
      }),
    },
  );

  const data = await res.json();

  chatHistory.push({
    role: "assistant",
    content: data.reply,
  });

  addMessage("AI", data.reply);

  input.value = "";
});

/* ---------------- INIT ---------------- */
async function init() {
  await loadProducts();

  productsContainer.innerHTML = `
    <div class="placeholder-message">
      Select a category to view products
    </div>
  `;

  loadSavedProducts();
}

init();
