/* =========================================================
   Instant Cab — shared behavior
   Runs on every page. Each block checks for its elements
   before wiring up, since booking/modal markup only lives
   on index.html.
   ========================================================= */

(function () {
  "use strict";

  var STORAGE_KEY = "instantCabSelection";

  /* ---------- nav active state ---------- */
  function markActiveNav() {
    var path = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll("nav a").forEach(function (link) {
      var href = link.getAttribute("href");
      if (href === path || (path === "" && href === "index.html")) {
        link.classList.add("active");
      }
    });
  }

  /* ---------- cross-page navigation helpers ---------- */
  window.scrollToBooking = function () {
    var booking = document.getElementById("booking");
    if (booking) {
      booking.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.location.href = "index.html#booking";
    }
  };

  window.showOffers = function () {
    var packages = document.getElementById("packages");
    if (packages) {
      packages.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.location.href = "packages.html#packages";
    }
  };

  window.selectRoute = function (from, to, price) {
    var payload = { pickup: from, destination: to, price: price };
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch (e) {}
    if (document.getElementById("booking")) {
      applySelection(payload);
      window.scrollToBooking();
    } else {
      window.location.href = "index.html#booking";
    }
  };

  window.selectPackage = function (name) {
    var priceMap = { "Starter": 1699, "Smart Rider": 2999, "Pro Traveller": 4499 };
    var cabMap = { "Starter": "899", "Smart Rider": "1199", "Pro Traveller": "1199" };
    var payload = { packageName: name, price: priceMap[name] || null, cabPrice: cabMap[name] };
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch (e) {}
    if (document.getElementById("booking")) {
      applySelection(payload);
      window.scrollToBooking();
    } else {
      window.location.href = "index.html#booking";
    }
  };

  window.bookParcel = function () {
    if (document.getElementById("booking")) {
      window.scrollToBooking();
    } else {
      window.location.href = "index.html#booking";
    }
  };

  function applySelection(payload) {
    var pickup = document.getElementById("pickup");
    var destination = document.getElementById("destination");
    var fare = document.getElementById("fare");

    if (payload.pickup && pickup) pickup.value = payload.pickup;
    if (payload.destination && destination) destination.value = payload.destination;

    if (payload.cabPrice) {
      var target = document.querySelector('.cab-card[data-price="' + payload.cabPrice + '"]');
      if (target) selectCabCard(target);
    }
    if (payload.price && fare) {
      fare.textContent = "₹" + payload.price.toLocaleString("en-IN");
    }
  }

  /* ---------- booking page behavior ---------- */
  function initBookingPage() {
    var rideOptions = document.querySelectorAll(".ride-option");
    var returnBox = document.getElementById("returnDateBox");
    var cabCards = document.querySelectorAll(".cab-card");
    var fare = document.getElementById("fare");
    var searchBtn = document.getElementById("searchRideBtn");
    var modal = document.getElementById("bookingModal");
    var bookingMessage = document.getElementById("bookingMessage");

    if (!rideOptions.length && !cabCards.length) return; // not the booking page

    var currentRideType = "oneway";

    function recomputeFare() {
      var selected = document.querySelector(".cab-card.selected");
      if (!selected || !fare) return;
      var base = parseInt(selected.getAttribute("data-price"), 10) || 0;
      var total = base;
      if (currentRideType === "roundtrip") total = Math.round(base * 1.8);
      if (currentRideType === "local") total = base + 300;
      fare.textContent = "₹" + total.toLocaleString("en-IN");
    }

    rideOptions.forEach(function (btn) {
      btn.addEventListener("click", function () {
        rideOptions.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        currentRideType = btn.getAttribute("data-type");
        if (returnBox) returnBox.classList.toggle("visible", currentRideType === "roundtrip");
        recomputeFare();
      });
    });

    cabCards.forEach(function (card) {
      card.addEventListener("click", function () {
        selectCabCard(card);
        recomputeFare();
      });
    });

    if (searchBtn) {
      searchBtn.addEventListener("click", function () {
        var pickup = document.getElementById("pickup");
        var destination = document.getElementById("destination");
        var pickupVal = pickup ? pickup.value.trim() : "";
        var destVal = destination ? destination.value.trim() : "";

        if (!pickupVal || !destVal) {
          if (pickup && !pickupVal) pickup.focus();
          else if (destination) destination.focus();
          return;
        }

        if (bookingMessage) {
          var selected = document.querySelector(".cab-card.selected h3");
          var cabName = selected ? selected.textContent : "your cab";
          bookingMessage.textContent =
            cabName + " from " + pickupVal + " to " + destVal + " — fare " +
            (fare ? fare.textContent : "") + ".";
        }
        openModal();
      });
    }

    function openModal() {
      if (modal) modal.classList.add("open");
    }

    window.closeModal = function () {
      if (modal) modal.classList.remove("open");
    };

    window.confirmBooking = function () {
      window.closeModal();
    };

    // pick up a selection handed off from another page
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        applySelection(JSON.parse(raw));
        recomputeFare();
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {}
  }

  function selectCabCard(card) {
    document.querySelectorAll(".cab-card").forEach(function (c) {
      c.classList.remove("selected");
    });
    card.classList.add("selected");
  }

  document.addEventListener("DOMContentLoaded", function () {
    markActiveNav();
    initBookingPage();
  });
})();
