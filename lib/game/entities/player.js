ig.module(
  'game.entities.player'
)
.requires(
  'impact.entity',
  'game.entities.player-charge',
  'game.entities.player-primary-shot',
  'game.entities.player-charging'
)
.defines(function (){

  EntityPlayer = ig.Entity.extend({
    animSheet: new ig.AnimationSheet('media/player.png', 48, 48),
    type: ig.Entity.TYPE.A,
    size: {x: 20, y: 48},
    offset: {x: 14, y: 0},
    health: 100,
    flip: false,
    zIndex: 2,

    normal_vel_x: 180,
    normal_vel_y: 300,

    current_vel_x: 0,
    current_vel_y: 0,

    on_wall_vel_y: 40,
    on_wall_jump_vel_y_increment: 200,
    on_wall: false,

    on_dash_vel_x: 300,
    dash_key: null,

    // Shot types
    SHOT: {
      BULLET:         1,
      SMALL_MEGASHOT: 2,
      BIG_MEGASHOT:   4
    },
    
    // Curreng animation tag
    anim_tag: 'normal',

    // Timers
    time_shooting: 0.3,
    time_dash: 0.7,
    TimerShooting:     null,
    TimerMegaShot:     null,
    TimerInvincible:   null,
    TimerDashKeyCombo: null,
    TimerDash:         null,
    
    init: function (x, y, settings)
    {
      this.parent(x, y, settings);
      
      this.maxVel = {x: this.normal_vel_x, y: this.normal_vel_y};
      this.current_vel_x = this.maxVel.x;
      this.current_vel_y = this.maxVel.y;

      this.setAnims('normal');

      // Start timers
      this.TimerShooting = new ig.Timer(this.time_shooting);
      this.TimerShooting.pause();
      
      this.TimerMegaShot = new ig.Timer();
      this.TimerMegaShot.pause();

      this.TimerInvincible = new ig.Timer();
      this.TimerInvincible.pause();

      this.TimerDashKeyCombo = new ig.Timer();

      this.TimerDash = new ig.Timer(this.time_dash);
      this.TimerDash.pause();
    },
    
    update: function ()
    {
      /* * * * * * * * * * * * * * * * * * * * * * * * * * * * *
       * SET ANIMATIONS "normal" or "shooting"
       */
      if (this.TimerShooting.running){
        // Shooting timer is ON

        if (this.TimerShooting.delta() < 0) {
          // Shooting time!
          this.setAnims('shooting');
        } else {
          // Stop shooting anim
          this.setAnims('normal');
          this.TimerShooting.pause();
        }
      }

      /* * * * * * * * * * * * * * * * * * * * * * * * * * * * *
       * MOVEMENT
       * Set the current_vel_x, current_vel_y, and current animation depending on
       * player movement and status.
       */

      // Stop dashing if needed
      if (this.TimerDash.running) {
        if (this.standing && this.TimerDash.delta() > 0
          || ig.input.released('left')
          || ig.input.released('right')
        ) {
          this.setDash(false);
        }
      }
      
      // Run
      if (ig.input.state('left') || ig.input.state('right')) {

        // Set max velocity and animation
        if (this.TimerDash.running) {
          this.maxVel.x    = this.on_dash_vel_x;
          this.currentAnim = this.anims.dash;
        } else {
          this.maxVel.x    = this.normal_vel_x;
          this.currentAnim = this.anims.running;
        }

        this.current_vel_x = this.maxVel.x;
        this.flip = ig.input.state('left');

        if (this.flip) {
          this.current_vel_x = -this.current_vel_x;
        }

        if (this.on_wall) {
          this.flip = (ig.input.state('left') ? false : true);
        }

      } else {
        // Is not running
        this.current_vel_x = 0;
        this.currentAnim = this.anims.idle;
      }

      // Dash
      if (this.standing && (ig.input.pressed('left') || ig.input.pressed('right'))) {

        var dash_key = ig.input.pressed('left') ? 'left' : 'right';

        if (this.dash_key != dash_key) {
          this.dash_key = dash_key;
          this.TimerDashKeyCombo.tick();
        } else if (this.TimerDashKeyCombo.tick() < 0.2) {
          this.TimerDashKeyCombo.reset();
          this.setDash(true);
        }
      }

      // Jump (or jump on wall)
      if ((this.standing || this.on_wall) && ig.input.pressed('jump')) {
        this.current_vel_y = -(
          this.maxVel.y + (this.on_wall ? this.on_wall_jump_vel_y_increment : 0)
        );
        if (this.TimerDash.running) {
          this.fixSizeDash(false);
        }
      } else {
        this.current_vel_y = 0;
      }

      /* * * * * * * * * * * * * * * * * * * * * * * * * * * * *
       * SHOOT
       */
      var shot_type = null;

      // Shoot and start charging
      if (ig.input.pressed('shoot')) {
        
        // Limit the amount of at a time.
        if (ig.game.getEntitiesByType(EntityPlayerPrimaryShot).length < 5) {
          shot_type = this.SHOT.BULLET;
          // Turn ON the shooting timer
          this.TimerShooting.reset();
        }

        // Start "chargin megashot" timer
        this.TimerMegaShot.reset();
      }

      // Stop charging and release the megashot if is loaded.
      if (ig.input.released('shoot')) {
        

        // Shot the megashot if it is loaded
        if (this.TimerMegaShot.delta() >= 3) {
          shot_type = this.SHOT.BIG_MEGASHOT;
        } else if (this.TimerMegaShot.delta() >= 1) {
          shot_type = this.SHOT.SMALL_MEGASHOT;
        }

        // Turn ON the shooting timer, like when press 'shoot'
        if (this.TimerMegaShot.delta() >= 1) {
          this.TimerShooting.reset();
        }

        // Stop "chargin megashot" timer
        this.TimerMegaShot.reset();
        this.TimerMegaShot.pause();
      }

      // spawn the shot
      if (shot_type) {
        if (this.ChargingFX) {
          this.ChargingFX.launchBack(this.flip);
          // Hide charging fx
          this.showCharging(false);
        }
        this.spawnShot(shot_type);
      }

      // Update the chargin FX
      if (ig.input.state('shoot') && this.TimerMegaShot.running) {
        if (this.TimerMegaShot.delta() >= 3) {
          this.ChargingFX.setIntensity(1);
        } else if(this.TimerMegaShot.delta() >= 1) {
          this.showCharging(true);
        }
      }
      
      /* * * * * * * * * * * * * * * * * * * * * * * * * * * * *
       * VELOCITY & ACCELERATION
       * Set this.vel.* and this.accel.* depeding on player status
       */
      this.vel.x = this.accel.x = this.current_vel_x;
      if (this.on_wall && !ig.input.pressed('jump')) {
        this.current_vel_y = this.on_wall_vel_y;
      }
      if (this.current_vel_y != 0) {
        this.vel.y = this.accel.y = this.current_vel_y;
      }
      
      /* * * * * * * * * * * * * * * * * * * * * * * * * * * * *
       * ON AIR
       * Change animation when player is on air, jumpin, falling or sliding
       * in the wall
       */
      if (this.vel.y < 0) {
        this.currentAnim = this.anims.jumping;
      } else if (this.vel.y > 0) {
        // On wall
        if (this.on_wall) {
          this.currentAnim = this.anims.on_wall;
        } else {
          this.currentAnim = this.anims.falling;
        }
      }
      
      /* * * * * * * * * * * * * * * * * * * * * * * * * * * * *
       * MODIFY CURRENT ANIMATION
       * Modify the current animation which was defined above
       */

      // Change animation alpha value when player is invincible or not.
      if (!this.TimerInvincible.running) {
        this.currentAnim.alpha = 1;
      } else {
        if (this.TimerInvincible.delta() < 0) {
          this.currentAnim.alpha = 0.4;
        } else {
          this.TimerInvincible.pause();
        }
      }

      this.currentAnim.flip.x = this.flip;
      this.parent();
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
          this.addAnim('on_wall', 1, [29]);
          this.addAnim('dash', 0.08, [31,32]);
        } else if (anim_tag == 'shooting') {
          this.addAnim('idle', 0.1, [11,12]);
          this.addAnim('running', 0.06, [13,13,14,15,16,17,17,17,18,19,20]);
          this.addAnim('jumping', 0.08, [23,24]);
          this.addAnim('falling', 0.08, [27,28]);
          this.addAnim('on_wall', 1, [30]);
          this.addAnim('dash', 0.08, [33,34]);
        }
      }
    },
    
    handleMovementTrace: function (res)
    {
      this.on_wall = (
        !this.standing
        && this.vel.y > 0
        && res.collision.x
      );

      // Stop dash when collides with something
      if (this.TimerDash.running
        && (!this.standing && (res.collision.x || res.collision.y))
      ) {
        this.setDash(false);
      }

      this.parent(res);
    },
    
    /**
     * Make invincible when receive damage
     */
    receiveDamage: function (amount, EntityFrom)
    {
      if (!this.TimerInvincible.running) {
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
      this.showCharging(false);
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
      this.TimerInvincible.set(time);
    },

    spawnShot: function (type)
    {
      var shotx = 0,
          shoty = 0,
          dashing = false,
          EntityShotType = null;

      // Set X position when dashing or not
      dashing = this.TimerDash.running && this.standing;
      if (dashing) {
        shotx = (this.flip ? -14 : 35);
      } else {
        shotx = (this.flip ? -9 : 30);
      }
      // Set the shot type and spawn position
      switch (type) {
        case this.SHOT.BULLET:
          EntityShotType = EntityPlayerPrimaryShot;
          shoty = (dashing ? 11 : (this.on_wall ? 16 : 12));
          break;
        case this.SHOT.SMALL_MEGASHOT:
          EntityShotType = EntityPlayerSmallMegaShot;
          // Set Y position when dashing, on wall or stading
          if (dashing) {
            shoty = 7;
          } else {
            shoty = (this.on_wall ? 13 : 9);
          }
          break;
        case this.SHOT.BIG_MEGASHOT:
          break;
      }

      // Add the offset player position to the shotx and shoty
      shotx += this.pos.x;
      shoty += this.pos.y;

      // Spawn the shot
      ig.game.spawnEntity(EntityShotType, shotx, shoty, {flip: this.flip});
    },

    setDash: function (on_dash)
    {
      if (on_dash) {
        this.TimerDash.reset();
      } else {
        this.TimerDash.pause();
      }
      this.fixSizeDash(on_dash);
    },

    fixSizeDash: function (on_dash)
    {
      if (on_dash) {
        this.size.y   = 34;
        this.offset.y = 14;
        this.pos.y    += 14;
      } else if (this.size.y == 34) {
        this.size.y   = 48;
        this.offset.y = 0;
        this.pos.y    -= 14;
      }
    },

    showCharging: function (show)
    {
      if (show && !this.ChargingFX) {
        this.ChargingFX = ig.game.spawnEntity(
          EntityPlayerCharging,
          this.pos.x,
          this.pos.y,
          {intensity: 0.5, EntityPlayerReference: this}
        );
      }

      if (!show && this.ChargingFX) {
          this.ChargingFX.kill();
          this.ChargingFX = null;
      }
    },
  });
});
