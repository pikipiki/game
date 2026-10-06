import {describe,it,expect} from 'vitest';
import {battleDistance,battlePathTo,BATTLE_TILES,key,CREATURES} from './data';
import {activeUnit,attackPosition,damage,newGame,reachable,reduce,type GameState} from './engine';
import {battlePoint,battleHexAt} from '../render/battle-space';
function battle():GameState {const s=newGame();s.hero={q:-1,r:-2};return reduce(s,{type:'fight',site:'camp1'});}

describe('Arène et clics sur les cases',()=>{
 it('retrouve chacune des 187 cases, aux rangées paires et impaires, avec un léger décalage de pointage',()=>{
  for(const hex of BATTLE_TILES) {const p=battlePoint(hex);for(const [x,z] of [[0,0],[0.2,0.1],[-0.2,-0.1]])expect(battleHexAt(p.x+x,p.z+z)).toEqual(hex);}
  expect(battleHexAt(1000,1000)).toBeNull();
 });
 it('suit des voisins réels sur les rangées décalées et évite les obstacles',()=>{
  const path=battlePathTo({q:0,r:0},{q:16,r:10},BATTLE_TILES,new Set(['8,5']));
  let old={q:0,r:0};for(const h of path){expect(battleDistance(old,h)).toBe(1);expect(key(h)).not.toBe('8,5');old=h;}
  expect(old).toEqual({q:16,r:10});
 });
});
describe('Tactiques proches de Heroes III',()=>{
 it('la vitesse donne la portée de déplacement au lieu de deux cases fixes',()=>{
  const s=battle(),a=activeUnit(s)!;expect(CREATURES[a.creature].speed).toBe(4);
  expect(reachable(s).some(h=>battleDistance(a,h)===4)).toBe(true);
  a.slowed=true;expect(reachable(s).every(h=>battleDistance(a,h)<=1)).toBe(true);
 });
 it('attend une seule fois et rejoue à la fin du round',()=>{
  let s=battle();const id=activeUnit(s)!.id;s=reduce(s,{type:'wait'});expect(s.battle!.waiting).toContain(id);
  for(let i=0;i<8&&s.battle!.active!==id;i++)s=reduce(s,activeUnit(s)!.side==='enemy'?{type:'enemy'}:{type:'defend'});
  expect(s.battle!.active).toBe(id);expect(s.battle!.round).toBe(1);expect(reduce(s,{type:'wait'})).toBe(s);
 });
 it('les tirs lointains sont réduits et dépensent des munitions',()=>{
  const s=battle(),a=activeUnit(s)!,target=s.battle!.units.find(u=>u.side==='enemy')!;
  const close={...target,q:a.q+3,r:a.r};expect(damage(a,target)).toBeLessThan(damage(a,close));
  const next=reduce(s,{type:'attack',target:target.id});expect(next.battle!.units.find(u=>u.id===a.id)!.shots).toBe(11);
 });
 it('un archer engagé ne tire pas sur une autre troupe à distance',()=>{
  const s=battle(),a=activeUnit(s)!;s.battle!.units.find(u=>u.id==='enemy-0')!.q=a.q+1;s.battle!.units.find(u=>u.id==='enemy-0')!.r=a.r;
  expect(attackPosition(s,s.battle!.units.find(u=>u.id==='enemy-1')!)).toBeNull();
 });
 it('une attaque de mêlée déclenche une riposte limitée à une par round',()=>{
  const s=battle();s.battle!.active='army-sylve';const a=activeUnit(s)!,target=s.battle!.units.find(u=>u.id==='enemy-0')!;
  Object.assign(a,{q:4,r:4});Object.assign(target,{q:5,r:4,hp:240,maxHp:240});
  const next=reduce(s,{type:'attack',target:target.id});expect(next.battle!.units.find(u=>u.id===a.id)!.hp).toBeLessThan(a.hp);expect(next.battle!.units.find(u=>u.id===target.id)!.retaliated).toBe(true);
  next.battle!.active=a.id;const hp=next.battle!.units.find(u=>u.id===a.id)!.hp;const again=reduce(next,{type:'attack',target:target.id});expect(again.battle!.units.find(u=>u.id===a.id)!.hp).toBe(hp);
 });
 it('avance et frappe en une action lorsque la cible est à portée de marche',()=>{
  const s=battle();s.battle!.active='army-sylve';const a=activeUnit(s)!,target=s.battle!.units.find(u=>u.id==='enemy-0')!;
  Object.assign(a,{q:3,r:3});Object.assign(target,{q:6,r:3});const position=attackPosition(s,target)!;expect(position).not.toBeNull();
  const next=reduce(s,{type:'attack',target:target.id});const moved=next.battle!.units.find(u=>u.id===a.id)!;expect(battleDistance(moved,target)).toBe(1);expect(next.battle!.units.find(u=>u.id===target.id)!.hp).toBeLessThan(target.hp);
 });
 it('le héros ne lance qu’un sort par round tout en laissant jouer sa troupe',()=>{
  const s=battle(),id=activeUnit(s)!.id,next=reduce(s,{type:'spell',spell:'bolt',target:'enemy-0'});
  expect(next.battle!.active).toBe(id);expect(reduce(next,{type:'spell',spell:'bolt',target:'enemy-1'})).toBe(next);
 });
});
