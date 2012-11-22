/**
 * Entity to "Lever Clear" and go to next level
 */
ig.module(
  'game.entities.level-clear'
)
.requires(
  'impact.entity'
)
.defines(function ()
{
  EntityLevelClear = ig.Entity.extend({
    _wmDrawBox: true,
    _wmBoxColor: '#0000ff',
    _wmScalable: true,
    checkAgainst: ig.Entity.TYPE.A,
    zIndex: 0,
    
    /**
     * Check against TYPE A entities, (the player) to save the check point position
     */
    check: function (Player)
    {
      this.parent(Player);
      this.checkAgainst = ig.Entity.TYPE.NONE;
      ig.game.levelClear();
    },
  });
});
