/**
 * Entity when player is chargin a shot
 */
ig.module(
  'game.entities.player-charge'
)
.requires(
  'impact.entity'
)
.defines(function ()
{
    EntityPlayerCharge = ig.Entity.extend({
      animSheet: new ig.AnimationSheet('media/player.png', 72, 64),
      size: {x: 72, y: 64},
      big_charge: false,
      init: function (x, y, settings)
      {
        this.parent(x, y, settings);
        this.addAnim('small', 0.06, [38,39]);
        this.addAnim('big', 0.06, [40,41]);
      },
      
      update: function ()
      {
        this.parent();
        var Player = ig.game.getEntitiesByType(EntityPlayer)[0];
        
        if (Player) {
          if (!this.big_charge && Player.megashot_big) {
            this.big_charge = true;
            this.currentAnim = this.anims.big;
          }
          this.pos.x = Player.pos.x - Player.offset.x;
          this.pos.y = Player.pos.y - Player.offset.y;
        }
        
        this.currentAnim.alpha = 0.2;
      },
    });
});
