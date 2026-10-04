import './home.css';
import flappyPreview from '../games/flappy-three/preview.jpg';
import crossyPreview from '../games/crossy-three/preview.jpg';
import lockPreview from '../games/pop-the-lock/preview.svg';
import clawPreview from '../games/claw-machine/preview.svg';
import coinPreview from '../games/coin-pusher/preview.svg';

const games = [
  { title:'Flappy 3D', number:'001', tag:'GIỮ NHỊP · BAY XA', image:flappyPreview,
    href:'/games/flappy-three/', key:'sky-club-best', description:'Một chú chim. Một bầu trời. Đập cánh qua những chiếc ống và tìm nhịp bay của bạn.', controls:'SPACE / CLICK / CHẠM', theme:'sky' },
  { title:'Crossy 3D', number:'002', tag:'NHÌN HAI BÊN · TIẾN LÊN', image:crossyPreview,
    href:'/games/crossy-three/', key:'crossy-sky-best', description:'Né xe, nhảy lên gỗ và đợi tàu qua. Mỗi bước tiến là một cuộc phiêu lưu mới.', controls:'WASD / MŨI TÊN / VUỐT', theme:'meadow' },
  { title:'Pop the Lock', number:'003', tag:'ĐÚNG NHỊP · MỞ KHÓA', image:lockPreview, href:'/games/pop-the-lock/', key:'pop-lock-endless-best', description:'Bắt đúng nhịp, trúng đổi chiều. Endless chơi liên tục, kim tăng tốc theo thời gian.', controls:'SPACE / CLICK / CHẠM', theme:'lock' },
  { title:'Claw Club', number:'004', tag:'CĂN THẬT KỸ · GẮP THẬT CHẮC', image:clawPreview, href:'/games/claw-machine/', key:'claw-club-best', description:'Máy gắp gấu 3D. Ba lượt mỗi ván, càng yếu và gấu dễ tuột — căn thật kỹ trước khi gắp.', controls:'WASD / MŨI TÊN / CHẠM', theme:'claw' },
  { title:'Infinity Pusher', number:'005', tag:'CĂN NHỊP · ĐẨY XU · SĂN ĐÁ', image:coinPreview, href:'/games/coin-pusher/', key:'coin-pusher-best', description:'50 xu khởi đầu. Căn nhịp vòng mục tiêu, đẩy xu và thu sáu viên đá bất kỳ để mở Super Bonus.', controls:'SPACE / A D / THANH TRƯỢT / CHẠM', theme:'pusher' },
];
document.getElementById('games').innerHTML = games.map(game => {
  let best = 0;
  try { best = Number(localStorage.getItem(game.key)) || 0; } catch {}
  return `<a class="game-card ${game.theme}" href="${game.href}" aria-label="Chơi ${game.title}">
    <div class="art"><img src="${game.image}" alt="Cảnh chơi ${game.title}" loading="lazy"><span class="number">ARCADE / ${game.number}</span><span class="play-icon">↗</span></div>
    <div class="card-body"><div class="tag">${game.tag}</div><div class="card-heading"><h3>${game.title}</h3><span class="record">KỶ LỤC <b>${String(best).padStart(2,'0')}</b></span></div><p>${game.description}</p><div class="card-footer"><small>${game.controls}</small><span>Chơi ngay <b>→</b></span></div></div></a>`;
}).join('');
