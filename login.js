/* =========================================================
   Instant Cab — login / signup behavior
   Client-side only: validates input and simulates an auth
   call, since there is no backend here. Swap simulateAuth()
   for a real fetch() call to your API when one exists.
   ========================================================= */

(function () {
  "use strict";

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var PHONE_RE = /^[6-9]\d{9}$/;

  document.addEventListener("DOMContentLoaded", function () {
    var tabs = document.querySelectorAll(".auth-tab, [data-tab].link-btn");
    var loginForm = document.getElementById("loginForm");
    var signupForm = document.getElementById("signupForm");
    var status = document.getElementById("authStatus");

    if (!loginForm && !signupForm) return; // not the auth page

    /* ---------- tab switching ---------- */
    function showTab(name) {
      document.querySelectorAll(".auth-tab").forEach(function (t) {
        t.classList.toggle("active", t.getAttribute("data-tab") === name);
      });
      loginForm.classList.toggle("hidden", name !== "login");
      signupForm.classList.toggle("hidden", name !== "signup");
      setStatus("");
    }

    tabs.forEach(function (el) {
      el.addEventListener("click", function () {
        showTab(el.getAttribute("data-tab"));
      });
    });

    /* ---------- password visibility ---------- */
    function wireToggle(buttonId, inputId) {
      var btn = document.getElementById(buttonId);
      var input = document.getElementById(inputId);
      if (!btn || !input) return;
      btn.addEventListener("click", function () {
        var showing = input.type === "text";
        input.type = showing ? "password" : "text";
        btn.textContent = showing ? "👁️" : "🙈";
        btn.setAttribute("aria-label", showing ? "Show password" : "Hide password");
      });
    }
    wireToggle("toggleLoginPassword", "loginPassword");
    wireToggle("toggleSignupPassword", "signupPassword");

    /* ---------- validation helpers ---------- */
    function setFieldError(inputId, errorId, message) {
      var input = document.getElementById(inputId);
      var errorEl = document.getElementById(errorId);
      var field = input.closest(".field");
      if (message) {
        field.classList.add("invalid");
        errorEl.textContent = message;
      } else {
        field.classList.remove("invalid");
        errorEl.textContent = "";
      }
    }

    function setStatus(message, kind) {
      if (!status) return;
      status.textContent = message || "";
      status.className = "auth-status" + (kind ? " " + kind : "");
    }

    function setLoading(btn, loading, labelWhenIdle) {
      if (!btn) return;
      btn.disabled = loading;
      btn.innerHTML = loading
        ? '<span class="spinner"></span> Please wait…'
        : labelWhenIdle;
    }

    // simulates a network call; replace with a real fetch() to your auth API
    function simulateAuth() {
      return new Promise(function (resolve) {
        setTimeout(resolve, 700);
      });
    }

    /* ---------- login submit ---------- */
    if (loginForm) {
      loginForm.addEventListener("submit", function (e) {
        e.preventDefault();

        var idInput = document.getElementById("loginId");
        var passwordInput = document.getElementById("loginPassword");
        var idVal = idInput.value.trim();
        var passwordVal = passwordInput.value;
        var valid = true;

        if (!idVal) {
          setFieldError("loginId", "loginIdError", "Enter your email or mobile number.");
          valid = false;
        } else if (!EMAIL_RE.test(idVal) && !PHONE_RE.test(idVal)) {
          setFieldError("loginId", "loginIdError", "Enter a valid email or 10-digit mobile number.");
          valid = false;
        } else {
          setFieldError("loginId", "loginIdError", "");
        }

        if (!passwordVal) {
          setFieldError("loginPassword", "loginPasswordError", "Enter your password.");
          valid = false;
        } else if (passwordVal.length < 6) {
          setFieldError("loginPassword", "loginPasswordError", "Password must be at least 6 characters.");
          valid = false;
        } else {
          setFieldError("loginPassword", "loginPasswordError", "");
        }

        if (!valid) {
          setStatus("Please fix the highlighted fields.", "error");
          return;
        }

        var rememberMe = document.getElementById("rememberMe");
        var btn = document.getElementById("loginSubmitBtn");
        setLoading(btn, true);
        setStatus("");

        simulateAuth().then(function () {
          setLoading(btn, false, "Log In");
          try {
            if (rememberMe && rememberMe.checked) {
              localStorage.setItem("instantCabRememberedId", idVal);
            } else {
              localStorage.removeItem("instantCabRememberedId");
            }
          } catch (err) {}
          setStatus("Logged in! Redirecting…", "success");
          setTimeout(function () {
            window.location.href = "home.html";
          }, 600);
        });
      });

      // pre-fill remembered login id
      try {
        var remembered = localStorage.getItem("instantCabRememberedId");
        if (remembered) {
          document.getElementById("loginId").value = remembered;
          document.getElementById("rememberMe").checked = true;
        }
      } catch (err) {}
    }

    /* ---------- forgot password ---------- */
    var forgotBtn = document.getElementById("forgotPasswordBtn");
    if (forgotBtn) {
      forgotBtn.addEventListener("click", function () {
        var idInput = document.getElementById("loginId");
        var idVal = idInput.value.trim();
        if (!idVal || (!EMAIL_RE.test(idVal) && !PHONE_RE.test(idVal))) {
          setFieldError("loginId", "loginIdError", "Enter your email or mobile number first.");
          idInput.focus();
          return;
        }
        setFieldError("loginId", "loginIdError", "");
        setStatus("If an account exists for " + idVal + ", reset instructions have been sent.", "success");
      });
    }

    /* ---------- signup submit ---------- */
    if (signupForm) {
      signupForm.addEventListener("submit", function (e) {
        e.preventDefault();

        var nameVal = document.getElementById("signupName").value.trim();
        var emailVal = document.getElementById("signupEmail").value.trim();
        var phoneVal = document.getElementById("signupPhone").value.trim();
        var passwordVal = document.getElementById("signupPassword").value;
        var valid = true;

        if (!nameVal) {
          setFieldError("signupName", "signupNameError", "Enter your full name.");
          valid = false;
        } else {
          setFieldError("signupName", "signupNameError", "");
        }

        if (!emailVal || !EMAIL_RE.test(emailVal)) {
          setFieldError("signupEmail", "signupEmailError", "Enter a valid email address.");
          valid = false;
        } else {
          setFieldError("signupEmail", "signupEmailError", "");
        }

        if (!phoneVal || !PHONE_RE.test(phoneVal)) {
          setFieldError("signupPhone", "signupPhoneError", "Enter a valid 10-digit mobile number.");
          valid = false;
        } else {
          setFieldError("signupPhone", "signupPhoneError", "");
        }

        if (!passwordVal || passwordVal.length < 8) {
          setFieldError("signupPassword", "signupPasswordError", "Password must be at least 8 characters.");
          valid = false;
        } else {
          setFieldError("signupPassword", "signupPasswordError", "");
        }

        if (!valid) {
          setStatus("Please fix the highlighted fields.", "error");
          return;
        }

        var btn = document.getElementById("signupSubmitBtn");
        setLoading(btn, true);
        setStatus("");

        simulateAuth().then(function () {
          setLoading(btn, false, "Create Account");
          setStatus("Account created! Redirecting…", "success");
          setTimeout(function () {
            window.location.href = "index.html";
          }, 600);
        });
      });
    }
  });
})();
