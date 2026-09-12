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

  var API_BASE_URL = "https://dzintars-api.estoniabolt.workers.dev";

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

  // ---------------------------------------------------------------------
  // Категории и объявления (Version 1)
  // ---------------------------------------------------------------------

  // Собирает query-строку из объекта, пропуская undefined/null/"" значения,
  // чтобы вызывающему коду не нужно было самому фильтровать пустые фильтры.
  function buildQuery(params) {
    if (!params) return "";
    var parts = [];
    Object.keys(params).forEach(function (key) {
      var value = params[key];
      if (value === undefined || value === null || value === "") return;
      parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
    });
    return parts.length ? "?" + parts.join("&") : "";
  }

  function getCategories() {
    return request("/api/categories").then(function (data) {
      return data.categories;
    });
  }

  function createListing(fields) {
    return request("/api/listings", { method: "POST", body: fields }).then(function (data) {
      return data.listing;
    });
  }

  function getListings(filters) {
    return request("/api/listings" + buildQuery(filters)).then(function (data) {
      return data; // { listings, page, limit, total, hasMore }
    });
  }

  function getListing(id) {
    return request("/api/listings/" + encodeURIComponent(id)).then(function (data) {
      return data.listing;
    });
  }

  function updateListing(id, fields) {
    return request("/api/listings/" + encodeURIComponent(id), {
      method: "PATCH",
      body: fields,
    }).then(function (data) {
      return data.listing;
    });
  }

  function deleteListing(id) {
    return request("/api/listings/" + encodeURIComponent(id), { method: "DELETE" });
  }

  function pauseListing(id) {
    return request("/api/listings/" + encodeURIComponent(id) + "/pause", { method: "POST" }).then(function (data) {
      return data.listing;
    });
  }

  function resumeListing(id) {
    return request("/api/listings/" + encodeURIComponent(id) + "/resume", { method: "POST" }).then(function (data) {
      return data.listing;
    });
  }

  function markListingSold(id) {
    return request("/api/listings/" + encodeURIComponent(id) + "/sold", { method: "POST" }).then(function (data) {
      return data.listing;
    });
  }

  function getMyListings() {
    return request("/api/my/listings").then(function (data) {
      return data.listings;
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

  // ---------------------------------------------------------------------
  // Фото объявлений (Version 3) — прокси через imgur
  // ---------------------------------------------------------------------

  // Читает File как base64 и отрезает префикс "data:...;base64," — backend
  // (handleUploadPhoto) ожидает чистую base64-строку в JSON-теле, так проще
  // переиспользовать общий request() без отдельного низкоуровневого
  // fetch-пути под multipart.
  function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var result = reader.result || "";
        var commaIdx = result.indexOf(",");
        resolve(commaIdx === -1 ? result : result.slice(commaIdx + 1));
      };
      reader.onerror = function () {
        reject(new Error("file_read_failed"));
      };
      reader.readAsDataURL(file);
    });
  }

  // Возвращает Promise<string> — прямую ссылку imgur на загруженный файл.
  // Ничего не сохраняет сама — вызывающий код (форма создания объявления)
  // сам собирает массив ссылок и шлёт его в createListing/updateListing как
  // поле photos.
  function uploadPhoto(file) {
    return fileToBase64(file).then(function (dataBase64) {
      return request("/api/upload-photo", {
        method: "POST",
        body: {
          filename: file.name,
          contentType: file.type,
          dataBase64: dataBase64,
        },
      });
    }).then(function (data) {
      return data.url;
    });
  }

  // ---------------------------------------------------------------------
  // Мессенджер (Version 2)
  // ---------------------------------------------------------------------

  function createConversation(listingId) {
    return request("/api/conversations", {
      method: "POST",
      body: { listing_id: listingId },
    }).then(function (data) {
      return data.conversation;
    });
  }

  // filters сейчас поддерживает только { listing_id } — фильтр диалогов
  // по конкретному объявлению (нужен для "Продано -> выбрать покупателя"
  // в Version 4), не путать с фильтрами объявлений в getListings.
  function getConversations(filters) {
    return request("/api/conversations" + buildQuery(filters)).then(function (data) {
      return data.conversations;
    });
  }

  // Этот же вызов помечает чужие непрочитанные сообщения как прочитанные
  // на сервере (см. комментарий в handleGetMessages воркера) — отдельного
  // markAsRead-метода на клиенте намеренно нет.
  function getMessages(conversationId) {
    return request("/api/conversations/" + encodeURIComponent(conversationId) + "/messages").then(function (data) {
      return data.messages;
    });
  }

  function sendMessage(conversationId, text) {
    return request("/api/conversations/" + encodeURIComponent(conversationId) + "/messages", {
      method: "POST",
      body: { text: text },
    }).then(function (data) {
      return data.message;
    });
  }

  function editMessage(conversationId, messageId, text) {
    return request(
      "/api/conversations/" + encodeURIComponent(conversationId) + "/messages/" + encodeURIComponent(messageId),
      { method: "PATCH", body: { text: text } }
    ).then(function (data) {
      return data.message;
    });
  }

  function deleteMessage(conversationId, messageId) {
    return request(
      "/api/conversations/" + encodeURIComponent(conversationId) + "/messages/" + encodeURIComponent(messageId),
      { method: "DELETE" }
    );
  }

  // Переводит понятный код ошибки от сервера в текст на нужном языке.
  // Использует словарь Dzintars.i18n, если он уже подключён на странице.
  // namespace по умолчанию "auth.error." (обратная совместимость с уже
  // существующими вызовами); для ошибок создания объявления передавай
  // "listing.error." — коды там другие (TITLE_REQUIRED и т.п.).
  function errorMessage(err, namespace) {
    var code = (err && err.code) || "request_failed";
    var key = (namespace || "auth.error.") + code;
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
    // Version 1 — категории и объявления
    getCategories: getCategories,
    createListing: createListing,
    getListings: getListings,
    getListing: getListing,
    updateListing: updateListing,
    deleteListing: deleteListing,
    pauseListing: pauseListing,
    resumeListing: resumeListing,
    markListingSold: markListingSold,
    getMyListings: getMyListings,
    // Version 3 — фото объявлений
    uploadPhoto: uploadPhoto,
    // Version 2 — мессенджер
    createConversation: createConversation,
    getConversations: getConversations,
    getMessages: getMessages,
    sendMessage: sendMessage,
    editMessage: editMessage,
    deleteMessage: deleteMessage,
  };
})();
