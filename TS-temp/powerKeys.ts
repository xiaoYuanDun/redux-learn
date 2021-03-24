/**
 *  加强版 keyof
 *  版本要求: TS 4.2.3+
 *
 *  需求场景介绍:
 *  因为在开发过程中有用到 dva modal 和 immer 特性, 所以我们在更新 modal 中的属性时, 可以直接使用 x.xx.xxx = xxxx 进行属性赋值
 *  这时需要对调用时的 key 进行合法性约束和验证(即必须使用已经存在的属性 key), 这里我们暂时使用 keyof typeof initSate
 *  比如现在 modal 中有如下 state:
 *  const initSate = {
 *    total: 0,
 *    conditions: {
 *      current: 1,
 *      sons: {
 *        age: 14,
 *        sex: 'male'
 *      },
 *    },
 *    name: 'xiao',
 *  };
 *  又有如下 setAttr 方法:
 *  const setAttr = ([key, val]) => {
 *    loadsh.set(state, key, val)
 *  }
 *
 *  当我需要对 total 进行操作时, 直接 setAttr(['total', 123]) 即可, 但是一旦赋值层次变深, key 的约束验证就会发生错误, 如:
 *  我要改变 age, 则 setAttr(['conditions.sons.age', 123]), 这是会发生 TS key 报错
 *  " 'conditions.sons.age' 不属于 'total' | 'conditions' | 'name' "
 *  因为这里我们只拿到可最外层 key 的集合, 实际需要的是遍历整个对象得到所有的 key 集合, 并在非最外层属性key上拼接合适的前缀
 *
 *  以下是具体实现:
 */

const initSate = {
  total: 0,
  conditions: {
    current: 1,
    sons: {
      age: 14,
      sex: 'male',
      colors: [],
    },
  },
  name: 'xiao',
  big: true,
};

type ModalType = typeof initSate;

type ValueOf<T, K extends keyof T = keyof T> = { [key in K]: T[K] }[K];

type AddPrefix<T, S extends string> = T extends string ? `${S}.${T}` : never;

// 数据类型会被判为 object, 这里多做一层判断
type PowerKeys<T, K extends keyof T = keyof T> = ValueOf<
  {
    [key in K]: T[key] extends object
      ? T[key] extends Array<any>
        ? key
        : key | AddPrefix<PowerKeys<T[key]>, key & string>
      : key;
  }
>;

type allKeys = PowerKeys<ModalType>;
