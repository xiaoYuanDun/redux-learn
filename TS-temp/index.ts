import { EffectsMapObject, EffectsCommandMap } from 'dva';
import { ReducersMapObject, AnyAction } from 'redux';

type DvaModelLike = {
  namespace: string;
  state: any;
  reducers: { [key: string]: any };
  effects: { [key: string]: any };
  subscriptions?: { [key: string]: any };
};

const initState = {
  name: 'xiaoMing',
  age: 18,
};

type State = typeof initState;

const model = {
  namespace: 'hook-example',
  state: initState,
  reducers: {
    extraAction(state: State, payload: { id: string; age: number }) {
      console.log(111);
      return state;
    },
    add(state: State) {
      console.log(222);
      return state;
    },
    sec(state: State) {
      console.log(333);
      return state;
    },
    insert(state: State, recore?: string) {
      console.log('insert user data', recore);
    },
    submit(state: State, data: Record<string, any>) {
      console.log('payload');
    },
  },
  effects: {
    *fetchData({ call }: any, name: { big: string }) {
      console.log('fetch data');
    },
    *fetchUserData({ call, put }: any, id: string) {
      console.log('fetch user data');
      console.log('userId', id);
      put('userData');
    },
    *save({ call }: any, id?: string) {
      console.log(id);
    },
    *login({ call }: any) {
      console.log('login');
    },
    // *fetchData(name: number, { call }: any) {
    //   console.log('fetch data');
    // },
    // *fetchUserData(id: string, { call, put }: any) {
    //   console.log('fetch user data');
    //   console.log('userId', id);
    //   put('userData');
    // },
    // *login({ call }: any) {
    //   console.log('login');
    // },
  },
};

// /**
//  *
//  * 改造 reducers 结构, 源生的 reducer 函数结构为 (state, action: { type: string, payload: any }) => any
//  * 我们在定义 reducer 时只关注 payload(extra) 属性, 函数结构略有不同, 需要转化为源生的 reducer 格式
//  *
//  * 可以理解为 payload 于 action 之间的拆包和装包
//  *
//  */

// const reducerWrapper = (reducers: ReducersMapObject) => {
//   Object.keys(reducers).reduce<ReducersMapObject>((acc, cur) => {
//     acc[cur] = (state: State, { payload }: AnyAction) =>
//       reducers[cur](state, payload);
//     return acc;
//   }, {});
// };

// const effectWrapper = (effects: EffectsMapObject) => {
//   Object.keys(effects).reduce<EffectsMapObject>((acc, cur) => {
//     acc[cur] = ({ payload }: AnyAction, effects: EffectsCommandMap) =>
//       effects[cur](
//         {
//           ...effects,
//           put: (type: string, pl: { [extraProps: string]: unknown }) =>
//             effects.put({ type, payload: pl }),
//         },
//         payload
//       );
//     return acc;
//   }, {});
// };

/**
 *
 * 根据 key 找到对应的 reducer | effect, 从中提取正确的 extra 类型
 * 如果通过某个 key 找的的 reducer | effect 中, extra 为可选参数, 这里直接把他处理为非可选
 *
 * 一个可选 extra 的样例为:
 * insert(state: State, recore?: string) { ... }
 *
 * 如果想在使用时得到正确提示, 需要把这个函数重载为以下两种形式:
 * 1. insert(state: State, recore: string) { ... }
 * 2. insert(state: State) { ... }
 *
 * 因为这个工具类是用于统一处理 '携带了 extra 的 reducer' 的, 所以这里做第一种重载
 *
 * GetKeysWithExtra 是 GetKeysWithPartialExtra 的超集, 所以这里要一层额外的判断
 *
 */
type GetCurAction<T, K extends GetKeysWithExtra<Processer<T>>> = T[K] extends (
  args: any,
  extra: infer R
) => any
  ? K extends GetKeysWithPartialExtra<Processer<T>>
    ? Exclude<R, undefined>
    : R
  : never;

// type GetExtre<T> = unknown extends T ? {} : T;

/**
 *
 * 把 reducer | effect 对象的形式转换为我们需要的类型格式(对象转union), 如:
 *
 * type origin = {
 *   extraAction(state: State, payload: {
 *     id: string;
 *     age: number;
 *   }): any;
 *   add(state: State): any;
 *   insert(state: State, userData: string): void;
 *  }
 *
 * type target =
 *   | ((key: 'extraAction', extra: { id: string; age: number }) => any)
 *   | ((key: 'add', extra: unknown) => any)
 *   | ((key: 'insert', extra: string) => any);
 *
 */
type Processer<T, K extends keyof T = keyof T> = {
  [key in K]: T[key] extends (state: any, extra: infer R) => any
    ? (key: key, extra: R) => any
    : {};
}[K];

/**
 *
 * 判断新函数第二个参数(extra)类型, 若为 unknown 表示在上一步根本不存在 extra
 * 这样就可以区分有无 extra 参数, 取到函数 extra 的 key 集合
 * !!!  这里注意, unknown 为顶级类型, 任何类型 extends unknown 都成立
 * !!!  所以要判断一个类型 T 是否为 unknown, 就使用 unknown extends T
 * !!!  不能使用 any, 若存在 any, 会被判为 '不带extra的action'
 * TODO  这里存在一个问题, 如果把 GetKeysWithExtra 拆分为两个步骤会得到不同结果
 * TODO  大概猜想是由于 '分布式条件类型'/'裸类型' 引起的, 后期找时间测试, 这里的知识点还不是很清晰
 * TODO  两个步骤如下:
 * TODO  type AWE1<T> = T extends (key: any, extre: infer R1) => any ? R1 : never
 * TODO  type AWE1<T> = unknown extends T ? never : T;
 *
 */
type GetKeysWithExtra<T> = T extends (key: infer R, extre: infer R1) => any
  ? unknown extends R1
    ? never
    : R
  : never;

/**
 *
 * 通过 extends extra? 判断是否有可选参数时, 会得到如下结果(这里以 AllReducers 为例):
 *
 * type PartialExtra =
 *   | ((key: 'add', extra: unknown) => any)
 *   | ((key: 'sec', extra: unknown) => any)
 *   | ((key: 'insert', extra: string) => any);
 *
 * 可以发现, 不包含 extra 的函数也通过了验证, 不过其类型为 unknown, 而真正的可选参数类型为定义时的类型
 * 可以通过这一点来区分它们
 *
 */
type GetKeysWithPartialExtra<T> = T extends (
  key: infer R,
  extra?: infer R1
) => any
  ? unknown extends R1
    ? never
    : R
  : never;

// type Model = typeof model;

type AllReducers<M = {}> = M extends DvaModelLike ? M['reducers'] : {};

// // 整体处理 reducers 格式
// type ProcessedReducers = ReducerProcesser<AllReducers>;

// // 得到 包含可选extra 的reducer的key的集合
// type KeysWithPartialExtra = GetKeysWithPartialExtra<ProcessedReducers>;

// // 得到 包含extra的reducer 的key的集合
// type KeysWithExtra = GetKeysWithExtra<ProcessedReducers>;

// /**
//  * 得到 不包含extra 的reducer的key的集合
//  *
//  * 因为包含可选extra 的key集合需要同时出现在 KeysWithExtra, KeysWithPartialExtra 中
//  * 所以这里做一个简单处理
//  */
// type NoExtea = Exclude<
//   keyof AllReducers,
//   Exclude<KeysWithExtra, KeysWithPartialExtra>
// >;

// type ReducerWithExtra = <T extends KeysWithExtra>(
//   type: T,
//   extra: GetExtre<GetCurAction<T>>
// ) => void;

// // type ReducerWithoutExtra = (type: NoExtea) => void;

// // const commit: ReducerWithoutExtra & ReducerWithExtra = () => {};

// // -- -- -- -- -- -- --
type AllEffects<M = {}> = M extends DvaModelLike ? M['effects'] : {};

// // commit('submit');

// type EffectProcesser<T, K extends keyof T = keyof T> = {
//   [key in K]: T[key] extends (effects: any, extra: infer R) => any
//     ? (key: key, extra: R) => any
//     : never;
// }[K];

// type GetEffectsKeysWithPartialExtra<T> = T extends (
//   key: infer R,
//   extra?: infer R1
// ) => any
//   ? unknown extends R1
//     ? never
//     : R
//   : never;

// type GetEffectsKeysWithExtra<T> = T extends (
//   key: infer R,
//   extra: infer R1
// ) => any
//   ? unknown extends R1
//     ? never
//     : R
//   : never;
// // 整体处理 effects 格式
// type ProcessedEffects = EffectProcesser<AllEffects>;

// // 得到 包含可选extra 的effect的key的集合
// type EffectsKeysWithPartialExtra = GetEffectsKeysWithPartialExtra<ProcessedEffects>;

// // 得到 包含extra 的effect的key的集合
// type EffectsKeysWithExtra = GetEffectsKeysWithExtra<ProcessedEffects>;

// // 得到 不包含extra 的effect的key的集合
// type EffectsKeysWithNoExtea = Exclude<
//   keyof AllEffects,
//   Exclude<EffectsKeysWithExtra, EffectsKeysWithPartialExtra>
// >;

// type GetCurEffectAction<
//   T extends EffectsKeysWithExtra
// > = AllEffects[T] extends (funcs: any, extra: infer R) => any
//   ? T extends EffectsKeysWithPartialExtra
//     ? Exclude<R, undefined>
//     : R
//   : never;

// type EffectWithExtra = <T extends EffectsKeysWithExtra>(
//   type: T,
//   extra: GetExtre<GetCurEffectAction<T>>
// ) => void;

// type WithoutExtra = (type: NoExtea | EffectsKeysWithNoExtea) => any;
// // type EffectWithoutExtra = (type: EffectsKeysWithNoExtea) => void;

// // const commit: ReducerWithExtra & EffectWithExtra & WithoutExtra = () => {};

// type Processer<T, K extends keyof T = keyof T> = {
//   [key in K]: T[key] extends (state: any, extra: infer R) => any
//     ? (key: key, extra: R) => any
//     : {};
// }[K];

type GetInfoWithExtra<
  M extends DvaModelLike,
  S extends 'reducers' | 'effects',
  R = S extends 'reducers' ? AllReducers<M> : AllEffects<M>
> = <T extends GetKeysWithExtra<Processer<R>>>(
  type: T,
  extra: GetCurAction<R, T>
) => any;

type GetInfoWithNoExtra<
  M extends DvaModelLike,
  S extends 'reducers' | 'effects',
  R = S extends 'reducers' ? AllReducers<M> : AllEffects<M>
> = Exclude<
  keyof R,
  Exclude<GetKeysWithExtra<Processer<R>>, GetKeysWithPartialExtra<Processer<R>>>
>;

type CommitWith<M extends DvaModelLike> = (
  type: GetInfoWithNoExtra<M, 'reducers'> | GetInfoWithNoExtra<M, 'effects'>
) => any;

type reducers = GetInfoWithExtra<typeof model, 'reducers'>;
const commit: reducers = () => {};
commit('extraAction', { id: '2', age: 2 });
commit('insert', '312');
commit('submit', { s: 2 });

type effects = GetInfoWithExtra<typeof model, 'effects'>;
const commit1: effects = () => {};
commit1('fetchData', { big: '3' });
commit1('fetchUserData', '2');
commit1('save', '3');

type noExtra = CommitWith<typeof model>;
const commit2: noExtra = () => {};
commit2('insert');
commit2('add');

type GetAllInfo<M extends DvaModelLike> = GetInfoWithExtra<
  typeof model,
  'reducers'
> &
  GetInfoWithExtra<typeof model, 'effects'> &
  CommitWith<M>;

type allInfo = GetAllInfo<typeof model>;
const commit3: allInfo = () => {};
commit3('add');
commit3('extraAction', { id: '2', age: 0 });
commit3('fetchData', { big: '2' });

// commit('submit', { a: 2 });
// // commit('extraAction');

// // type Fus<T> = T extends (k1: any, ...args: infer R) => any ? R : never;

// // function h(name: string, age?: number) {}

// // type Fu<T, K extends keyof T = keyof T> = {
// //   [key in K]: T[key] extends (state: any, extra: infer R) => any
// //     ? (key: key, extra: R) => any
// //     : {};
// // }[K];

// // // AllReducers

// // type As = Fus<(name: 1, age: any) => any>;

// // type ZXc = [] extends [] ? string : number

// // 这里想到一个思路, 使用可变参数 ... 来描述可变参数的形状, 测试了一下, 觉得可行, 明天继续
