document.addEventListener('DOMContentLoaded', (event) => {
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
      loginButton.addEventListener('click', () => {
        window.location.href = '/auth';
      });
    }
  });
  