document.addEventListener("DOMContentLoaded", () => {
  /* ---------------- GLOBAL STATE ---------------- */
  let allProducts = [];
  let selectedProducts = [];
  let chatHistory = [];

  /* ---------------- DOM REFERENCES ---------------- */
  const categoryFilter = document.getElementById("categoryFilter");
  const productsContainer = document.getElementById("product-grid");
  const selectedContainer = document.getElementById("selected-products");
  const chatForm = document.getElementById("chatForm");
  const chatWindow = document.getElementById("chat-box");
  const generateBtn = document.getElementById("generate-btn");

  console.log("categoryFilter:", document.getElementById("categoryFilter"));

  if (!chatForm || !generateBtn || !productsContainer || !chatWindow) {
    console.error("Missing elements:", {
      chatForm,
      generateBtn,
      productsContainer,
      chatWindow,
    });
    return;
  }

  /* ---------------- SAFETY CHECK ---------------- */
  if (!generateBtn || !productsContainer || !chatWindow) {
    console.error("Missing required DOM elements");
    return;
  }

  /* ---------------- LOAD PRODUCTS ---------------- */
  async function loadProducts() {
    try {
      const res = await fetch("products.json");
      const data = await res.json();
      allProducts = data.products;
    } catch (err) {
      console.error("Failed to load products", err);
    }
  }

  /* ---------------- DISPLAY PRODUCTS ---------------- */
  function displayProducts(products) {
    productsContainer.innerHTML = "";

    products.forEach((product) => {
      const card = document.createElement("div");
      card.className = "product-card";

      card.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <div>
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
    `;

      /* SELECT / UNSELECT */
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

      productsContainer.appendChild(card);
    });
  }

  /* ---------------- FILTER ---------------- */
  categoryFilter.addEventListener("change", () => {
    const category = categoryFilter.value;

    if (!category) {
      productsContainer.innerHTML = `
      <div class="placeholder-message">
        Select a category to view products
      </div>
    `;
      return;
    }

    const filtered = allProducts.filter((p) => p.category === category);
    displayProducts(filtered);
  });

  /* ---------------- SELECTED PRODUCTS UI ---------------- */
  function updateSelectedUI() {
    selectedContainer.innerHTML = "";

    selectedProducts.forEach((product) => {
      const div = document.createElement("div");
      div.className = "selected-item";

      div.innerHTML = `
      ${product.name}
      <button>Remove</button>
    `;

      div.querySelector("button").onclick = () => {
        selectedProducts = selectedProducts.filter(
          (p) => p.name !== product.name,
        );
        saveProducts();
        updateSelectedUI();
      };

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
    if (!text) return "No response from AI.";

    return text
      .replace(/\\n/g, "<br>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/### (.*?)/g, "<h3>$1</h3>");
  }

  /* ---------------- CHAT UI ---------------- */
  function addMessage(sender, text) {
    const msg = document.createElement("div");
    msg.className = "chat-message";

    if (sender === "AI") {
      msg.innerHTML = `<strong>AI:</strong><br>${formatAIResponse(text)}`;
    } else {
      msg.innerHTML = `<strong>You:</strong> ${text}`;
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

    addMessage("AI", "Generating your routine...");

    try {
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
    } catch (err) {
      console.error(err);
      addMessage("AI", "Something went wrong. Please try again.");
    }
  });

  /* ---------------- CHAT SUBMIT ---------------- */
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const input = document.getElementById("chat-input");
    const text = input.value;

    addMessage("You", text);

    chatHistory.push({
      role: "user",
      content: text,
    });

    try {
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
    } catch (err) {
      console.error(err);
      addMessage("AI", "Error connecting to AI.");
    }

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
});
