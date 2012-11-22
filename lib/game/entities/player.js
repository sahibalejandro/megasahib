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
    health: 100,
    flip: false,
    zIndex: 2,
    maxVel: {x: 180, y: 300},
    current_vel_x: 0,
    current_vel_y: 0,
    on_wall_vel_y: 40,
    on_wall_jump_vel_y_increment: 200,
    on_wall: false,

    // Shot types
    SHOT: {
      BULLET: 1,
      SMALL_MEGASHOT: 2,
      BIG_MEGASHOT: 4
    },
    
    // Curreng animation tag
    anim_tag: 'normal',

    // Timers
    TimerShooting: null,
    TimerMegaShot: null,
    
    init: function (x, y, settings)
    {
      this.parent(x, y, settings);
      this.current_vel_x = this.maxVel.x;
      this.current_vel_y = this.maxVel.y;
      this.setAnims('normal');

      // Start timers
      this.TimerShooting = new ig.Timer(0.3);
      this.TimerShooting.pause();
      
      this.TimerMegaShot = new ig.Timer();
      this.TimerMegaShot.pause();
    },
    
    update: function ()
    {
      /* * * * * * * * * * * * * * * * * * * * * * * * * * * * *
       * SET ANIMATIONS "normal" or "shooting"
       */
      if (this.TimerShooting.tick() != 0 ){
        // Shooting timer is ON

        if (this.TimerShooting.delta() < 0) {
          // Shooting time!
          this.setAnims('shooting');
        } else {
          // Stop shooting anim
          this.setAnims('normal');
          this.TimerShooting.reset();
          this.TimerShooting.pause();
        }
      }

      /* * * * * * * * * * * * * * * * * * * * * * * * * * * * *
       * MOVEMENT
       * Set the current_vel_x, current_vel_y, and current animation depending on
       * player movement and status.
       */
      
      // Run
      if (ig.input.state('left')) {
        this.flip = this.on_wall ? false : true;
        this.current_vel_x = -this.maxVel.x;
        this.currentAnim = this.anims.running;
      } else if (ig.input.state('right')) {
        this.flip = this.on_wall ? true : false;
        this.current_vel_x = this.maxVel.x;
        this.currentAnim = this.anims.running;
      } else {
        this.current_vel_x = 0;
        this.currentAnim = this.anims.idle;
      }
      
      // Jump (or jump on wall)
      if ((this.standing || this.on_wall) && ig.input.pressed('jump')) {
        this.current_vel_y = -(
          this.maxVel.y + (this.on_wall ? this.on_wall_jump_vel_y_increment : 0)
        );
      } else {
        this.current_vel_y = 0;
      }

      /* * * * * * * * * * * * * * * * * * * * * * * * * * * * *
       * SHOOT
       */
      var shot_type = null;

      if (ig.input.pressed('shoot')) {
        shot_type = this.SHOT.BULLET;

        // Turn ON the shooting timer
        this.TimerShooting.reset();

        // Start "chargin megashot" timer
        this.TimerMegaShot.reset();
      }
      if (ig.input.released('shoot')) {
        // Shot the megashot if it is loaded
        if (this.TimerMegaShot.delta() >= 2) {
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
      switch (shot_type) {
        case this.SHOT.BULLET:
          console.log('bullet');
          break;
        case this.SHOT.SMALL_MEGASHOT:
          console.log('small megashot');
          break;
        case this.SHOT.BIG_MEGASHOT:
          console.log('big megashot');
          break;
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
          this.addAnim('dash', 0.08, [21]);
        } else if (anim_tag == 'shooting') {
          this.addAnim('idle', 0.1, [11,12]);
          this.addAnim('running', 0.06, [13,13,14,15,16,17,17,17,18,19,20]);
          this.addAnim('jumping', 0.08, [23,24]);
          this.addAnim('falling', 0.08, [27,28]);
          this.addAnim('on_wall', 1, [30]);
          this.addAnim('dash', 0.08, [23]);
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
