/**
 * Checkpoint entity, invisible in game, visible in weltmeister
 */
ig.module(
  'game.entities.checkpoint'
)
.requires(
  'impact.entity'
)
.defines(function ()
{
  EntityCheckpoint = ig.Entity.extend({
    animSheet: new ig.AnimationSheet('media/checkpoint.png', 16, 32),
    size: {x: 16, y: 32},
    checkAgainst: ig.Entity.TYPE.A,
    zIndex: 0,
    
    init: function (x, y, settings)
    {
      this.parent(x, y, settings);
      this.addAnim('idle', 1, [0]);
    },
    
    /**
     * Check against TYPE A entities, (the player) to save the check point position
     */
    check: function (Player)
    {
      this.parent(Player);
      
      this.addAnim('idle', 0.1, [0,1]);
      this.currentAnim  = this.anims.idle;
      this.checkAgainst = ig.Entity.TYPE.NONE;
      
      ig.game.setPlayerSpawnPosition(
        this.pos.x,
        (this.pos.y + this.size.y) - Player.size.y
      );
    },
  });
});
