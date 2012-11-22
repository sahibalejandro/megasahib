ig.module(
  'game.entities.player'
)
.requires(
  'impact.entity',
  'game.entities.player-charge',
  'game.entities.player-primary-shot'
)
.defines(function (){
  EntityPlayer = ig.Entity.extend({
    animSheet: new ig.AnimationSheet('media/player.png', 48, 48),
    type: ig.Entity.TYPE.A,
    size: {x: 20, y: 48},
    offset: {x: 14, y: 0},
    vel_x_normal: 190,
    vel_y_normal: 300,
    vel_y_wall: 50,
    vel_x_dash: 250,
    vel_y_dash: 310,
    health: 100,
    flip: false,
    zIndex: 2,
    on_wall: false,
    
    // Curreng animation tag
    anim_tag: 'normal',
    
    // Timers and flags for mega shot
    TimerCharging: null,
    megashot_small: false,
    megashot_big: false,
    
    // Timer for invincibility
    TimerInvincible: null,
    
    // Timers and flags for dash
    TimerDashCombo: null,
    TimerDash: null,
    dash_last_key: null,
    
    // Timer to show "shooting" anim
    TimerShooting: null,
    
    // States
    is_running: false,
    is_dash: false,
    is_on_air: false,
    
    init: function (x, y, settings)
    {
      this.parent(x, y, settings);
      this.maxVel = {x: this.vel_x_normal, y: this.vel_y_normal};
      this.setAnims('normal');
      this.TimerDashCombo = new ig.Timer();
    },
    
    update: function ()
    {
      // Dash
      this.checkDash();
      
      // Move left/right
      if (ig.input.state('left')) {
        this.vel.x = this.accel.x = -this.maxVel.x;
        this.flip       = true;
        if (this.TimerDash) {
          this.currentAnim = this.anims.dash;
        } else {
          this.currentAnim = this.anims.running;
        }
      } else if (ig.input.state('right')) {
        this.vel.x = this.accel.x = this.maxVel.x;
        this.flip       = false;
        if (this.TimerDash) {
          this.currentAnim = this.anims.dash;
        } else {
          this.currentAnim = this.anims.running;
        }
      } else {
        this.vel.x = this.accel.x = 0;
        this.currentAnim = this.anims.idle;
      }
      
      // Jump
      if ((this.standing || this.on_wall) && ig.input.pressed('jump')) {
        this.vel.y = this.accel.y = -(this.maxVel.y + (this.on_wall ? 200 : 0));
      }
      if (!this.standing) {
        if (this.vel.y < 0) {
          this.currentAnim = this.anims.jumping;
        } else {
          if (this.on_wall) {
            this.vel.y = this.accel.y = this.vel_y_wall;
            this.currentAnim = this.anims.wall;
            this.flip = !this.flip;
          } else {
            this.currentAnim = this.anims.falling;
          }
        }
      }
      if (this.on_wall && (ig.input.released('left') || ig.input.released('right'))){
        this.flip = !this.flip;
      }
      
      /*
       * Shooting time!
       */
      if (ig.input.pressed('shoot')) {
        // Calculate the spawn position of the bullet
        var shot_x = this.pos.x + (this.flip ? -15 : 30);
        var shot_y = this.pos.y + 12;
        
        if (this.standing && this.TimerDash) {
          shot_x += (this.flip ? -18 : 18);
          shot_y += 12;
        }
        
        ig.game.spawnEntity(
          EntityPlayerPrimaryShot,
          shot_x,
          shot_y,
          {flip: this.flip}
        );
        
        // Start "chargin" timer
        this.TimerCharging = new ig.Timer();
        
        // Start "shotting" timer and change animation
        this.shooting();
      }
      if (this.TimerShooting && this.TimerShooting.delta() > 0) {
        this.TimerShooting = null;
        this.setAnims('normal');
      }
      
      /** MegaShot */
      if (ig.input.released('shoot')) {
        // Shoot mega shot!
        if (this.megashot_big) { // Big MegaShot
          this.shooting();
          
          // Calculate the spawn position of the big megashot
          var shot_x = this.pos.x + (this.flip ? -70 : 35);
          var shot_y = this.pos.y + 3;
          
          if (this.standing && this.TimerDash) {
            shot_x += (this.flip ? -25 : 25);
            shot_y += 12;
          }
          
          ig.game.spawnEntity(
            EntityPlayerBigMegaShot,
            shot_x,
            shot_y,
            {flip: this.flip}
          );
        } else if (this.megashot_small) { // Small MegaShot
          this.shooting();
          ig.game.spawnEntity(
            EntityPlayerSmallMegaShot,
            this.pos.x,
            this.pos.y,
            {flip: this.flip}
          );
        }
        
        // Remove "Charging" entity
        var EntityCharging = ig.game.getEntitiesByType(EntityPlayerCharge)[0];
        if (EntityCharging) {
          ig.game.removeEntity(EntityCharging);
        }
        
        // Reset charging flags
        this.megashot_small = false;
        this.megashot_big   = false;
        this.TimerCharging  = null;
      }
      
      // Set flags for megashot small/big and spawn "charging" entity
      if (!this.megashot_small && this.TimerCharging && this.TimerCharging.delta() > 1) {
        this.megashot_small = true;
        ig.game.spawnEntity(EntityPlayerCharge, this.pos.x, this.pos.y, {flip: this.flip});
      }
      if (!this.megashot_big && this.TimerCharging && this.TimerCharging.delta() > 2.5) {
        this.megashot_big = true;
      }
      
      /** // MegaShot */
      
      /** Invincible timer */
      if (this.TimerInvincible && this.TimerInvincible.delta() > 0) {
        this.TimerInvincible = null;
      }
      
      if (this.TimerInvincible) {
        this.currentAnim.alpha = 0.5;
      } else {
        this.currentAnim.alpha = 1;
      }
      
      this.currentAnim.flip.x = this.flip;
      this.parent();
    },
    
    /*
     * Start "shotting" timer and change animation
     */
    shooting: function ()
    {
      this.TimerShooting = new ig.Timer(0.3);
      this.setAnims('shooting');
    },
    
    /**
     * Set proper animation based on anim_tag
     */
    setAnims: function (anim_tag)
    {
      if (anim_tag != this.current_animg_tag) {
        this.current_animg_tag = anim_tag;
        if (anim_tag == 'normal') {
          this.addAnim('idle', 0.5, [0,0,1,1,0,0,1,1,0,0,2,1]);
          this.addAnim('running', 0.06, [3,3,4,5,6,7,7,8,9,10]);
          this.addAnim('jumping', 0.08, [21,22]);
          this.addAnim('falling', 0.08, [25,26]);
          this.addAnim('wall', 1, [29]);
          this.addAnim('dash', 0.08, [21]);
        } else if (anim_tag == 'shooting') {
          this.addAnim('idle', 0.1, [11,12]);
          this.addAnim('running', 0.06, [13,13,14,15,16,17,17,17,18,19,20]);
          this.addAnim('jumping', 0.08, [23,24]);
          this.addAnim('falling', 0.08, [27,28]);
          this.addAnim('wall', 1, [30]);
          this.addAnim('dash', 0.08, [23]);
        }
      }
    },
    
    /**
     * Check dash combo and start/stop dash timer, when start dash the x
     * velocity is increased, when stop dash the x velocity back to normal.
     */
    checkDash: function ()
    {
      if (!this.TimerDash) {
        var do_dash = false;
        if (this.standing && (ig.input.pressed('right'))) {
          if(this.TimerDashCombo.tick() < 0.5 && this.dash_last_key == 'right') {
            do_dash = true;
          }
          this.dash_last_key = 'right';
        }
        if (this.standing && (ig.input.pressed('left'))) {
          if(this.TimerDashCombo.tick() < 0.5 && this.dash_last_key == 'left') {
            do_dash = true;
          }
          this.dash_last_key = 'left';
        }
        
        if (do_dash) {
          this.setDash(true);
        }
      } else if (
        this.standing
        && (this.TimerDash.delta() > 0
                || (ig.input.released('left') || ig.input.released('right')))
      ) {
        this.setDash(false);
      } else {
        if (!this.dash_jump && ig.input.pressed('jump')) {
          this.dash_jump = true;
        }
      }
    },
    
    /**
     * Enable/disable dash velocity
     */
    setDash: function (on)
    {
      if (on) {
        this.TimerDash = new ig.Timer(0.7);
        this.maxVel.x = this.vel_x_dash;
        this.maxVel.y = this.vel_y_dash;
      } else {
        this.TimerDash = null;
        this.maxVel.x = this.vel_x_normal;
        this.maxVel.y = this.vel_y_normal;
        this.dash_jump = false;
      }
    },
    
    handleMovementTrace: function (res)
    {
      if (
        this.TimerDash && (
          res.collision.x
          || (this.dash_jump && res.collision.y)
        )
      ) {
        this.setDash(false);
      }
      
      // Stick to walls
      if (!this.standing && this.vel.y > 0 && res.collision.x) {
        this.on_wall = true;
      } else {
        this.on_wall = false;
      }
      
      this.parent(res);
    },
    
    /**
     * Make invincible when receive damage
     */
    receiveDamage: function (amount, EntityFrom)
    {
      if (!this.TimerInvincible) {
        this.parent(amount, EntityFrom);
        this.makeInvincible();
      }
    },
    
    /**
     * When player is killed, drop one life, show death animation and restart
     */
    kill: function ()
    {
      this.parent();
      ig.game.onPlayerDie();
    },
    
    /**
     * Start timer for invincibility
     */
    makeInvincible: function (time)
    {
      if (time == undefined) {
        time = 2;
      }
      this.TimerInvincible = new ig.Timer(time);
    },
  });
});
