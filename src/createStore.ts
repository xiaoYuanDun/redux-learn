// import createStore from "./createStore";

function createStore(reducer, preloadedState, enhancer) {
  
  // 当前 reducer 最新值
  let currentReducer = reducer
  // 当前状态最新值
  let currentState = preloadedState
  /**
   * dispatch 内部会遍历 currentListeners, 通知每个订阅函数
   * 个人认为, currentListeners 更像是一个临时变量
   * 因为 订阅/取消订阅时, 会直接操作 nextListeners
   * 而触发 dispatch 时, 会先把 nextListeners 赋值给 currentListeners, 再遍历 currentListeners
   */
  let currentListeners = []
  // listeners 临时变量
  let nextListeners = currentListeners
  let isDispatching = false


  function ensureCanMutateNextListeners() {
    if(nextListeners === currentListeners) {
      nextListeners = currentListeners.slice()
    }
  }
  
  function getState() {
    return currentState
  }

  function subscribe(listener) {

    ensureCanMutateNextListeners()
    nextListeners.push(listener)
    
    let isSubscribed = true

    return function unsubscribe() {
      if(!isSubscribed) {
        return 
      }

      ensureCanMutateNextListeners()
      const index = nextListeners.indexOf(listener)
      nextListeners.splice(index, 1)

      isSubscribed = false
      currentListeners = null
    }
  }

  function dispatch(action) {
    
    try {
      isDispatching = true
      currentState = currentReducer(currentState, action)
    } finally {
      isDispatching = false
    }

    const listeners = (currentListeners = nextListeners)
    for(let i=0;i<listeners.length;i++) {
      const listener = listeners[i]
      listener()
    }

    return action
  }

  function replaceReducer(nextReducer) {
    currentReducer = nextReducer
    // 和 dispatch INIT 效果类似
    dispatch({ type: 'REPLACE' })

    // 返回同一个 store 实例, 只是替换了其中的 reducer
    return store
  }
  // 这个初始化 dispatch 用于通知所有的子 reducer 返回响应的初始值, 快速构建 store state
  dispatch({ type: 'INIT' })
  
  const store = ({
    subscribe,
    getState,
    dispatch,
    replaceReducer
  }) 

  return store
}


function applyMiddleware(...middlewares) {
  return (createStore) => (reducer, preloadedState) => {
    const store = createStore(reducer, preloadedState)
    let dispatch = () => {
      throw new Error(
        'Dispatching while constructing your middleware is not allowed. ' +
          'Other middleware would not be applied to this dispatch.'
      )
    }

    const middlewareAPI = {
      getState: store.getState,
      dispatch: (action, ...args) => dispatch(action, ...args)
    }
    const chain = middlewares.map(middleware => middleware(middlewareAPI))
    dispatch = compose(...chain)(store.dispatch)

    return {
      ...store,
      dispatch
    }
  }
}


 




// ------------------------------------------------

const reducer1 = (state, action) => {
  if(action.type === 'add') {
    state.count = state.count + 1
  }
  if(action.type === 'lose') {
    state.count = state.count - 1
  }
  return state
}

const initState = { count: 0 }
const store = createStore(reducer1, initState)

const listener1 = () => console.log(store.getState())
// const listener2 = () => console.log(store.getState())

store.subscribe(listener1)
// store.subscribe(listener2)

store.dispatch({type: 'add'})



const a = [1, 2, 3]

const composed = a.reduce((acc, cur) => {
  return (...args) => a(b(...args))
})