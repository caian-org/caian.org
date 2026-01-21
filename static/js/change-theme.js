const THEME_KEY = 'theme'
const THEME_PATH = '/css/themes/main'

function getStoredTheme() {
  return localStorage.getItem(THEME_KEY) || 'bright'
}

function applyTheme(dim) {
  const theme = document.getElementById('theme')
  const syntax = document.getElementById('syntax')
  const ct = document.getElementById('change-theme')

  theme.href = `${THEME_PATH}/${dim}.css`
  if (syntax) {
    syntax.href = `${THEME_PATH}/syntax/${dim}.css`
  }
  if (ct) {
    ct.innerHTML = (dim === 'bright' ? 'Dark' : 'Bright') + ' theme'
  }
}

function changeTheme() {
  const theme = document.getElementById('theme')
  const newTheme = theme.href.endsWith('bright.css') ? 'dark' : 'bright'

  localStorage.setItem(THEME_KEY, newTheme)
  applyTheme(newTheme)
}

// Atualizar texto do botão ao carregar
document.addEventListener('DOMContentLoaded', function() {
  const ct = document.getElementById('change-theme')
  if (ct) {
    const theme = getStoredTheme()
    ct.innerHTML = (theme === 'bright' ? 'Dark' : 'Bright') + ' theme'
  }
})
