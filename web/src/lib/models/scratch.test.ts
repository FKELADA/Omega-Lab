import { it } from 'vitest';
import { hpInfo, fsysInfo, cdsInfo, ssrInfo } from './module8';
it('dump', () => {
  const h = { P: 0.9, Xe: 0.65, KA: 200, Kpss: 0 };
  const o: any = {};
  o.avr = [10, 15, 20, 30].map((KA) => [KA, (100 * hpInfo({ ...h, KA }).zeta).toFixed(2), hpInfo({ ...h, KA }).stable]);
  o.pss = [5, 10, 20].map((Kpss) => [Kpss, (100 * hpInfo({ ...h, Kpss }).zeta).toFixed(1)]);
  o.weak = [5, 10, 20].map((Kpss) => [Kpss, (100 * hpInfo({ ...h, Kpss, Xe: 0.95 }).zeta).toFixed(1)]);
  o.load = [0.4, 0.6].map((P) => (100 * hpInfo({ ...h, P }).zeta).toFixed(1));
  o.fs = [0.6, 0.75, 0.9].map((share) => [share, fsysInfo({ share, gfm: 0, ffr: 0 }).rocof.toFixed(2), fsysInfo({ share, gfm: 0, ffr: 0 }).nadir.toFixed(2)]);
  o.fsfix = [[0.8, 0.3, 0], [0.8, 0.5, 0], [0.8, 0, 1500], [0.8, 0, 3000]].map(([share, gfm, ffr]) => { const k = fsysInfo({ share, gfm, ffr }); return [share, gfm, ffr, k.rocof.toFixed(2), k.nadir.toFixed(2), k.ufls, k.rocofTrip]; });
  o.cds = [[1.5, 60, 1], [1.5, 60, 0.5], [1.5, 60, 0.3], [1.6, 80, 1], [1.6, 20, 1]].map(([SCR, fpll, P]) => [SCR, fpll, P, cdsInfo({ SCR, fpll, P }).stable]);
  o.ssr = [[0.5, 14.6, 0.1, 0], [0.5, 14.6, 1, 0], [0.5, 14.6, 0.5, 0], [0.5, 14.6, 0.1, 1]].map(([k, fm, zetaM, mitig]) => ssrInfo({ k, fm, zetaM, mitig }).sigma.toFixed(2));
  throw new Error(JSON.stringify(o));
});
