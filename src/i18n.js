export function getLanguage() {
  try { return globalThis.localStorage?.getItem('sky-club-language') === 'vi' ? 'vi' : 'en'; } catch { return 'en'; }
}
export function t(en, vi) { return getLanguage() === 'vi' ? vi : en; }
export function setupLanguageUI(pairs = []) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = getLanguage();
  const translations = new Map(pairs);
  for (const [en, vi] of pairs) {
    if (getLanguage() === 'vi') document.title = document.title.replace(en, vi);
  }
  if (getLanguage() === 'vi') {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (['SCRIPT', 'STYLE'].includes(node.parentElement?.tagName)) continue;
      const trimmed = node.textContent.trim();
      if (translations.has(trimmed)) node.textContent = node.textContent.replace(trimmed, translations.get(trimmed));
    }
    for (const element of document.querySelectorAll('[aria-label], [title], [alt], [placeholder], meta[name="description"]')) {
      for (const attribute of ['aria-label', 'title', 'alt', 'placeholder', 'content']) {
        const value = element.getAttribute(attribute);
        if (translations.has(value)) element.setAttribute(attribute, translations.get(value));
      }
    }
  }
  const select = document.createElement('select');
  select.className = 'language-select';
  select.setAttribute('aria-label', t('Language', 'Ngôn ngữ'));
  select.title = t('Changing language starts a new round', 'Đổi ngôn ngữ sẽ bắt đầu ván mới');
  select.innerHTML = '<option value="en">English</option><option value="vi">Tiếng Việt</option>';
  select.value = getLanguage();
  select.addEventListener('keydown', event => event.stopPropagation());
  select.addEventListener('click', event => event.stopPropagation());
  select.addEventListener('change', () => {
    try { localStorage.setItem('sky-club-language', select.value); } catch {}
    location.reload();
  });
  (document.querySelector('.header-actions') || document.querySelector('header')).append(select);
}
