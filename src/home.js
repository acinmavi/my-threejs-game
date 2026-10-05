import { t, setupLanguageUI } from './i18n.js';
import { staticPairs } from './home-translations.js';
import './i18n.css';
import './home.css';
import flappyPreview from '../games/flappy-three/preview.jpg';
import crossyPreview from '../games/crossy-three/preview.jpg';
import lockPreview from '../games/pop-the-lock/preview.svg';
import clawPreview from '../games/claw-machine/preview.svg';
import coinPreview from '../games/coin-pusher/preview.svg';
import treasurePreview from '../games/treasure-ball/preview.svg';

const games = [
  { title:'Flappy 3D', number:'001', tag:t("KEEP THE RHYTHM \u00b7 FLY FAR", "GIỮ NHỊP · BAY XA"), image:flappyPreview,
    href:'/games/flappy-three/', key:'sky-club-best', description:t("One bird. One sky. Flap through the pipes and find your rhythm.", "Một chú chim. Một bầu trời. Đập cánh qua những chiếc ống và tìm nhịp bay của bạn."), controls:t("SPACE / CLICK / TAP", "SPACE / CLICK / CHẠM"), theme:'sky' },
  { title:'Crossy 3D', number:'002', tag:t("LOOK BOTH WAYS \u00b7 MOVE FORWARD", "NHÌN HAI BÊN · TIẾN LÊN"), image:crossyPreview,
    href:'/games/crossy-three/', key:'crossy-sky-best', description:t("Dodge cars, hop onto logs and wait for trains. Every step is a new adventure.", "Né xe, nhảy lên gỗ và đợi tàu qua. Mỗi bước tiến là một cuộc phiêu lưu mới."), controls:t("WASD / ARROWS / SWIPE", "WASD / MŨI TÊN / VUỐT"), theme:'meadow' },
  { title:'Pop the Lock', number:'003', tag:t("TIME IT RIGHT \u00b7 UNLOCK", "ĐÚNG NHỊP · MỞ KHÓA"), image:lockPreview, href:'/games/pop-the-lock/', key:'pop-lock-endless-best', description:t("Hit the target and reverse direction. Play Endless as the needle speeds up over time.", "Bắt đúng nhịp, trúng đổi chiều. Endless chơi liên tục, kim tăng tốc theo thời gian."), controls:t("SPACE / CLICK / TAP", "SPACE / CLICK / CHẠM"), theme:'lock' },
  { title:'Claw Club', number:'004', tag:t("AIM CAREFULLY \u00b7 GRIP TIGHT", "CĂN THẬT KỸ · GẮP THẬT CHẮC"), image:clawPreview, href:'/games/claw-machine/', key:'claw-club-best', description:t("A 3D claw machine. Three grabs per round, a weak claw and slippery plushies: aim carefully.", "Máy gắp gấu 3D. Ba lượt mỗi ván, càng yếu và gấu dễ tuột — căn thật kỹ trước khi gắp."), controls:t("WASD / ARROWS / TAP", "WASD / MŨI TÊN / CHẠM"), theme:'claw' },
  { title:'Infinity Pusher', number:'005', tag:t("TIME THE SHOT \u00b7 PUSH COINS \u00b7 HUNT STONES", "CĂN NHỊP · ĐẨY XU · SĂN ĐÁ"), image:coinPreview, href:'/games/coin-pusher/', key:'coin-pusher-best', description:t("Shoot through the target wheel to win up to 15 coins for the two-tier pusher. Collect stones for Bonus Spins and the Jackpot.", "Bắn token qua vòng quay, nhận đến 15 xu đổ lên bàn đẩy hai tầng. Đẩy đá xuống mép để mở Bonus Spin và Jackpot."), controls:t("SPACE / A D / SLIDER / TAP", "SPACE / A D / THANH TRƯỢT / CHẠM"), theme:'pusher' },
  { title:'Treasure Ball', number:'006', tag:t("DROP BALLS \u00b7 HUNT GOLD \u00b7 FIND TREASURE", "THẢ BÓNG · SĂN VÀNG · MỞ KHO BÁU"), image:treasurePreview, href:'/games/treasure-ball/', key:'treasure-ball-best', description:t("Drop white balls through the pegboard and win balls for the pusher. Gold balls trigger bonus spins; keys unlock treasure chests.", "Bóng trắng qua bảng đinh, thưởng bóng đổ lên bàn đẩy. Bóng vàng mở vòng bonus, chìa khóa mở rương kho báu."), controls:t("SPACE / A D / SLIDER / TAP", "SPACE / A D / THANH TRƯỢT / CHẠM"), theme:'pusher' },
];
document.getElementById('games').innerHTML = games.map(game => {
  let best = 0;
  try { best = Number(localStorage.getItem(game.key)) || 0; } catch {}
  return `<a class="game-card ${game.theme}" href="${game.href}" aria-label="${t('Play', 'Chơi')} ${game.title}">
    <div class="art"><img src="${game.image}" alt="${game.title} ${t('gameplay', 'cảnh chơi')}" loading="lazy"><span class="number">ARCADE / ${game.number}</span><span class="play-icon">↗</span></div>
    <div class="card-body"><div class="tag">${game.tag}</div><div class="card-heading"><h3>${game.title}</h3><span class="record">${t('BEST', 'KỶ LỤC')} <b>${String(best).padStart(2,'0')}</b></span></div><p>${game.description}</p><div class="card-footer"><small>${game.controls}</small><span>${t('Play now', 'Chơi ngay')} <b>→</b></span></div></div></a>`;
}).join('');

setupLanguageUI(staticPairs);
