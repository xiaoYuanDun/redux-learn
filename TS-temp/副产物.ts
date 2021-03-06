/**
 *
 * 0. 完成此次改造的一些知识储备
 *
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

// ---------------------------------------------------------------------------------------------------------------------

/**
 * 1.
 * 这里可以作为公共的 tsconfig 集成到 sugo-config 中
 * https://www.typescriptlang.org/docs/handbook/tsconfig-json.html
 * https://github.com/tsconfig/bases/
 *
 */

// ---------------------------------------------------------------------------------------------------------------------

/**
 * 2.
 * 这里验证 extends 可选参数的时候, 遇到一个问题
 * 不同的环境执行下面泛型类型, 得到的类型是不同的
 * 后经过测试, 发现是因为 tsconfig 配置文件导致的
 * 这里的问题是 compilerOptions.strict 引起的
 *
 */
type FFFF<T> = T extends (state: any, extra?: infer R) => any
  ? (extra?: R) => any
  : T extends (state: any, extra: infer R1) => any
  ? (extra: R1) => any
  : never;

type Fun = (state: any, extra: number) => any;

type asdasd = FFFF<Fun>;

// ---------------------------------------------------------------------------------------------------------------------

/**
 * 3.
 * 普通 Diff 只能用于简单类型过滤, 想过滤对象的属性diff, 可使用如下增强类型
 */
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

// ---------------------------------------------------------------------------------------------------------------------

/**
 *
 * 4.
 * 整理需求，总结函数类型:
 * 1. reducer 函数有可能不带 payload, 只有一个默认参数 state, 最多2个参数
 * 2. reducer state 参数总是位于第一个
 * 3. effects 函数有可能不带 payload, 只有一个默认 sagaCall 参数, 最多2个参数
 * 4. effects 有2个参数时, payload 位于首位, 有1个参数时, sagaCall 参数位于首位
 */

// 思路1, 全部使用 函数重载进行
// 得到 Model 类型
// type Model = typeof model;

// 得到所有 reducer, effect 包含的 function, 用于后面的类型提示
// type AllReducer = Model['reducer'];
// type AllFunction = AllReducer & Model['effects'];

// type GetOverload<T, K extends keyof T = keyof T> = {
//   [k in K]: (type: k) => any;
// };

// type Values<T, K extends keyof T = keyof T> = T[K];

// type AllTypedObj = GetOverload<AllFunction>;

// type Res1 = Values<AllTypedObj>;

// type Jiagong1<T> = T extends any ? (temp: T) => void : never;
// type r1 = Jiagong1<Res1>;

// type Jiagong2<T> = [T] extends [(k: infer R) => void] ? R : never;
// type r2 = Jiagong2<r1>;

// const commit00: r2 = () => {};

// commit00('extraAction')
