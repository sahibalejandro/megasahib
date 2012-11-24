/**
 * Player single shot
 */
ig.module(
  'game.entities.player-primary-shot'
)
.requires(
  'impact.entity',
  'game.entities.bullet',
  'game.entities.bullet-explode'
)
.defines(function ()
{
  /*
   * PRIMARY SHOT
   */
  EntityPlayerPrimaryShot = EntityBullet.extend({
    animSheet: new ig.AnimationSheet('media/player-primary-shot.png', 16, 8),
    checkAgainst: ig.Entity.TYPE.B,
    size: {x: 16, y: 8},
    maxVel: {x: 400, y: 0},
    damage: 1,
    
    init: function (x, y, settings)
    {
      this.parent(x, y, settings);
      this.addAnim('idle', 1, [0]);
      this.EntityExplode = EntityPlayerPrimaryShotExplode;
    }
  });
  
  EntityPlayerPrimaryShotExplode = EntityBulletExplode.extend({
    animSheet: new ig.AnimationSheet('media/player-primary-shot.png', 16, 8),
    size: {x: 16, y: 8},
    maxVel: {x: 0, y: 0},
    init: function (x, y, settings)
    {
      this.parent(x, y, settings);
      this.addAnim('idle', 0.1, [1,2]);
    },
  });
  
  /*
   * SMALL MEGASHOT
   */
  
  EntityPlayerSmallMegaShot = EntityBullet.extend({
    animSheet: new ig.AnimationSheet('media/player-small-megashot.png', 16, 8),
    size: {x: 16, y: 8},
    checkAgainst: ig.Entity.TYPE.B,
    maxVel: {x: 450, y: 0},
    damage: 2,
    init: function (x, y, settings)
    {
      this.parent(x, y, settings);
      this.addAnim('idle', 0.1, [0,1,2]);
      this.EntityExplode = EntityPlayerSmallMegaShotExplode;
    },
  });
  
  EntityPlayerSmallMegaShotExplode = EntityBulletExplode.extend({
    animSheet: new ig.AnimationSheet('media/player-small-megashot.png', 16, 8),
    size: {x: 16, y: 8},
    maxVel: {x: 0, y: 0},
    init: function (x, y, settings)
    {
      this.parent(x, y, settings);
      this.addAnim('idle', 0.1, [3,4]);
    },
  });
  
  /*
   * BIG MEGASHOT
   */
  
  EntityPlayerBigMegaShot = EntityBullet.extend({
    animSheet: new ig.AnimationSheet('media/xbuster.png', 61, 30),
    size: {x: 61, y: 30},
    checkAgainst: ig.Entity.TYPE.B,
    maxVel: {x: 500, y: 0},
    damage: 5,
    init: function (x, y, settings)
    {
      this.parent(x, y, settings);
      this.addAnim('start', 0.05, [0,1,2], true);
      this.addAnim('loop', 0.05, [3,4,5]);
      this.EntityExplode = EntityPlayerBigMegaShotExplode;
    },
    
    update: function ()
    {
      if (this.currentAnim == this.anims.start) {
        this.maxVel.x = 0;
        if (this.currentAnim.loopCount > 0) {
          this.currentAnim = this.anims.loop;
          this.maxVel.x = 470;
        }
      }
      this.parent();
    }
  });
  
  EntityPlayerBigMegaShotExplode = EntityBulletExplode.extend({
    animSheet: new ig.AnimationSheet('media/player-big-megashot.png', 32, 16),
    size: {x: 32, y: 16},
    maxVel: {x: 0, y: 0},
    init: function (x, y, settings)
    {
      this.parent(x, y, settings);
      this.addAnim('idle', 0.1, [2,3]);
    },
  });
});
