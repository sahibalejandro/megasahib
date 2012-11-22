/**
 * Entity for a bullet when explode
 */
ig.module(
  'game.entities.bullet-explode'
)
.requires(
  'impact.entity'
)
.defines(function ()
{
  EntityBulletExplode = ig.Entity.extend({
    flip: false,
    vflip: false,
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
    },
    
    update: function ()
    {
      this.currentAnim.flip.x = this.flip;
      this.currentAnim.flip.y = this.vflip;
      this.parent();
      
      if (this.currentAnim.loopCount > 0) {
        this.kill();
      }
    },
  });
});
