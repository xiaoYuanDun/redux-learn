/**
 *  applyMiddleware 分析:
 *
 *
 *  普通的 createStore 会使用如下方式调用
 *  const store = createStore(reducer, preloadedState, enhancer)
 *  store 会返回 getState, dispatch 等核心方法
 *
 *  若使用中间件, 则需要使用 redux 提供的 applyMiddleware 方法将中间件链式的组合在一起
 *
 *  const store = createStore(reducer, preloadedState, applyMiddlewar(middleware_1, middleware_2, ...middleware_n))
 *  首先看看一个中间件的大致结构(若要编写中间件, 就必须遵循这个结构), 后面会用到:
 *  const loggerMiddleware = (middlewareAPI: { getState, dispatch }) => next => action => {
 *      ...
 *      next(action)
 *      ...
 *  }
 *
 *
 *  applyMiddleware 大体结构如下:
 *  function applyMiddleware = (...middlewares) => (createStore) => (reducer, preloadedState) => { // ... }
 *
 *  1. 第一次调用, 是在 用户自己创建 stroe 时, 传入所有中间件, 下面 compose 时要用到
 *     createStore(reducer, preloadedState, applyMiddleware(logger, thunk))
 *
 *  2. 第二次调用, 是在 createStore 方法内部判断 enhancer 为一个 function 时, 传入 createStore, reducer, preloadedState, 因
 *     为 applyMiddleware 内部还是要使用原始 createStore 方法创建一个原始 store, 从而得到原始 getState, dispatch(因为这些方法
 *     都挂载在 store 上), 这里的 enhancer 就是 applyMiddleware(mw) 返回的结果
 *     enhancer(createStore)(reducer, preloadedState)
 *
 *  3. 通过遍历 middleware 数组, 已 { getState } 为参数调用, 把原始引用全部传入每个 middleware
 *     const middlewareAPI = { getState: store.getState }
 *     const chain = middlewares.map(middleware => middleware(middlewareAPI))
 *
 *  4. 关键步骤: 合成 dispatch, 假设有 mw_1, mw_2, mw_3 三个中间件
 *     dispatch = compose(...chain)(store.dispatch)
 *
 *     那么通过 compose 之后会得到一个函数: (...args) => mw_1(mw_2(mw_3(...args)))
 *     再已 store.dispatch 为参数调用这个函数, 那么此时最后一个中间件 mw_3 得到的 next 参数就是原始的 store.dispatch,
 *     mw_3(store.dispatch) 执行后会得到如下结构的函数:  action => { ..., next(action), ... }, 这里的 next 就是 store.dispatch,
 *     看到这个结构会不会觉得眼熟, 他就是一个 dispatch 变体, 可以理解为一个增强的 dispatch, 里面持有原始 dispatch 的引用, 可以在需要时调用
 *     这里把 mw_3 的执行结果简单记为 dispatch_3, 这时函数会继续执行, dispatch_3 会作为 mw_2 的参数进行调用, 得到 dispatch_2,
 *     以此类推, 最终会得到一个层层嵌套的增强 dispatch 函数:
 *     action => {
 *         ...
 *         //  next(action), 这里的 next 就是 dispatch_2
 *         (action => {
 *             ...
 *             //  next(action), 这里的 next 就是 dispatch_3
 *             (action => {
 *                 ...
 *                 //  next(action), 这里的 next 就是 stroe.dispatch
 *                 store.dispatch(action)
 *                 ...
 *             })(action)
 *             ...
 *         })(action)
 *         ...
 *     }
 *
 */
