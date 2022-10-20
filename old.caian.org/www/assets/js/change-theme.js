function changeTheme () {
  const c = '/assets/css/themes/main'

  const theme = document.getElementById('theme')
  const syntax = document.getElementById('syntax')
  const ct = document.getElementById('change-theme')

  const dim = theme.href.endsWith('bright.css') ? 'dark' : 'bright'

  theme.href = [c, dim].join('/').concat('.css')
  syntax.href = [c, 'syntax', dim].join('/').concat('.css')
  ct.innerHTML = (dim === 'bright' ? 'Dark' : 'Bright').concat(' theme')
}
