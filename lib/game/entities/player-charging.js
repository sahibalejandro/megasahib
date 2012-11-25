/**
 * Entity for spawn chargin sparks
 */
ig.module(
  'game.entities.player-charging'
)
.requires(
  'impact.entity'
)
.defines(function ()
{
  /*
   * Emitter
   */
  EntityPlayerCharging = ig.Entity.extend({
    /* Intensity, from 0 to 1 */
    intensity: 0,
    maxVel: {x: 0, y: 0},
    EntityPlayerReference: null,
    init: function (x, y, settings)
    {
      this.parent(x, y, settings);
      this.insensity = settings.intensity;
      this.EntityPlayerReference = settings.EntityPlayerReference;
      this.size.x = this.EntityPlayerReference.size.x + 10;
    },

    update: function ()
    {
      this.pos.x = this.EntityPlayerReference.pos.x - 5;
      this.pos.y = this.EntityPlayerReference.pos.y;

      /* Calculate the center of the emitter, this help to know if the spark
       * float to left or right */
      var center = this.pos.x + (this.size.x / 2);

      if (Math.random() < 1) {
        ig.game.spawnEntity(
          EntityPlayerChargingSpark,
          this.pos.x + (Math.random() * this.size.x),
          this.pos.y + (Math.random() * this.EntityPlayerReference.size.y),
          {intensity: this.intensity, center: center}
        );
      }

      this.parent();
    },
    setIntensity: function (intensity)
    {
      this.intensity = intensity;
    },

    launchBack: function (flip) {
      var sparks = ig.game.getEntitiesByType(EntityPlayerChargingSpark);
      var angle = Math.PI / 2;
      for(var i = 0; i < sparks.length; i++) {
        sparks[i].vel.x = sparks[i].accel.x = flip ? 150 : -150;
        sparks[i].vel.y = sparks[i].accel.y = 0;
        sparks[i].currentAnim.angle = angle;
      }
    }
  });

  /*
   * Spark
   */
  EntityPlayerChargingSpark = ig.Entity.extend({
    animSheet: new ig.AnimationSheet('media/player-charging-spark.png', 1, 2),
    size: {x: 1, y: 2},
    maxVel: {x: 150, y: 10},
    gravityFactor: 0,

    init: function (x, y, settings)
    {
      this.parent(x, y - 2, settings);
      this.addAnim('idle', 1, [settings.intensity]);
      this.TimerLife = new ig.Timer(Math.random() * 0.5);
      this.currentAnim.alpha = 0.3 + (Math.random() * 0.7);


      this.vel.y = this.accel.y = -this.maxVel.y;
      //this.vel.x = this.accel.x = (x < settings.center ? -10 : 10);
      //this.currentAnim.angle = (x < settings.center ? -Math.PI/4 : Math.PI/4);
    },

    update: function ()
    {
      if (this.TimerLife.delta() > 0) {
        this.kill();
      } else {
        this.parent();
      }
    }
  });
});
