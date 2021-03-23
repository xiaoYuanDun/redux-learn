// 需要 TS 4.2.3+
const initSate = {
  total: 0,
  conditions: {
    current: 1,
    sons: {
      haha: '321',
      eiei: 123,
    },
  },
  name: 'xiao',
};
type m = typeof initSate;

type AddPrefix<T, S extends string> = keyof {
  [K in keyof T as `${S}.${K & string}`]: any;
};

type PowerKeys<T, K extends keyof T = keyof T> = {
  [k1 in K]: T[k1] extends object
    ? k1 | AddPrefix<PowerKeys<T[k1]>, k1 & string>
    : k1;
} extends infer R
  ? {
      [k2 in keyof R as `${R[k2] & string}`]: R[k2];
    }
  : any;

// type o = PowerKeys<m['conditions']>
type o = PowerKeys<m>;

type frf = {
  [K in keyof o]: o[K];
}[keyof o];

type ie = AddPrefix<o, 'conditions'>;
