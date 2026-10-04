import './exit-dialog.css';

export function setupGameExit({ isPlaying, isPaused, togglePause }) {
  const dialog = document.createElement('dialog');
  dialog.id = 'exit-dialog';
  dialog.setAttribute('aria-labelledby', 'exit-title');
  dialog.setAttribute('aria-describedby', 'exit-copy');
  dialog.innerHTML = `<div class="exit-icon">↗</div><h2 id="exit-title">Về Home chọn game khác?</h2><p id="exit-copy">Lượt chơi hiện tại sẽ kết thúc. Kỷ lục đã lưu vẫn được giữ.</p><div class="exit-actions"><button id="exit-cancel" autofocus>Hủy — chơi tiếp</button><button id="exit-confirm">Về Home</button></div>`;
  document.body.appendChild(dialog);
  let resume = false;
  function open() {
    if (dialog.open) return;
    resume = isPlaying() && !isPaused();
    if (resume) togglePause();
    dialog.showModal();
  }
  function cancel() {
    dialog.close();
    if (resume && isPlaying() && isPaused()) togglePause();
    resume = false;
  }
  dialog.querySelector('#exit-cancel').addEventListener('click', cancel);
  dialog.querySelector('#exit-confirm').addEventListener('click', () => window.location.assign('/'));
  dialog.addEventListener('cancel', event => { event.preventDefault(); cancel(); });
  window.addEventListener('keydown', event => {
    if (dialog.open) {
      event.stopImmediatePropagation();
      if (event.code === 'Escape') { event.preventDefault(); cancel(); }
      return;
    }
    if (event.code === 'Escape' && !event.repeat) {
      event.preventDefault(); event.stopImmediatePropagation(); open();
    }
  }, true);
  const home = document.createElement('button');
  home.id = 'exit-home'; home.textContent = '← Home'; home.addEventListener('click', open);
  const header = document.querySelector('header');
  const actions = document.createElement('div'); actions.className = 'header-actions';
  actions.append(home, document.getElementById('sound')); header.appendChild(actions);
  const brand = header.querySelector('.brand');
  brand.href = '/'; brand.addEventListener('click', event => { event.preventDefault(); open(); });
}
