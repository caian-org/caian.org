function changeTheme() {
  const c = '/assets/css'

  const theme = document.getElementById('theme')
  const syntax = document.getElementById('syntax')
  const changeTheme = document.getElementById('change-theme')

  const dim = theme.href.endsWith('bright.css') ? 'dark' : 'bright'

  theme.href = [c, 'default', dim].join('/').concat('.css')
  syntax.href = [c, 'syntax', dim].join('/').concat('.css')
  changeTheme.innerHTML = (dim === 'bright' ? 'Dark' : 'Bright').concat(' theme')
}
