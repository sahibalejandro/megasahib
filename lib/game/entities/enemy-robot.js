/**
 * Enemy base class
 */
ig.module(
  'game.entities.enemy-robot'
)
.requires(
  'impact.entity'
)
.defines(function (){
  EntityEnemyRobot = ig.Entity.extend({
    animSheet: new ig.AnimationSheet('media/enemy-robot.png', 32, 32),
    checkAgainst: ig.Entity.TYPE.A,
    type: ig.Entity.TYPE.B,
    size: {x: 32, y: 32},
    zIndex: 1,
    health: 10,
    
    maxVel: {x: 50, y: 300},
    flip: false,
    
    init: function (x, y, settings)
    {
      this.parent(x, y, settings);
      this.addAnim('idle', 1, [0]);
    },
    
    update: function ()
    {
      this.vel.x = this.accel.x = (this.flip ? -this.maxVel.x : this.maxVel.x);
      this.parent();
    },
    
    handleMovementTrace: function (res)
    {
      // Walk in other direction if collides
      if (res.collision.x) {
        this.flip = !this.flip;
        this.currentAnim.flip.x = this.flip;
      }
      this.parent(res);
    },
    
    check: function (other)
    {
      this.parent(other);
      other.receiveDamage(10, this);
    },
    
  });
});
