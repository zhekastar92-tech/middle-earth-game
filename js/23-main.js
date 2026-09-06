// ============================================================
// MAIN / BOOTSTRAP
// Должен грузиться ПОСЛЕДНИМ. Здесь и только здесь выполняется стартовая логика: все остальные файлы лишь объявляют функции/данные и ничего не запускают сами.
// ============================================================

checkDailyReset();
// Миграция экипировки для новых классов
Object.keys(CLASSES).forEach(cls => {
  if (!gameData.equip[cls]) {
    gameData.equip[cls] = { head: null, body: null, arms: null, legs: null };
  }
});
migrateItemNames();
let needsLbReset = !gameData.leaderboard || gameData.leaderboard.length === 0 || gameData.leaderboard.every(b => b.lp < 3000);
if (needsLbReset) {
  gameData.leaderboard = BOT_NAMES.map(name => ({ name: name, lp: Math.floor(Math.random() * 1001) + 7000 }));
}
renderMainMenu();
