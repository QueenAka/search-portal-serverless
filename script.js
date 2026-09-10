const main = document.querySelector("main .search");
const search = document.getElementById("search");
const resultsBox = document.getElementById("results");
let lastInp = "";
let currentIndex = -1;
let currUI = "main";
let currResults = "web";
let currQuery = "";

function searchAutocomplete(str) {
  function googleSuggestJSONP(query) {
    return new Promise((resolve, reject) => {
      const cb = "gs_cb_" + Date.now() + Math.floor(Math.random() * 1000);
      window[cb] = (data) => {
        resolve(data);
        cleanup();
      };
      const script = document.createElement("script");
      script.src = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(
        query,
      )}&callback=${cb}`;
      script.onerror = () => {
        reject(new Error("JSONP load error"));
        cleanup();
      };
      document.head.appendChild(script);

      function cleanup() {
        delete window[cb];
        script.remove();
      }
    });
  }

  googleSuggestJSONP(str).then((data) => {
    const queries = data[1];
    let autocomp = document.getElementById("autocomp");
    if (!autocomp) {
      autocomp = document.createElement("div");
      autocomp.classList.add("autocomp");
      autocomp.id = "autocomp";
    }

    autocomp.innerHTML = "";
    currentIndex = -1;

    queries.forEach((q) => {
      const qElm = document.createElement("div");
      qElm.classList.add("suggestion");
      qElm.onclick = () => {
        search.value = q;
        search.focus();
        removeAutocomplete();
      };

      const regex = new RegExp(`(${str})`, "i");
      qElm.innerHTML = q.replace(regex, "<strong><i>$1</i></strong>");
      autocomp.appendChild(qElm);
    });

    main.appendChild(autocomp);
  });
}

function updateHighlight() {
  const autocomp = document.getElementById("autocomp");
  if (!autocomp) return;

  const items = autocomp.querySelectorAll(".suggestion");
  if (!items.length) return;

  items.forEach((item, i) => {
    const isHighlighted = i === currentIndex;
    item.classList.toggle("highlighted", isHighlighted);
    if (isHighlighted) {
      item.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        behavior: "smooth",
      });
    }
  });
}

function showAutocomplete(val) {
  if (!val) {
    removeAutocomplete();
    return;
  }
  searchAutocomplete(val);
}

function removeAutocomplete() {
  const autocomp = document.getElementById("autocomp");
  if (autocomp) autocomp.remove();
  currentIndex = -1;
}

search.addEventListener("input", (e) => {
  const val = e.target.value.trim();
  if (val !== lastInp) {
    showAutocomplete(val);
    lastInp = val;
  } else {
    removeAutocomplete();
  }
});

search.addEventListener("focus", (e) => {
  const val = e.target.value.trim();
  if (val && val !== lastInp) {
    showAutocomplete(val);
    lastInp = val;
  } else if (!val) {
    removeAutocomplete();
  }
});

search.addEventListener("keydown", (e) => {
  const autocomp = document.getElementById("autocomp");
  const items = autocomp ? autocomp.querySelectorAll(".suggestion") : [];

  if (!items.length && ["ArrowDown", "ArrowUp", "Enter", "Tab"].includes(e.key))
    return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    currentIndex = Math.min(currentIndex + 1, items.length - 1);
    updateHighlight();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    currentIndex = Math.max(currentIndex - 1, -1);
    updateHighlight();
  } else if (e.key === "Tab") {
    e.preventDefault();
    if (items[0]) {
      search.value = items[0].innerText;
      showAutocomplete(search.value);
      currentIndex = -1;
    }
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (currentIndex >= 0 && items[currentIndex]) {
      search.value = items[currentIndex].innerText;
      removeAutocomplete();
      currentIndex = -1;
    } else if (search.value) {
      removeAutocomplete();
      searchFor(search.value);
    }
  } else if (e.key === "Escape") {
    removeAutocomplete();
  }
});

document.addEventListener("click", (e) => {
  const autocomp = document.getElementById("autocomp");
  if (!autocomp) return;

  const clickedInsideSearch = search.contains(e.target);
  const clickedInsideAutocomp = autocomp.contains(e.target);

  if (!clickedInsideSearch && !clickedInsideAutocomp) {
    removeAutocomplete();
  }
});

async function searchFor(query, type = "web") {
  if (!["web", "images"].includes(type) || !query) return [];
  const q = encodeURIComponent(query);
  const endpoint =
    type === "web"
      ? "https://google.com/search?q="
      : "https://google.com/search?tbm=isch&q=";
  window.location.href = endpoint + q;
}
