/**
 * Dzintars — клиент для backend API (Cloudflare Worker).
 * Подключается на всех страницах через <script src="dz-api.js">.
 *
 * Хранит токен авторизации в localStorage и даёт простые функции для
 * регистрации, входа, выхода и получения текущего пользователя.
 *
 * ВАЖНО: после деплоя своего Worker'а замени API_BASE_URL ниже на реальный
 * адрес (его покажет команда `wrangler deploy` — что-то вроде
 * "https://dzintars-api.<твой-сабдомен>.workers.dev").
 */

(function () {
  "use strict";

  var API_BASE_URL = "https://dzintars-api.YOUR-SUBDOMAIN.workers.dev";

  var TOKEN_KEY = "dz_token";
  var USER_KEY = "dz_user";

  // ---------------------------------------------------------------------
  // Хранилище токена/пользователя
  // ---------------------------------------------------------------------

  function getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (e) {
      return null;
    }
  }

  function setToken(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (e) { /* storage unavailable */ }
  }

  function clearToken() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) { /* storage unavailable */ }
  }

  function getCachedUser() {
    try {
      var raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setCachedUser(user) {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) { /* storage unavailable */ }
  }

  function isLoggedIn() {
    return !!getToken();
  }

  // ---------------------------------------------------------------------
  // Низкоуровневый запрос к API
  // ---------------------------------------------------------------------

  function request(path, options) {
    options = options || {};
    var headers = Object.assign(
      { "Content-Type": "application/json" },
      options.headers || {}
    );

    var token = getToken();
    if (token) {
      headers["Authorization"] = "Bearer " + token;
    }

    return fetch(API_BASE_URL + path, {
      method: options.method || "GET",
      headers: headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok) {
            var err = new Error(data.error || "request_failed");
            err.code = data.error || "request_failed";
            err.status = res.status;
            throw err;
          }
          return data;
        });
      });
  }

  // ---------------------------------------------------------------------
  // Публичные методы
  // ---------------------------------------------------------------------

  function register(login, password) {
    return request("/api/register", {
      method: "POST",
      body: { login: login, password: password },
    }).then(function (data) {
      setToken(data.token);
      setCachedUser(data.user);
      return data.user;
    });
  }

  function login(loginValue, password) {
    return request("/api/login", {
      method: "POST",
      body: { login: loginValue, password: password },
    }).then(function (data) {
      setToken(data.token);
      setCachedUser(data.user);
      return data.user;
    });
  }

  function logout() {
    return request("/api/logout", { method: "POST" })
      .catch(function () { /* даже если запрос не прошёл, чистим локально */ })
      .then(function () {
        clearToken();
      });
  }

  function fetchMe() {
    if (!isLoggedIn()) return Promise.resolve(null);
    return request("/api/me")
      .then(function (data) {
        setCachedUser(data.user);
        return data.user;
      })
      .catch(function (err) {
        // Токен истёк или недействителен — разлогиниваем локально.
        if (err.status === 401) {
          clearToken();
        }
        return null;
      });
  }

  function getFavorites() {
    return request("/api/favorites").then(function (data) {
      return data.favorites;
    });
  }

  function addFavorite(listingId) {
    return request("/api/favorites/" + encodeURIComponent(listingId), {
      method: "POST",
    }).then(function (data) {
      return data.favorites;
    });
  }

  function removeFavorite(listingId) {
    return request("/api/favorites/" + encodeURIComponent(listingId), {
      method: "DELETE",
    }).then(function (data) {
      return data.favorites;
    });
  }

  // Переводит понятный код ошибки от сервера в текст на нужном языке.
  // Использует словарь Dzintars.i18n, если он уже подключён на странице.
  function errorMessage(err) {
    var code = (err && err.code) || "request_failed";
    var key = "auth.error." + code;
    if (window.Dzintars && window.Dzintars.i18n) {
      var translated = window.Dzintars.i18n.t(key);
      if (translated !== key) return translated;
    }
    return code;
  }

  window.DzApi = {
    API_BASE_URL: API_BASE_URL,
    isLoggedIn: isLoggedIn,
    getToken: getToken,
    getCachedUser: getCachedUser,
    register: register,
    login: login,
    logout: logout,
    fetchMe: fetchMe,
    getFavorites: getFavorites,
    addFavorite: addFavorite,
    removeFavorite: removeFavorite,
    errorMessage: errorMessage,
  };
})();
