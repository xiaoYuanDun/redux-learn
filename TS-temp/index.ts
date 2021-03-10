type State = any;
type sagaCall = {
  call: Function;
  put: Function;
};

const model = {
  reducer: {
    extraAction(state: State, payload: { id: string; age: number }) {
      console.log(111);
      return state;
    },
    add(state: State) {
      console.log(222);
      return state;
    },
    insert(state: State, userData: string) {
      console.log('insert user data', userData);
    },
    submit(state: State, payload: number) {
      console.log('payload');
    },
  },
  effects: {
    *fetchData({ call }: sagaCall) {
      console.log('fetch data');
    },
    *fetchUserData(id: string, { call, put }: sagaCall) {
      console.log('fetch user data');
      console.log('userId', id);
      put('userData');
    },
  },
};

/**
 * 整理需求，总结函数类型:
 * 1. reducer 函数有可能不带 payload, 只有一个默认参数 state, 最多2个参数
 * 2. reducer state 参数总是位于第一个
 * 3. effects 函数有可能不带 payload, 只有一个默认 sagaCall 参数, 最多2个参数
 * 4. effects 有2个参数时, payload 位于首位, 有1个参数时, sagaCall 参数位于首位
 */

// 思路1, 全部使用 函数重载进行
// 得到 Model 类型
type Model = typeof model;

// 得到所有 reducer, effect 包含的 function, 用于后面的类型提示
type AllReducer = Model['reducer'];
type AllFunction = AllReducer & Model['effects'];

type GetOverload<T, K extends keyof T = keyof T> = {
  [k in K]: (type: k) => any;
};

type Values<T, K extends keyof T = keyof T> = T[K];

type AllTypedObj = GetOverload<AllFunction>;

type Res1 = Values<AllTypedObj>;

type Jiagong1<T> = T extends any ? (temp: T) => void : never;
type r1 = Jiagong1<Res1>;

type Jiagong2<T> = [T] extends [(k: infer R) => void] ? R : never;
type r2 = Jiagong2<r1>;

const commit: r2 = () => {};

// commit('extraAction')

// commit('extraAction')

// 思路2, 构造对应格式进行
type P1<T, K extends keyof T = keyof T> = T extends any ? T[K] : never;

// function commit2<T extends keyof AllReducer>(type: T) {}

// type GetCurAction<T extends keyof AllReducer> = AllReducer[T];
// type GetParams<T> = T extends (state: any, extra: infer R) => any ? R : never;

type Comm = ((id: '1') => any) & ((name: '2') => any);
const ddd: ((id: '1') => any) & ((name: '2') => any) = () => {};

type GetCurAction<T extends keyof AllReducer> = AllReducer[T] extends (
  state: any,
  extra: infer R
) => any
  ? R
  : never;

type GetExtre<T> = unknown extends T ? {} : T;

function commit2<T extends keyof AllReducer>(
  type: T,
  extra: GetExtre<GetCurAction<T>>
) {}
// function commit2<T extends keyof AllReducer>(type: GetSingleType<T>) {}

type zas = GetCurAction<'extraAction'>;
type z2 = GetExtre<zas>;

/**
 * 把 reducer 集合的形式转换为我们需要的类型格式(对象转union), 如:
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
 * type target = ((key: 'extraAction', extra: { id: string; age: number }) => any)
 *   | ((key: 'add', extra: unknown) => any)
 *   | ((key: 'insert', extra: string) => any);
 *
 */
type ReducerProcesser<T, K extends keyof T = keyof T> = {
  [key in K]: T[key] extends (state: any, extra: infer R) => any
    ? (key: key, extra: R) => any
    : {};
}[K];

/**
 * 判断新函数第二个参数(extra)类型, 若为 unknown 表示在上一步根本不存在 extra
 * 这样就可以区分有无 extra 参数, 取到函数 extra 的 key 集合
 * !!!  这里注意, unknown 为顶级类型, 任何类型 extends unknown 都成立
 * !!!  所以要判断一个类型 T 是否为 unknown, 就使用 unknown extends T
 * !!!  不能使用 any
 * TODO  这里存在一个问题, 如果把 ActionWithExtra 拆分为两个步骤会得到不同结果
 * TODO  大概猜想是由于 '分布式条件类型'/'裸类型' 引起的, 后期找时间测试, 这里的知识点还不是很清晰
 * TODO  两个步骤如下:
 * TODO  type AWE1<T> = T extends (key: any, extre: infer R1) => any ? R1 : never
 * TODO  type AWE1<T> = unknown extends T ? never : T;
 */
type ActionWithExtra<T> = T extends (key: infer R, extre: infer R1) => any
  ? unknown extends R1
    ? never
    : R
  : never;

type WithExtra = ActionWithExtra<ReducerProcesser<AllReducer>>;
type NoExtea = Exclude<keyof AllReducer, WithExtra>;

type WithExtraObj = Pick<AllReducer, WithExtra>;

// ---------------------------
// type FunctionWithExtra = <T extends keyof WithExtraObj>(
//   type: T,
//   extra: GetExtre<GetCurAction<T>>
// ) => void;

// type FunctionWithoutExtra = (type: NoExtea) => void;

// const commit3: FunctionWithoutExtra & FunctionWithExtra = () => {};
// ---------------------------

// function commit3(type: NoExtea);
// function commit3<T extends keyof WithExtraObj>(
//   type: T,
//   extra: GetExtre<GetCurAction<T>>
// ) {}

// commit3('add');

function qwe(name: '123');
function qwe(n: string, extra) {}
// function asd(name: '456')
// function asd(name: string, extra) {
//   if (extra) {
//     console.log('extra');
//   } else {
//     console.log('name');
//   }
// }

// use Lookup<T, K> instead of T[K] in cases where the compiler
//  cannot verify that K is a key of T
// type Lookup<T, K> = K extends keyof T ? T[K] : never;

// type getKeyProp<T extends keyEnum> = Lookup<UnionToIntersection<keyPropObj[T]>, 'prop'>;

type TestType = ((key: 'a') => any) | ((key: 'b') => any);

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

type T_T = UnionToIntersection<TestType>;

type SectionType = {};

type UToI_1<T> = T extends any ? (k: T) => void : never;
type T1 = UToI_1<TestType>;

// 裸类型
// 这是类型变会变为 分布式条件类型, 所以是 | 的关系
type UToI_2<T> = T extends (k: infer I) => void ? I : never;
type T2 = UToI_2<T1>;

// 注意看这里的区别, 只是给泛型 T 外部的加上 [], 这是 T 的引用不在是裸类型, 不会变为 分布式条件类型, 所以关系是 &
type UToI_2_2<T> = [T] extends [(k: infer I) => void] ? I : never;
type T2_2 = UToI_2_2<T1>;

//
/**
 * 分布式条件形成的条件
 * 裸类型
 * https://stackoverflow.com/questions/50374908/transform-union-type-to-intersection-type#
 * https://www.bilibili.com/video/av754591185?p=1
 * https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html#distributive-conditional-types
 * https://www.tslang.cn/docs/release-notes/typescript-2.8.html
 *
 * TODO
 * https://juejin.cn/post/6844904066179579918
 * https://segmentfault.com/a/1190000018514540?utm_source=tag-newest
 * https://github.com/Microsoft/TypeScript/pull/21496
 */

type getInterSection<T> = [T] extends [(key: infer R) => any] ? R : never;
type T3 = getInterSection<TestType>;

type Obj = { name: string; age: number };
type A = keyof Obj;

// -------------------------------------------------------------------
// 普通 Diff 只能用于简单类型过滤, 想过滤对象的属性diff, 可使用如下增强类型
type Test1 = { name: string; age: number };
type Test2 = { name: string; sex: string };

type DiffKey<T, U> = T extends U ? never : T;

type Diff<T, U> = DiffKey<keyof T, keyof U> | DiffKey<keyof U, keyof T>;

type DiffValue<T, U, Z extends keyof (T & U)> = {
  [K in Z]: (T & U)[K];
};

type DiffObjAttr<T, U> = DiffValue<T, U, Diff<T, U>>;

// 先得到不同的 key
type TempDiffKey = Diff<Test1, Test2>;

// 从两个类型的交叉类型中取出对应的 key
type TempDiffVal = DiffValue<Test1, Test2, TempDiffKey>;

// 最终写法
type ObjDiffAttr = DiffObjAttr<Test1, Test2>;

type Bar<T> = T extends { a: (x: infer U) => void; b: (x: infer U) => void }
  ? U
  : never;
type T21 = Bar<{ a: (x: string) => void; b: (x: number) => void }>;
