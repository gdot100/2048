// Wait till the browser is ready to render the game (avoids glitches)
var game_manager
window.requestAnimationFrame(function () {
  game_manager = new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager);
  console.log(game_manager)
});
