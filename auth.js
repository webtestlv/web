<!DOCTYPE html>
<html lang="lv">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title data-i18n="auth.title">Sveicināti!</title>
<link rel="stylesheet" href="css/theme.css">
<link rel="stylesheet" href="css/auth.css">
</head>
<body>
<div class="app">
  <main class="auth-screen">

    <div class="auth-top">
      <button class="auth-back" type="button" onclick="window.location.href='home.html'" aria-label="Atpakaļ">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <div class="auth-body">
      <span class="auth-demo-badge" data-i18n="auth.demoNotice">Šī ir tikai maketa forma — reģistrācija vēl nedarbojas.</span>

      <div class="auth-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="8" r="3.4" stroke="#16213A" stroke-width="1.9"/>
          <path d="M5 20C5 16.7 8.1 14 12 14C15.9 14 19 16.7 19 20" stroke="#16213A" stroke-width="1.9" stroke-linecap="round"/>
        </svg>
      </div>

      <h1 class="auth-title" data-i18n="auth.title">Sveicināti!</h1>
      <p class="auth-subtitle" data-i18n="auth.subtitle">Ienāc vai reģistrējies, lai turpinātu</p>

      <button class="auth-social" type="button" id="btn-google" disabled>
        <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <path fill="#FFC107" d="M43.6 20.5H42V20.4H24v7.2h11.3c-1.6 4.6-6 7.9-11.3 7.9-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.1-5.1C33.6 5 29 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.4-.4-3.5z"/>
          <path fill="#FF3D00" d="M6.3 14.7l5.9 4.3C13.8 15.3 18.5 12 24 12c3 0 5.8 1.1 7.9 3l5.1-5.1C33.6 5 29 3 24 3c-7.4 0-13.8 4.1-17.1 10.2z"/>
          <path fill="#4CAF50" d="M24 45c5 0 9.5-1.9 12.9-5l-6-4.9C29.1 36.6 26.7 37.5 24 37.5c-5.2 0-9.6-3.3-11.3-7.9l-6 4.6C10.1 40.8 16.5 45 24 45z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20.4H24v7.2h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6 4.9C40.7 35.6 45 30.4 45 24c0-1.2-.1-2.4-1.4-3.5z"/>
        </svg>
        <span data-i18n="auth.google">Turpināt ar Gmail</span>
      </button>

      <div class="auth-divider" data-i18n="auth.or">vai</div>

      <label class="auth-field-label" for="auth-contact" data-i18n="auth.emailLabel">E-pasts vai tālrunis</label>
      <input class="auth-input" type="text" id="auth-contact" data-i18n-placeholder="auth.emailPlaceholder" placeholder="vards@epasts.lv" disabled>

      <button class="auth-submit" type="button" disabled data-i18n="auth.continue">Turpināt</button>

      <p class="auth-terms" data-i18n="auth.terms">Turpinot, jūs piekrītat lietošanas noteikumiem un privātuma politikai.</p>
    </div>

  </main>
</div>

<script src="js/i18n.js"></script>
</body>
</html>
