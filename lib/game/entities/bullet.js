/**
 * Single bullet vehabior
 */
ig.module(
  'game.entities.bullet'
)
.requires(
  'impact.entity'
)
.defines(function()
{
  EntityBullet = ig.Entity.extend({
    flip: false,
    vflip: false,
    EntityExplode: null,
    
    init: function (x, y, settings)
    {
      this.parent(x, y, settings);
      
      if (typeof settings.flip == 'undefined') {
        settings.flip = false;
      }
      
      if (typeof settings.vflip == 'undefined') {
        settings.vflip = false;
      }
      
      this.flip  = settings.flip;
      this.vflip = settings.vflip;

      // Fix X position when is flip
      if (this.flip) {
        this.pos.x -= this.size.x;
      }
    },
    
    update: function ()
    {
      this.vel.x = this.accel.x = this.flip ? -this.maxVel.x : this.maxVel.x;
      this.vel.y = this.accel.x = this.vflip ? -this.maxVel.y : this.maxVel.y;
      this.currentAnim.flip.x = this.flip;
      this.currentAnim.flip.y = this.vflip;
      this.parent();
    },
    
    check: function (other)
    {
      this.parent(other);
      other.receiveDamage(this.damage, this);
      this.kill();
    },
    
    handleMovementTrace: function(res)
    {
      this.parent(res);
      
      if (res.collision.x || res.collision.y) {
        this.kill();
      } else if (
        // Remove if is out of screen
        res.pos.x > (ig.game.screen.x + ig.system.width)
        || res.pos.x < (ig.game.screen.x - this.size.x)
        || res.pos.y < (ig.game.screen.y - this.size.y)
        || res.pos.y > (ig.game.screen.y + ig.system.height)) {
        ig.game.removeEntity(this);
      }
    },
    
    kill: function ()
    {
      this.parent();
      if (this.EntityExplode) {
        ig.game.spawnEntity(this.EntityExplode, this.pos.x, this.pos.y, {
          flip: this.flip,
          vflip: this.vflip
        });
      }
    },
    
  });
});
