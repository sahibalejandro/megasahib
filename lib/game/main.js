ig.module( 
	'game.main' 
)
.requires(
	'impact.game',
	'impact.font',
	'game.levels.level1',
	'game.levels.level2'
)
.defines(function(){

MainGame = ig.Game.extend({
	
	font: new ig.Font( 'media/04b03.font.png' ),
	
	gravity: 1500,
	current_level_number: 1,
	TimerReadyGo: null,
	TimerPlayerDead: null,
	TimerLevelClear: null,
	
	PlayerSpawnPosition: null,
	player_lifes: 1,
	
	max_screen_x: 0,
	max_screen_y: 0,
	
	// If the game is on puase or not.
	pause: false,
	
	init: function() {
		// Initialize your game here; bind keys etc.
		
		// When the game start load first level and show "ready go" for the first time.
		this.loadLevel(LevelLevel1);
		this.showReadyGo();
	},
	
	/**
	 * Load specified level and place the player in the stored spawn position.
	 */
	loadLevel: function (Level)
	{
		this.parent(Level);
		
		// Get map size to avoid viewport to show unmapped areas
		var CurrentMap = this.getMapByName('level');
		this.max_screen_x = CurrentMap.width * CurrentMap.tilesize;
		this.max_screen_y = CurrentMap.height * CurrentMap.tilesize;
		
		// Place the player in the spawn position
		var Player = this.getEntitiesByType(EntityPlayer)[0];
		
		// Initialize the PlayerSpawnPosition object
		if (this.PlayerSpawnPosition == null) {
			this.PlayerSpawnPosition = {x: 0, y: 0};
			this.setPlayerSpawnPosition(Player.pos.x, Player.pos.y);
		}
		Player.pos.x = this.PlayerSpawnPosition.x;
		Player.pos.y = this.PlayerSpawnPosition.y;
		
		// Place the screen to show the player
		this.screen.x = Player.pos.x;
		this.screen.y = Player.pos.y;
	},
	
	/**
	 * Game update
	 */
	update: function() {
		
		/*
		 * Pause/unpause the game
		 */
		if (ig.input.pressed('pause')) {
			this.pauseGame();
		}
		
		if (this.pause) {
			// Only update some of the entities when paused
			for(var i = 0; i < this.entities.length; i++) {
				if (this.entities[i].ignorePause) {
					this.entities[i].update();
				}
			}
		} else {
			// call update() as normal when not paused and do normal stuff
			this.parent();
			
			/*
			 * Remove or restart timers
			 */
			
			// Remove timer for "Ready? Go!" text and bind the player movement keys
			if (this.TimerReadyGo && this.TimerReadyGo.delta() > 0) {
				this.TimerReadyGo = null;
				this.bindGameInput();
			}
			
			// Remove timer whan player is killed (slow motion) and back to normal game speed.
			if (this.TimerPlayerDead && this.TimerPlayerDead.delta() > 0) {
				this.TimerPlayerDead = null;
				ig.Timer.timeScale = 1;
				
				// Go to GameOverScreen if player have no more lifes.
				if (this.player_lifes >= 0) {
					this.setLevel();
				} else {
					ig.system.setGame(GameOverScreen);
				}
			}
			
			// TimerLevelClear
			if (this.TimerLevelClear && this.TimerLevelClear.delta() > 0) {
				this.TimerLevelClear = null;
				this.nextLevel();
			}
			
			/*
			 * Camera follow the player
			 */
			var player = this.getEntitiesByType(EntityPlayer)[0];
			if (player) {
				var screen_top       = this.screen.y;
				var screen_bottom    = screen_top + ig.system.height;
				var subscreen_top    = screen_top + 48;
				var subscreen_bottom = screen_bottom - 48;
				var player_bottom    = player.pos.y + player.size.y;
				
				// Move screen to center player in x axis
				this.screen.x = player.pos.x - ig.system.width / 2;
				
				// Move screen in Y only when player is out of sub screen
				if (player.pos.y > screen_top && player.pos.y < subscreen_top) {
					this.screen.y -= subscreen_top - player.pos.y;
				}
				
				if (player_bottom > subscreen_bottom && player_bottom < screen_bottom) {
					this.screen.y += player_bottom - subscreen_bottom;
				}
								
				// Avoid screen to go into negative X axis or more than level width
				if (this.screen.x < 0) {
					this.screen.x = 0;
				}
				if ((this.screen.x + ig.system.width) > this.max_screen_x) {
					this.screen.x = this.max_screen_x - ig.system.width;
				}
				
				// Avoid screen to go into negative Y axis or more than level height
				if (this.screen.y < 0) {
					this.screen.y = 0;
				}
				if ((this.screen.y + ig.system.height) > this.max_screen_y) {
					this.screen.y = this.max_screen_y - ig.system.height;
				}
			}
			// end of: "Camera follow the player"
		}
		// end of: if (!this.pause)
	},
	
	/**
	 * Game draw
	 */
	draw: function() {
		// Draw all entities and backgroundMaps
		this.parent();
		
		// Be carefull, EntityPlayer could not exists some times if was killed
		var Player = this.getEntitiesByType(EntityPlayer)[0];
		var health = !Player ? 0 : Player.health;
		var lifes  = this.player_lifes < 0 ? 0 : this.player_lifes;

		// Coords to center "pause" or "Ready? Go!" messages
		var message_x = ig.system.width / 2;
		var message_y = ig.system.height / 2;
		
		// Show HUD
		this.font.draw("Health: " + health + "\nLifes: " + lifes, 20, 10);
		
		// Show "Pause" message
		if (this.pause) {
			this.font.draw('Pause', message_x, message_y, ig.Font.ALIGN.CENTER);
		}
		
		// Show "ready go" message
		if (this.TimerReadyGo) {
			var message = this.TimerReadyGo.delta() < -0.9 ? 'Ready?' : 'Go!';
			this.font.draw(message, message_x, message_y, ig.Font.ALIGN.CENTER);
		}
		
		// Show "Level Clear" message
		if (this.TimerLevelClear) {
			this.font.draw('Level clear!', message_x, message_y, ig.Font.ALIGN.CENTER);
		}
	},
	
	/**
	 * Load a new level, or restart the current level if level_number is not defined
	 */
	setLevel: function (level_number)
	{
		if (level_number == undefined) {
			level_number = this.current_level_number;
		}
		
		this.current_level_number = level_number;
		console.log('setLevel: ', this.current_level_number);
		this.loadLevelDeferred(ig.global['LevelLevel' + this.current_level_number]);
		this.showReadyGo();
	},
	
	/**
	 * Load next level
	 */
	nextLevel: function ()
	{
		this.PlayerSpawnPosition = null;
		this.setLevel(this.current_level_number + 1);
	},
	
	/**
	 * Start the timer to show text "Ready? Go!" and unbind all inputs
	 */
	showReadyGo: function ()
	{
		this.TimerReadyGo = new ig.Timer(2);
		ig.input.unbindAll();
	},
	
	/**
	 * Bind game inputs, like shoot, jump, pause, etc. all in-game inputs.
	 */
	bindGameInput: function ()
	{
		ig.input.bind(ig.KEY.P, 'pause');
		ig.input.bind(ig.KEY.S, 'shoot');
		ig.input.bind(ig.KEY.RIGHT_ARROW, 'right');
		ig.input.bind(ig.KEY.LEFT_ARROW, 'left');
		ig.input.bind(ig.KEY.UP_ARROW, 'jump');
	},
	
	/**
	 * Bind pause-menu inputs
	 */
	bindPauseMenuInput: function ()
	{
		ig.input.bind(ig.KEY.P, 'pause');
	},
	
	/**
	 * Pause/unpause the game
	 */
	pauseGame: function ()
	{
		if (this.pause) {
			// Will be unpause the game, then bind in-game inputs
			this.bindGameInput();
		} else {
			// Pause the game and bind pause-menu inputs
			this.bindPauseMenuInput();
		}
		this.pause = !this.pause;
	},
	
	/**
	 * Store the position in the game
	 */
	setPlayerSpawnPosition: function (x, y)
	{
		this.PlayerSpawnPosition.x = x;
		this.PlayerSpawnPosition.y = y;
	},
	
	/**
	 * When player die rest one life and start slow-motiosn
	 */
	onPlayerDie: function ()
	{
		this.player_lifes--;
		ig.Timer.timeScale = 0.5;
		this.TimerPlayerDead = new ig.Timer(1);
	},
	
	/**
	 * Show "Level clear" message and start the timer to load next level
	 */
	levelClear: function ()
	{
		this.TimerLevelClear = new ig.Timer(5);
		ig.input.unbindAll();
	}
});

/** ===============================================================================
 * Game to show start screen
 */
StartScreen = ig.Game.extend({
	// Load a font
	font: new ig.Font( 'media/04b03.font.png' ),
	
	init: function ()
	{
		ig.input.bind(ig.KEY.S, 'start');
	},
	
	update: function ()
	{
		this.parent();
		
		if (ig.input.pressed('start')) {
			ig.system.setGame(MainGame);
		}
	},
	
	draw: function ()
	{
		this.parent();
		this.font.draw('Press S to start the game.', 10, 10);
	}
});

/** ===============================================================================
 * Screen to show game over
 */
GameOverScreen = ig.Game.extend({
	// Load a font
	font: new ig.Font( 'media/04b03.font.png' ),
	TimerRestart: null,
	init: function ()
	{
		this.TimerRestart = new ig.Timer(3);
	},
	
	update: function ()
	{
		if (this.TimerRestart.delta() > 0) {
			ig.system.setGame(StartScreen);
		}
	},
	
	draw: function ()
	{
		this.parent();
		var message_x = ig.system.width / 2;
		var message_y = ig.system.height / 2;
		this.font.draw(
			'You suck, the game is over.',
			message_x,
			message_y,
			ig.Font.ALIGN.CENTER
		);
	}
});

// Start the Game with 60fps, a resolution of 320x240, scaled
// up by a factor of 2
ig.main( '#canvas', StartScreen, 60, 480, 320, 2 );

});
